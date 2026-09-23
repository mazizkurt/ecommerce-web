import { getCurrentUser } from "@/lib/auth";
import { mp4MoovAtEnd, saveUpload } from "@/lib/storage";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return Response.json({ error: "Yetkisiz işlem." }, { status: 401 });
  }

  const form = await request.formData();
  const files = form.getAll("file").filter((f): f is File => f instanceof File);
  // Favicon ve paylaşım görseli WebP'ye çevrilmez (tarayıcı ikonu ve sosyal medya önizlemeleri için).
  const convert = form.get("convert") !== "0";
  if (files.length === 0) {
    return Response.json({ error: "Dosya seçilmedi." }, { status: 400 });
  }

  try {
    const urls: string[] = [];
    const warnings: string[] = [];
    for (const file of files) {
      if (file.type === "video/mp4") {
        const head = Buffer.from(await file.slice(0, 1 << 16).arrayBuffer());
        if (mp4MoovAtEnd(head)) {
          warnings.push(
            "Video web için optimize edilmemiş: iPhone'da başlamadan önce dosyanın tamamı indirilir. Düzeltmek için: ffmpeg -i video.mp4 -c copy -movflags +faststart yeni.mp4",
          );
        }
        if (file.size > 8 * 1024 * 1024) {
          warnings.push(
            `Video ${(file.size / 1024 / 1024).toFixed(1)} MB. Mobilde hızlı açılması için 8 MB altını hedefleyin.`,
          );
        }
      }
      urls.push(await saveUpload(file, { convert }));
    }
    return Response.json({ urls, warnings });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Yükleme hatası.";
    return Response.json({ error: message }, { status: 400 });
  }
}
