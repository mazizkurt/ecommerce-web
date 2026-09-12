import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

// Yüklenen dosyalar derleme sonrasında da sunulabilmesi için public/ yerine
// storage/uploads altında tutulur ve app/uploads route'u ile servis edilir.
export const UPLOAD_DIR = path.join(process.cwd(), "storage", "uploads");
export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

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

export async function saveUpload(file: File) {
  const ext = EXT_BY_MIME[file.type];
  if (!ext) throw new Error(`Desteklenmeyen dosya türü: ${file.type || "?"}`);
  if (file.size > MAX_UPLOAD_BYTES) throw new Error("Dosya 25 MB'tan büyük.");
  const now = new Date();
  const sub = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}`;
  const dir = path.join(UPLOAD_DIR, sub);
  await mkdir(dir, { recursive: true });
  const name = `${randomUUID()}.${ext}`;
  await writeFile(path.join(dir, name), Buffer.from(await file.arrayBuffer()));
  return `/uploads/${sub}/${name}`;
}
