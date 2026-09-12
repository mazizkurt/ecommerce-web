import type { MetadataRoute } from "next";
import { getSettings, siteUrlFrom } from "@/lib/settings";

export const revalidate = 3600;

export default async function robots(): Promise<MetadataRoute.Robots> {
  const base = siteUrlFrom(await getSettings());
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/api",
        "/hesabim",
        "/odeme",
        "/sepet",
        "/siparis",
        "/giris",
        "/uye-ol",
        "/sifremi-unuttum",
        "/sifre-sifirla",
      ],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
