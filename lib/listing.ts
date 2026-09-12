import type { ProductSort } from "./queries";

type SearchParams = Record<string, string | string[] | undefined>;

const SORTS: ProductSort[] = ["newest", "price_asc", "price_desc", "discount"];

const first = (v: string | string[] | undefined) =>
  Array.isArray(v) ? v[0] : v;

export type ListingParams = {
  sort: ProductSort;
  page: number;
  sizes: string[];
  min?: number; // TL
  max?: number; // TL
};

export function parseListingParams(sp: SearchParams): ListingParams {
  const sort = first(sp.sirala) as ProductSort | undefined;
  const page = Number.parseInt(first(sp.sayfa) ?? "1", 10);
  const sizes = (first(sp.beden) ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 10);
  const min = Number.parseFloat(first(sp.min) ?? "");
  const max = Number.parseFloat(first(sp.max) ?? "");
  return {
    sort: sort && SORTS.includes(sort) ? sort : "newest",
    page: Number.isFinite(page) && page > 0 ? page : 1,
    sizes,
    min: Number.isFinite(min) && min >= 0 ? min : undefined,
    max: Number.isFinite(max) && max > 0 ? max : undefined,
  };
}

/** ListingParams'ı getProducts filtresine çevirir (TL -> kuruş). */
export function toProductFilter(p: ListingParams) {
  return {
    sort: p.sort,
    page: p.page,
    sizes: p.sizes,
    minPrice: p.min != null ? Math.round(p.min * 100) : undefined,
    maxPrice: p.max != null ? Math.round(p.max * 100) : undefined,
  };
}

/** Mevcut arama parametrelerini koruyarak yeni bir query string üretir. */
export function buildQuery(
  sp: SearchParams,
  patch: Record<string, string | number | undefined>,
) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(sp)) {
    const v = first(value);
    if (v) params.set(key, v);
  }
  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined || value === "") params.delete(key);
    else params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}
