import {
  and,
  asc,
  count,
  desc,
  eq,
  gt,
  gte,
  inArray,
  ilike,
  lte,
  ne,
  or,
  sql,
  type SQL,
} from "drizzle-orm";
import { cache } from "react";
import { db } from "./db";
import {
  type BannerPlacement,
  banners,
  categories,
  pages,
  productCategories,
  productImages,
  products,
  productVariants,
  reviews,
} from "./db/schema";

export type Category = typeof categories.$inferSelect;
export type CategoryNode = Category & { children: CategoryNode[] };

export const getAllCategories = cache(() =>
  db
    .select()
    .from(categories)
    .orderBy(asc(categories.sortOrder), asc(categories.name)),
);

export function buildCategoryTree(list: Category[]): CategoryNode[] {
  const map = new Map<number, CategoryNode>();
  for (const c of list) map.set(c.id, { ...c, children: [] });
  const roots: CategoryNode[] = [];
  for (const node of map.values()) {
    const parent = node.parentId ? map.get(node.parentId) : undefined;
    if (parent) parent.children.push(node);
    else roots.push(node);
  }
  return roots;
}

function pruneHidden(nodes: CategoryNode[]): CategoryNode[] {
  return nodes
    .filter((n) => n.showInMenu)
    .map((n) => ({ ...n, children: pruneHidden(n.children) }));
}

export const getMenuTree = cache(async () =>
  pruneHidden(buildCategoryTree(await getAllCategories())),
);

export function descendantIds(list: Category[], rootId: number) {
  const ids = [rootId];
  for (let i = 0; i < ids.length; i++) {
    for (const c of list) if (c.parentId === ids[i]) ids.push(c.id);
  }
  return ids;
}

export function categoryTrail(list: Category[], id: number | null) {
  const trail: Category[] = [];
  const seen = new Set<number>();
  let current = list.find((c) => c.id === id);
  while (current && !seen.has(current.id)) {
    seen.add(current.id);
    trail.unshift(current);
    current = list.find((c) => c.id === current!.parentId);
  }
  return trail;
}

export type ProductCardData = {
  id: number;
  name: string;
  slug: string;
  price: number;
  comparePrice: number | null;
  images: string[];
  variants: { id: number; size: string; stock: number }[];
};

const cardColumns = {
  id: products.id,
  name: products.name,
  slug: products.slug,
  price: products.price,
  comparePrice: products.comparePrice,
};

type CardRow = Omit<ProductCardData, "images" | "variants">;

async function hydrateCards(rows: CardRow[]): Promise<ProductCardData[]> {
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);
  const [images, variants] = await Promise.all([
    db
      .select()
      .from(productImages)
      .where(inArray(productImages.productId, ids))
      .orderBy(asc(productImages.sortOrder), asc(productImages.id)),
    db
      .select()
      .from(productVariants)
      .where(inArray(productVariants.productId, ids))
      .orderBy(asc(productVariants.sortOrder), asc(productVariants.id)),
  ]);
  return rows.map((r) => ({
    ...r,
    images: images.filter((i) => i.productId === r.id).map((i) => i.url),
    variants: variants
      .filter((v) => v.productId === r.id)
      .map(({ id, size, stock }) => ({ id, size, stock })),
  }));
}

export type ProductSort = "newest" | "price_asc" | "price_desc" | "discount";

export type ProductFilter = {
  categoryIds?: number[];
  q?: string;
  sizes?: string[];
  minPrice?: number;
  maxPrice?: number;
  isNew?: boolean;
  isTrend?: boolean;
  excludeId?: number;
  sort?: ProductSort;
  page?: number;
  perPage?: number;
};

function buildWhere(f: ProductFilter) {
  const conds: SQL[] = [eq(products.isActive, true)];
  if (f.categoryIds?.length) {
    conds.push(
      inArray(
        products.id,
        db
          .select({ id: productCategories.productId })
          .from(productCategories)
          .where(inArray(productCategories.categoryId, f.categoryIds)),
      ),
    );
  }
  if (f.q) {
    const term = `%${f.q}%`;
    conds.push(or(ilike(products.name, term), ilike(products.code, term))!);
  }
  if (f.sizes?.length) {
    conds.push(
      inArray(
        products.id,
        db
          .select({ id: productVariants.productId })
          .from(productVariants)
          .where(
            and(
              inArray(productVariants.size, f.sizes),
              gt(productVariants.stock, 0),
            ),
          ),
      ),
    );
  }
  if (f.minPrice != null) conds.push(gte(products.price, f.minPrice));
  if (f.maxPrice != null) conds.push(lte(products.price, f.maxPrice));
  if (f.isNew) conds.push(eq(products.isNew, true));
  if (f.isTrend) conds.push(eq(products.isTrend, true));
  if (f.excludeId) conds.push(ne(products.id, f.excludeId));
  return and(...conds);
}

