import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

// Yüklenen dosyalar derleme sonrasında da sunulabilmesi için public/ yerine
// storage/uploads altında tutulur ve app/uploads route'u ile servis edilir.
// Sunucuda kalıcı disk başka bir yola bağlıysa UPLOAD_DIR ile değiştirilebilir.
export const UPLOAD_DIR =
  process.env.UPLOAD_DIR || path.join(process.cwd(), "storage", "uploads");
export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;
/** Kaydedilen görselin en uzun kenarı; daha büyük görseller küçültülür. */
const MAX_IMAGE_SIDE = 2400;

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/gif": "gif",
  "video/mp4": "mp4",
  "video/webm": "webm",
};

export const MIME_BY_EXT: Record<string, string> = Object.fromEntries(
  Object.entries(EXT_BY_MIME).map(([mime, ext]) => [ext, mime]),
);

/** WebP'ye çevrilen türler; gif (animasyon) ve videolar olduğu gibi kaydedilir. */
const CONVERTIBLE = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);

/** Görseli WebP'ye çevirir, çok büyükse küçültür. Sonuç orijinalden büyükse orijinali korur. */
async function toWebp(input: Buffer) {
  const image = sharp(input, { failOn: "none" });
  const meta = await image.metadata();
  const tooBig = (meta.width ?? 0) > MAX_IMAGE_SIDE || (meta.height ?? 0) > MAX_IMAGE_SIDE;
  const pipeline = image.rotate(); // EXIF yönünü uygula
  if (tooBig) {
    pipeline.resize({
      width: MAX_IMAGE_SIDE,
      height: MAX_IMAGE_SIDE,
      fit: "inside",
      withoutEnlargement: true,
    });
  }
  // Saydam görsellerde (logo gibi) kenar bozulmasın diye daha yüksek kalite.
  const data = await pipeline
    .webp(meta.hasAlpha ? { quality: 90, alphaQuality: 100 } : { quality: 80 })
    .toBuffer();
  return data.length < input.length || tooBig ? { data, ext: "webp" } : null;
}

type Atom = { type: string; start: number; size: number; header: number };

/** [start, end) aralığındaki MP4 kutularını okur; yapı bozuksa null döner. */
function readAtoms(buf: Buffer, start: number, end: number): Atom[] | null {
  const atoms: Atom[] = [];
  let offset = start;
  while (offset + 8 <= end) {
    let size = buf.readUInt32BE(offset);
    let header = 8;
    const type = buf.toString("latin1", offset + 4, offset + 8);
    if (size === 1) {
      if (offset + 16 > end) return null;
      const big = buf.readBigUInt64BE(offset + 8);
      if (big > BigInt(Number.MAX_SAFE_INTEGER)) return null;
      size = Number(big);
      header = 16;
    } else if (size === 0) {
      size = end - offset;
    }
    if (size < header || offset + size > end) return null;
    atoms.push({ type, start: offset, size, header });
    offset += size;
  }
  return offset === end ? atoms : null;
}

/** Oynatma bilgisindeki (moov) chunk adreslerini `shift` bayt kaydırır. */
function shiftChunkOffsets(moov: Buffer, start: number, end: number, shift: number): boolean {
  const atoms = readAtoms(moov, start, end);
  if (!atoms) return false;
  for (const atom of atoms) {
    const body = atom.start + atom.header;
    const atomEnd = atom.start + atom.size;
    if (atom.type === "cmov") return false; // sıkıştırılmış moov desteklenmiyor
    if (["trak", "mdia", "minf", "stbl"].includes(atom.type)) {
      if (!shiftChunkOffsets(moov, body, atomEnd, shift)) return false;
    } else if (atom.type === "stco" || atom.type === "co64") {
      const width = atom.type === "stco" ? 4 : 8;
      if (body + 8 > atomEnd) return false;
      const count = moov.readUInt32BE(body + 4);
      if (body + 8 + count * width > atomEnd) return false;
      for (let i = 0; i < count; i++) {
        const pos = body + 8 + i * width;
        if (width === 4) {
          const value = moov.readUInt32BE(pos) + shift;
          if (value > 0xffffffff) return false;
          moov.writeUInt32BE(value, pos);
        } else {
          moov.writeBigUInt64BE(moov.readBigUInt64BE(pos) + BigInt(shift), pos);
        }
      }
    }
  }
  return true;
}

