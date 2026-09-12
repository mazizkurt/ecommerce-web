import { requireAdmin } from "@/lib/auth";
import { and, count, desc, eq, ilike, inArray, or, sql, type SQL } from "drizzle-orm";
import { Plus, Search } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Badge, btnPrimary, btnSecondary, EmptyState, inputBase, inputCls, PageHeader, Table } from "@/components/admin/ui";
import { flattenCategories } from "@/lib/category-utils";
import { toggleProductActive } from "@/lib/actions/admin";
import { db } from "@/lib/db";
import { categories, productCategories, products } from "@/lib/db/schema";
import { formatPrice } from "@/lib/format";
import { getAllCategories } from "@/lib/queries";

export const metadata: Metadata = { title: "Ürünler" };

const PER_PAGE = 50;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

const stockSql = sql<number>`(select coalesce(sum(v.stock), 0) from product_variants v where v.product_id = ${products.id})`.mapWith(Number);
const imageSql = sql<string | null>`(select i.url from product_images i where i.product_id = ${products.id} order by i.sort_order, i.id limit 1)`;

export default async function ProductsPage({ searchParams }: PageProps<"/admin/urunler">) {
  await requireAdmin();
  const sp = await searchParams;
  const q = one(sp.q).trim();
  const categoryId = Number(one(sp.kategori)) || null;
  const status = one(sp.durum);
  const page = Math.max(1, Number(one(sp.sayfa)) || 1);

  const conds: SQL[] = [];
  if (q) conds.push(or(ilike(products.name, `%${q}%`), ilike(products.code, `%${q}%`))!);
  if (categoryId) {
    conds.push(
      inArray(
        products.id,
        db.select({ id: productCategories.productId }).from(productCategories).where(eq(productCategories.categoryId, categoryId)),
      ),
    );
  }
  if (status === "aktif") conds.push(eq(products.isActive, true));
  if (status === "pasif") conds.push(eq(products.isActive, false));
  if (status === "stoksuz") conds.push(sql`${stockSql} = 0`);
  const where = conds.length ? and(...conds) : undefined;

  const [rows, [{ total }], allCategories] = await Promise.all([
    db
      .select({
        id: products.id,
        name: products.name,
        code: products.code,
        price: products.price,
        comparePrice: products.comparePrice,
        isActive: products.isActive,
        isNew: products.isNew,
        isTrend: products.isTrend,
        category: categories.name,
        stock: stockSql,
        image: imageSql,
      })
      .from(products)
      .leftJoin(categories, eq(categories.id, products.categoryId))
      .where(where)
      .orderBy(desc(products.createdAt), desc(products.id))
      .limit(PER_PAGE)
      .offset((page - 1) * PER_PAGE),
    db.select({ total: count() }).from(products).where(where),
    getAllCategories(),
  ]);
  const pageCount = Math.max(1, Math.ceil(total / PER_PAGE));
  const qs = (p: number) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (categoryId) params.set("kategori", String(categoryId));
    if (status) params.set("durum", status);
    if (p > 1) params.set("sayfa", String(p));
    return `/admin/urunler?${params}`;
  };

  return (
    <>
      <PageHeader
        title="Ürünler"
        description={`${total} ürün`}
        actions={
          <Link href="/admin/urunler/yeni" className={btnPrimary}>
            <Plus className="size-4" /> Yeni Ürün
          </Link>
        }
      />

      <form className="mb-4 flex flex-wrap gap-2">
        <div className="relative min-w-60 flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
          <input name="q" defaultValue={q} placeholder="Ürün adı veya kodu ara" className={`${inputCls} pl-9`} />
        </div>
        <select name="kategori" defaultValue={categoryId ?? ""} className={inputBase}>
          <option value="">Tüm kategoriler</option>
          {flattenCategories(allCategories).map((c) => (
            <option key={c.id} value={c.id}>
              {"— ".repeat(c.depth)}
              {c.name}
            </option>
          ))}
        </select>
        <select name="durum" defaultValue={status} className={inputBase}>
          <option value="">Tüm durumlar</option>
          <option value="aktif">Satışta</option>
          <option value="pasif">Satış dışı</option>
          <option value="stoksuz">Stoğu tükenen</option>
        </select>
        <button type="submit" className={btnSecondary}>
          Filtrele
        </button>
      </form>

      {rows.length === 0 ? (
        <EmptyState
          title="Ürün bulunamadı."
          action={
            <Link href="/admin/urunler/yeni" className={btnPrimary}>
              <Plus className="size-4" /> İlk ürünü ekle
            </Link>
          }
        />
      ) : (
        <Table>
          <thead>
            <tr>
              <th className="w-16" />
              <th>Ürün</th>
              <th>Kategori</th>
              <th>Fiyat</th>
              <th>Stok</th>
              <th>Durum</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id} className="hover:bg-zinc-50">
                <td>
                  <div className="h-14 w-10 overflow-hidden rounded bg-zinc-100">
                    {p.image && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.image} alt="" className="size-full object-cover" />
                    )}
                  </div>
                </td>
                <td>
                  <Link href={`/admin/urunler/${p.id}`} className="font-medium hover:underline">
                    {p.name}
                  </Link>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-zinc-500">
                    {p.code && <span>{p.code}</span>}
                    {p.isNew && <Badge>Yeni</Badge>}
                    {p.isTrend && <Badge>İndirim trendi</Badge>}
                  </div>
                </td>
                <td className="text-zinc-600">{p.category ?? "—"}</td>
                <td className="tabular-nums">
                  {formatPrice(p.price)}
                  {p.comparePrice && (
                    <span className="block text-xs text-zinc-400 line-through">{formatPrice(p.comparePrice)}</span>
                  )}
                </td>
                <td className="tabular-nums">
                  {p.stock === 0 ? (
                    <Badge className="bg-red-50 text-red-700 ring-red-200">Tükendi</Badge>
                  ) : (
                    p.stock
                  )}
                </td>
                <td>
                  <form action={toggleProductActive}>
                    <input type="hidden" name="id" value={p.id} />
                    <button type="submit" title="Durumu değiştir">
                      {p.isActive ? (
                        <Badge className="bg-emerald-50 text-emerald-700 ring-emerald-200">Satışta</Badge>
                      ) : (
                        <Badge>Satış dışı</Badge>
                      )}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      {pageCount > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-zinc-500">
            Sayfa {page} / {pageCount}
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link href={qs(page - 1)} className={btnSecondary}>
                ← Önceki
              </Link>
            )}
            {page < pageCount && (
              <Link href={qs(page + 1)} className={btnSecondary}>
                Sonraki →
              </Link>
            )}
          </div>
        </div>
      )}
    </>
  );
}
