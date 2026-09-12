import { requireAdmin } from "@/lib/auth";
import type { Metadata } from "next";
import { ProductForm } from "@/components/admin/product-form";
import { PageHeader } from "@/components/admin/ui";
import { flattenCategories } from "@/lib/category-utils";
import { getAllCategories } from "@/lib/queries";
import { getSettings, pricingFrom } from "@/lib/settings";

export const metadata: Metadata = { title: "Yeni Ürün" };

export default async function NewProductPage() {
  await requireAdmin();
  const [categories, settings] = await Promise.all([getAllCategories(), getSettings()]);
  return (
    <>
      <PageHeader title="Yeni Ürün" back={{ href: "/admin/urunler", label: "Ürünler" }} />
      <ProductForm
        product={null}
        categories={flattenCategories(categories)}
        cartDiscountPercent={pricingFrom(settings).cartDiscountPercent}
      />
    </>
  );
}
