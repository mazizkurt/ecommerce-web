"use client";

import { ArrowLeft, ArrowRight, ImagePlus, LoaderCircle, X } from "lucide-react";
import { useRef, useState } from "react";
import { cn } from "@/lib/cn";

const isVideo = (url: string) => /\.(mp4|webm)(\?|$)/i.test(url);

/**
 * Görselleri /api/admin/upload'a yükler ve URL listesini gizli input'ta tutar.
 * multiple=false olduğunda input değeri tek bir URL'dir.
 */
export function ImageUploader({
  name,
  initial,
  multiple = true,
  accept = "image/jpeg,image/png,image/webp,image/avif",
  aspect = "aspect-[2/3]",
  label = "Görsel yükle",
  fit = "cover",
}: {
  name: string;
  initial: string[];
  multiple?: boolean;
  accept?: string;
  aspect?: string;
  label?: string;
  fit?: "cover" | "contain";
}) {
  const [urls, setUrls] = useState(initial.filter(Boolean));
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    setError(null);
    const body = new FormData();
    for (const f of Array.from(files)) body.append("file", f);
    try {
      const res = await fetch("/api/admin/upload", { method: "POST", body });
      const data = (await res.json()) as { urls?: string[]; error?: string };
      if (!res.ok || !data.urls) throw new Error(data.error ?? "Yükleme başarısız.");
      setUrls((prev) => (multiple ? [...prev, ...data.urls!] : data.urls!.slice(0, 1)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Yükleme başarısız.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  const move = (i: number, dir: -1 | 1) =>
    setUrls((prev) => {
      const next = [...prev];
      const j = i + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  return (
    <div>
      <input type="hidden" name={name} value={multiple ? JSON.stringify(urls) : (urls[0] ?? "")} />
      <div className={cn("grid gap-3", multiple ? "grid-cols-3 sm:grid-cols-4 lg:grid-cols-5" : "grid-cols-1 sm:max-w-sm")}>
        {urls.map((url, i) => (
          <div key={url + i} className={cn("group relative overflow-hidden rounded-md border border-zinc-200 bg-zinc-50", aspect)}>
            {isVideo(url) ? (
              <video src={url} muted className={cn("size-full", fit === "contain" ? "object-contain" : "object-cover")} />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={url} alt="" className={cn("size-full", fit === "contain" ? "object-contain p-2" : "object-cover")} />
            )}
            {multiple && i === 0 && (
              <span className="absolute left-1.5 top-1.5 rounded bg-zinc-900 px-1.5 py-0.5 text-[10px] font-medium text-white">
                Kapak
              </span>
            )}
            <div className="absolute inset-x-0 bottom-0 flex justify-between bg-gradient-to-t from-black/60 to-transparent p-1.5 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100">
              {multiple ? (
                <span className="flex gap-1">
                  <button type="button" onClick={() => move(i, -1)} aria-label="Sola taşı" className="rounded bg-white/90 p-1">
                    <ArrowLeft className="size-3.5" />
                  </button>
                  <button type="button" onClick={() => move(i, 1)} aria-label="Sağa taşı" className="rounded bg-white/90 p-1">
                    <ArrowRight className="size-3.5" />
                  </button>
                </span>
              ) : (
                <span />
              )}
              <button
                type="button"
                onClick={() => setUrls((prev) => prev.filter((_, j) => j !== i))}
                aria-label="Kaldır"
                className="rounded bg-white/90 p-1 text-red-600"
              >
                <X className="size-3.5" />
              </button>
            </div>
          </div>
        ))}
        {(multiple || urls.length === 0) && (
          <label
            className={cn(
              "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-zinc-300 bg-white text-center text-xs text-zinc-500 transition hover:border-zinc-500 hover:text-zinc-800",
              aspect,
            )}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              void upload(e.dataTransfer.files);
            }}
          >
            {uploading ? <LoaderCircle className="size-6 animate-spin" /> : <ImagePlus className="size-6" />}
            <span className="px-2">{uploading ? "Yükleniyor..." : label}</span>
            <input
              ref={fileRef}
              type="file"
              accept={accept}
              multiple={multiple}
              disabled={uploading}
              onChange={(e) => void upload(e.target.files)}
              className="sr-only"
            />
          </label>
        )}
      </div>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