function orderFor(sort: ProductSort | undefined) {
  switch (sort) {
    case "price_asc":
      return [asc(products.price), desc(products.id)];
    case "price_desc":
      return [desc(products.price), desc(products.id)];
    case "discount":
      return [
        desc(
          sql`coalesce((${products.comparePrice} - ${products.price}) * 1.0 / nullif(${products.comparePrice}, 0), 0)`,
        ),
        desc(products.id),
      ];
    default:
      return [desc(products.createdAt), desc(products.id)];
  }
}

export async function getProducts(f: ProductFilter = {}) {
  const where = buildWhere(f);
  const perPage = f.perPage ?? 24;
  const page = Math.max(1, f.page ?? 1);
  const [rows, [{ total }]] = await Promise.all([
    db
      .select(cardColumns)
      .from(products)
      .where(where)
      .orderBy(...orderFor(f.sort))
      .limit(perPage)
      .offset((page - 1) * perPage),
    db.select({ total: count() }).from(products).where(where),
  ]);
  return {
    items: await hydrateCards(rows),
    total,
    page,
    perPage,
    pageCount: Math.max(1, Math.ceil(total / perPage)),
  };
}

/** Kategori sayfasındaki beden filtresi için mevcut bedenler. */
export async function getSizesForCategories(categoryIds: number[]) {
  const rows = await db
    .selectDistinct({ size: productVariants.size })
    .from(productVariants)
    .innerJoin(products, eq(products.id, productVariants.productId))
    .innerJoin(
      productCategories,
      eq(productCategories.productId, productVariants.productId),
    )
    .where(
      and(
        eq(products.isActive, true),
        inArray(productCategories.categoryId, categoryIds),
      ),
    );
  return rows.map((r) => r.size);
}

export const getProductBySlug = cache(async (slug: string) => {
  const product = await db.query.products.findFirst({
    where: and(eq(products.slug, slug), eq(products.isActive, true)),
    with: {
      images: { orderBy: (t, { asc }) => [asc(t.sortOrder), asc(t.id)] },
      variants: { orderBy: (t, { asc }) => [asc(t.sortOrder), asc(t.id)] },
    },
  });
  return product ?? null;
});

/** Aynı renk grubundaki (groupCode) diğer renk ürünleri. */
export async function getColorSiblings(groupCode: string) {
  if (!groupCode) return [];
  return db
    .select({
      id: products.id,
      slug: products.slug,
      colorName: products.colorName,
      colorHex: products.colorHex,
      image: sql<string | null>`(select i.url from product_images i where i.product_id = ${products.id} order by i.sort_order, i.id limit 1)`,
    })
    .from(products)
    .where(and(eq(products.groupCode, groupCode), eq(products.isActive, true)))
    .orderBy(asc(products.id));
}

export async function getProductReviews(productId: number) {
  return db
    .select()
    .from(reviews)
    .where(and(eq(reviews.productId, productId), eq(reviews.isApproved, true)))
    .orderBy(desc(reviews.createdAt));
}

export const getHomeReviews = cache(async () =>
  db
    .select({
      id: reviews.id,
      name: reviews.name,
      rating: reviews.rating,
      comment: reviews.comment,
      productSlug: products.slug,
    })
    .from(reviews)
    .leftJoin(products, eq(products.id, reviews.productId))
    .where(and(eq(reviews.isApproved, true), gte(reviews.rating, 4)))
    .orderBy(desc(reviews.createdAt))
    .limit(12),
);

export const getBanners = cache(async (placement: BannerPlacement) =>
  db
    .select()
    .from(banners)
    .where(and(eq(banners.placement, placement), eq(banners.isActive, true)))
    .orderBy(asc(banners.sortOrder), asc(banners.id)),
);

export const getFooterPages = cache(() =>
  db
    .select({
      slug: pages.slug,
      title: pages.title,
      footerGroup: pages.footerGroup,
    })
    .from(pages)
    .orderBy(asc(pages.sortOrder), asc(pages.id)),
);

export const getPageBySlug = cache(async (slug: string) => {
  const [page] = await db.select().from(pages).where(eq(pages.slug, slug)).limit(1);
  return page;
});
