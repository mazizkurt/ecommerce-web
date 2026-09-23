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
  let data = input;
  let outExt = ext;
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
  return `/uploads/${sub}/${name}`;
}
