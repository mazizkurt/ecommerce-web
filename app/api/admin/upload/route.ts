import { getCurrentUser } from "@/lib/auth";
import { saveUpload } from "@/lib/storage";

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
      const saved = await saveUpload(file, { convert });
      urls.push(saved.url);
      warnings.push(...saved.warnings);
    }
    return Response.json({ urls, warnings });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Yükleme hatası.";
    return Response.json({ error: message }, { status: 400 });
  }
}