/**
 * "Faststart": oynatma bilgisini (moov) video verisinin (mdat) önüne taşır, böylece
 * tarayıcı videoyu inerken oynatabilir. Görüntü/ses yeniden işlenmez, yalnızca kutuların
 * sırası ve moov içindeki adresler güncellenir (ffmpeg -movflags +faststart ile aynı).
 * Zaten uygunsa ya da dosya beklenmedik bir yapıdaysa null döner; dosya olduğu gibi kalır.
 */
export function faststartMp4(input: Buffer): Buffer | null {
  const top = readAtoms(input, 0, input.length);
  if (!top) return null;
  const moovIndex = top.findIndex((a) => a.type === "moov");
  const mdatIndex = top.findIndex((a) => a.type === "mdat");
  if (moovIndex === -1 || mdatIndex === -1 || moovIndex < mdatIndex) return null;
  // Parçalı MP4, birden çok moov ya da moov'dan sonra gelen veri: dokunma.
  if (top.some((a) => a.type === "moof")) return null;
  if (top.filter((a) => a.type === "moov").length > 1) return null;
  if (top.slice(moovIndex + 1).some((a) => a.type === "mdat")) return null;

  const moovAtom = top[moovIndex];
  const moov = Buffer.from(input.subarray(moovAtom.start, moovAtom.start + moovAtom.size));
  // moov, mdat'ın önüne geçince tüm video verisi moov boyutu kadar ileri kayar.
  if (!shiftChunkOffsets(moov, moovAtom.header, moov.length, moovAtom.size)) return null;

  const parts: Buffer[] = [];
  top.forEach((atom, i) => {
    if (i === moovIndex) return;
    if (i === mdatIndex) parts.push(moov);
    parts.push(input.subarray(atom.start, atom.start + atom.size));
  });
  return Buffer.concat(parts);
}

/**
 * MP4'te oynatma bilgisi (moov kutusu) dosyanın sonundaysa Safari videoyu
 * başlatmadan önce dosyanın tamamını indirir; video geç başlar ya da hiç başlamaz.
 * Sadece dosyanın başındaki kutu başlıklarına bakar.
 */
export function mp4MoovAtEnd(head: Buffer) {
  let offset = 0;
  while (offset + 8 <= head.length) {
    let size = head.readUInt32BE(offset);
    const type = head.toString("ascii", offset + 4, offset + 8);
    if (type === "moov") return false;
    if (type === "mdat") return true;
    if (size === 1) {
      if (offset + 16 > head.length) return false;
      size = Number(head.readBigUInt64BE(offset + 8));
    }
    if (size < 8) return false;
    offset += size;
  }
  // Başlıklar tampondan taştı: büyük bir kutu (çoğunlukla mdat) moov'dan önce geliyor.
  return true;
}

export async function saveUpload(file: File, { convert = true } = {}) {
  const ext = EXT_BY_MIME[file.type];
  if (!ext) throw new Error(`Desteklenmeyen dosya türü: ${file.type || "?"}`);
  if (file.size > MAX_UPLOAD_BYTES) throw new Error("Dosya 25 MB'tan büyük.");

  const input = Buffer.from(await file.arrayBuffer());
  let data: Buffer = input;
  let outExt = ext;
  const warnings: string[] = [];

  if (file.type === "video/mp4") {
    const fixed = faststartMp4(input);
    if (fixed) data = fixed;
    else if (mp4MoovAtEnd(input.subarray(0, 1 << 16))) {
      warnings.push(
        "Video web için optimize edilemedi: iPhone'da başlamadan önce dosyanın tamamı indirilir. Düzeltmek için: ffmpeg -i video.mp4 -c copy -movflags +faststart yeni.mp4",
      );
    }
    if (file.size > 8 * 1024 * 1024) {
      warnings.push(
        `Video ${(file.size / 1024 / 1024).toFixed(1)} MB. Mobilde hızlı açılması için 8 MB altını hedefleyin.`,
      );
    }
  }
  if (convert && CONVERTIBLE.has(file.type)) {
    try {
      const webp = await toWebp(input);
      if (webp) {
        data = webp.data;
        outExt = webp.ext;
      }
    } catch {
      // Dönüştürülemeyen görsel olduğu gibi kaydedilir.
    }
  }

  const now = new Date();
  const sub = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}`;
  const dir = path.join(UPLOAD_DIR, sub);
  await mkdir(dir, { recursive: true });
  const name = `${randomUUID()}.${outExt}`;
  await writeFile(path.join(dir, name), data);
  return { url: `/uploads/${sub}/${name}`, warnings };
}
