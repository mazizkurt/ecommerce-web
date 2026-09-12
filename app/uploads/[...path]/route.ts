import { open, stat } from "node:fs/promises";
import path from "node:path";
import { MIME_BY_EXT, UPLOAD_DIR } from "@/lib/storage";

const notFound = () => new Response("Bulunamadı", { status: 404 });

export async function GET(
  request: Request,
  ctx: RouteContext<"/uploads/[...path]">,
) {
  const { path: parts } = await ctx.params;
  const filePath = path.resolve(UPLOAD_DIR, ...parts);
  if (!filePath.startsWith(UPLOAD_DIR + path.sep)) return notFound();

  const type = MIME_BY_EXT[path.extname(filePath).slice(1).toLowerCase()];
  if (!type) return notFound();

  const info = await stat(filePath).catch(() => null);
  if (!info?.isFile()) return notFound();

  const headers = new Headers({
    "Content-Type": type,
    "Cache-Control": "public, max-age=31536000, immutable",
    "X-Content-Type-Options": "nosniff",
    "Accept-Ranges": "bytes",
  });

  // Safari videoları yalnızca Range isteklerini destekleyen sunuculardan oynatır.
  let start = 0;
  let end = info.size - 1;
  let status = 200;
  const range = /^bytes=(\d*)-(\d*)$/.exec(request.headers.get("range") ?? "");
  if (range) {
    if (range[1]) start = Number(range[1]);
    if (range[2]) end = Math.min(Number(range[2]), end);
    if (!range[1] && range[2]) start = Math.max(0, info.size - Number(range[2]));
    if (start > end || start >= info.size) {
      return new Response(null, {
        status: 416,
        headers: { "Content-Range": `bytes */${info.size}` },
      });
    }
    status = 206;
    headers.set("Content-Range", `bytes ${start}-${end}/${info.size}`);
  }

  const length = end - start + 1;
  headers.set("Content-Length", String(length));
  const handle = await open(filePath, "r");
  const buffer = new Uint8Array(new ArrayBuffer(length));
  try {
    await handle.read(buffer, 0, length, start);
  } finally {
    await handle.close();
  }
  return new Response(buffer, { status, headers });
}
