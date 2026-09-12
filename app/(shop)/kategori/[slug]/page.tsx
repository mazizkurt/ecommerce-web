import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ListingToolbar } from "@/components/shop/listing-toolbar";
import { Breadcrumb, Pagination, ProductGrid } from "@/components/shop/sections";
import { buildQuery, parseListingParams, toProductFilter } from "@/lib/listing";
import {
  categoryTrail,
  descendantIds,
  getAllCategories,
  getProducts,
  getSizesForCategories,
} from "@/lib/queries";
import { getSettings, pricingFrom } from "@/lib/settings";

export async function generateMetadata({
  params,
}: PageProps<"/kategori/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const category = (await getAllCategories()).find((c) => c.slug === slug);
  return {
    title: category?.metaTitle || category?.name || "Kategori",
    description: category?.description || undefined,
    alternates: category ? { canonical: `/kategori/${category.slug}` } : undefined,
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: PageProps<"/kategori/[slug]">) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const all = await getAllCategories();
  const category = all.find((c) => c.slug === slug);
  if (!category) notFound();

  const ids = descendantIds(all, category.id);
  const listing = parseListingParams(sp);
  const [settings, result, sizes] = await Promise.all([
    getSettings(),
    getProducts({ ...toProductFilter(listing), categoryIds: ids, perPage: 24 }),
    getSizesForCategories(ids),
  ]);
  const trail = categoryTrail(all, category.id);
  const subcategories = all
    .filter((c) => c.parentId === category.id)
    .map((c) => ({ name: c.name, slug: c.slug }));

  return (
    <div className="pb-6">
      <Breadcrumb
        items={[
          { label: "Ana Sayfa", href: "/" },
          ...trail.map((c, i) => ({
            label: c.name,
            href: i < trail.length - 1 ? `/kategori/${c.slug}` : undefined,
          })),
        ]}
      />
      {category.imageUrl && (
        <div className="relative mx-[3px] mb-[5px] aspect-[1920/500] overflow-hidden bg-soft">
          <Image src={category.imageUrl} alt={category.name} fill priority sizes="100vw" className="object-cover" />
        </div>
      )}
      <ListingToolbar
        current={listing}
        sizes={sizes}
        subcategories={subcategories}
        total={result.total}
      />
      <ProductGrid
        items={result.items}
        cartDiscountPercent={pricingFrom(settings).cartDiscountPercent}
        titleStyle="normal"
      />
      <Pagination
        page={result.page}
        pageCount={result.pageCount}
        hrefFor={(p) => `/kategori/${slug}${buildQuery(sp, { sayfa: p > 1 ? p : undefined })}`}
      />
    </div>
  );
}
