import { eq } from "drizzle-orm";
import { Copy, ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ConfirmForm } from "@/components/admin/form-client";
import { ProductForm } from "@/components/admin/product-form";
import { btnSecondary, PageHeader } from "@/components/admin/ui";
import { deleteProduct, duplicateProduct } from "@/lib/actions/admin";
import { requireAdmin } from "@/lib/auth";
import { flattenCategories } from "@/lib/category-utils";
import { db } from "@/lib/db";
import { products } from "@/lib/db/schema";
import { getAllCategories } from "@/lib/queries";
import { getSettings, pricingFrom } from "@/lib/settings";

export const metadata: Metadata = { title: "Ürünü Düzenle" };

export default async function EditProductPage({ params, searchParams }: PageProps<"/admin/urunler/[id]">) {
  await requireAdmin();
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const [product, categories, settings] = await Promise.all([
    db.query.products.findFirst({
      where: eq(products.id, Number(id) || 0),
      with: {
        images: { orderBy: (t, { asc }) => [asc(t.sortOrder), asc(t.id)] },
        variants: { orderBy: (t, { asc }) => [asc(t.sortOrder), asc(t.id)] },
        categoryLinks: true,
      },
    }),
    getAllCategories(),
    getSettings(),
  ]);
  if (!product) notFound();

  return (
    <>
      <PageHeader
        title={product.name}
        back={{ href: "/admin/urunler", label: "Ürünler" }}
        description={
          sp.kaydedildi
            ? "Ürün oluşturuldu."
            : sp.kopyalandi
              ? "Kopya oluşturuldu: satış dışı ve stoksuz başladı. Adını, rengini, görsellerini ve stoklarını güncelleyip satışa açın."
              : undefined
        }
        actions={
          <>
            <Link href={`/urun/${product.slug}`} target="_blank" className={btnSecondary}>
              <ExternalLink className="size-4" /> Mağazada gör
            </Link>
            <form action={duplicateProduct}>
              <input type="hidden" name="id" value={product.id} />
              <button type="submit" className={btnSecondary}>
                <Copy className="size-4" /> Kopyala (yeni renk)
              </button>
            </form>
            <ConfirmForm
              action={deleteProduct}
              id={product.id}
              message="Bu ürün kalıcı olarak silinecek. Emin misiniz? (Geçici olarak gizlemek için 'Satışta' seçeneğini kapatabilirsiniz.)"
            >
              Sil
            </ConfirmForm>
          </>
        }
      />
      <ProductForm
        product={{
          id: product.id,
          name: product.name,
          slug: product.slug,
          code: product.code,
          description: product.description,
          price: product.price,
          comparePrice: product.comparePrice,
          categoryId: product.categoryId,
          extraCategoryIds: product.categoryLinks
            .map((l) => l.categoryId)
            .filter((c) => c !== product.categoryId),
          isActive: product.isActive,
          isNew: product.isNew,
          isTrend: product.isTrend,
          colorName: product.colorName,
          colorHex: product.colorHex,
          groupCode: product.groupCode,
          metaTitle: product.metaTitle,
          metaDescription: product.metaDescription,
          images: product.images.map((i) => i.url),
          variants: product.variants.map(({ id, size, stock }) => ({ id, size, stock })),
        }}
        categories={flattenCategories(categories)}
        cartDiscountPercent={pricingFrom(settings).cartDiscountPercent}
      />
    </>
  );
}
