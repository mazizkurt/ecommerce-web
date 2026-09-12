import { eq } from "drizzle-orm";
import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { pages, products } from "@/lib/db/schema";
import { getAllCategories } from "@/lib/queries";
import { getSettings, siteUrlFrom } from "@/lib/settings";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrlFrom(await getSettings());
  const [categories, productRows, pageRows] = await Promise.all([
    getAllCategories(),
    db
      .select({ slug: products.slug, updatedAt: products.updatedAt })
      .from(products)
      .where(eq(products.isActive, true)),
    db.select({ slug: pages.slug }).from(pages),
  ]);

  return [
    { url: base, changeFrequency: "daily", priority: 1 },
    ...categories.map((c) => ({
      url: `${base}/kategori/${c.slug}`,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
    ...productRows.map((p) => ({
      url: `${base}/urun/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...pageRows.map((p) => ({
      url: `${base}/sayfa/${p.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.3,
    })),
  ];
}
