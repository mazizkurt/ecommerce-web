import type { Metadata } from "next";
import { ListingToolbar } from "@/components/shop/listing-toolbar";
import { Breadcrumb, Pagination, ProductGrid } from "@/components/shop/sections";
import { buildQuery, parseListingParams, toProductFilter } from "@/lib/listing";
import { getAllCategories, getProducts, getSizesForCategories } from "@/lib/queries";
import { getSettings, pricingFrom } from "@/lib/settings";

const LISTS = {
  yeni: { titleKey: "newTitle", filter: { isNew: true } },
  indirim: { titleKey: "trendTitle", filter: { isTrend: true } },
} as const;

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export async function generateMetadata({
  searchParams,
}: PageProps<"/arama">): Promise<Metadata> {
  const [sp, settings] = await Promise.all([searchParams, getSettings()]);
  const list = LISTS[one(sp.liste) as keyof typeof LISTS];
  const q = one(sp.q).trim();
  return { title: list ? settings[list.titleKey] : q ? `"${q}" araması` : "Tüm Ürünler" };
}

export default async function SearchPage({ searchParams }: PageProps<"/arama">) {
  const sp = await searchParams;
  const q = one(sp.q).trim().slice(0, 100);
  const listKey = one(sp.liste) as keyof typeof LISTS;
  const list = LISTS[listKey];
  const listing = parseListingParams(sp);

  const [settings, result, categories] = await Promise.all([
    getSettings(),
    getProducts({
      ...toProductFilter(listing),
      ...(list?.filter ?? {}),
      q: q || undefined,
      perPage: 24,
    }),
    getAllCategories(),
  ]);
  const sizes = await getSizesForCategories(categories.map((c) => c.id));
  const title = list ? settings[list.titleKey] : q ? `"${q}" için arama sonuçları` : "Tüm Ürünler";

  const baseParams: Record<string, string> = {};
  if (q) baseParams.q = q;
  if (list) baseParams.liste = listKey;

  return (
    <div className="pb-6">
      <Breadcrumb items={[{ label: "Ana Sayfa", href: "/" }, { label: title }]} />
      <h1 className="px-[22px] pb-4 text-xl">{title}</h1>
      <ListingToolbar
        current={listing}
        baseParams={baseParams}
        sizes={sizes}
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
        hrefFor={(p) => `/arama${buildQuery(sp, { sayfa: p > 1 ? p : undefined })}`}
      />
    </div>
  );
}
