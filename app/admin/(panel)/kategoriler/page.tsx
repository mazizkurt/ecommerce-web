import { count } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { CategoryForm } from "@/components/admin/forms";
import { Badge, Card, PageHeader, Table } from "@/components/admin/ui";
import { flattenCategories } from "@/lib/category-utils";
import { db } from "@/lib/db";
import { productCategories } from "@/lib/db/schema";
import { getAllCategories } from "@/lib/queries";

export const metadata: Metadata = { title: "Kategoriler" };

export default async function CategoriesPage() {
  const [all, counts] = await Promise.all([
    getAllCategories(),
    db
      .select({ categoryId: productCategories.categoryId, n: count() })
      .from(productCategories)
      .groupBy(productCategories.categoryId),
  ]);
  const flat = flattenCategories(all);
  const countOf = (id: number) => counts.find((c) => c.categoryId === id)?.n ?? 0;

  return (
    <>
      <PageHeader title="Kategoriler" description="Menü sırası ve alt kategoriler burada belirlenir." />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Table>
          <thead>
            <tr>
              <th>Kategori</th>
              <th>Ürün</th>
              <th>Sıra</th>
              <th>Menü</th>
            </tr>
          </thead>
          <tbody>
            {flat.map((c) => (
              <tr key={c.id} className="hover:bg-zinc-50">
                <td>
                  <Link
                    href={`/admin/kategoriler/${c.id}`}
                    className="font-medium hover:underline"
                    style={{ paddingLeft: `${c.depth * 20}px` }}
                  >
                    {c.depth > 0 && <span className="mr-1 text-zinc-300">└</span>}
                    {c.name}
                  </Link>
                  {c.highlight && <Badge className="ml-2 bg-red-50 text-red-700 ring-red-200">Vurgulu</Badge>}
                  <p className="text-xs text-zinc-400" style={{ paddingLeft: `${c.depth * 20}px` }}>
                    /kategori/{c.slug}
                  </p>
                </td>
                <td className="tabular-nums">{countOf(c.id)}</td>
                <td className="tabular-nums">{c.sortOrder}</td>
                <td>{c.showInMenu ? <Badge>Görünür</Badge> : <span className="text-xs text-zinc-400">Gizli</span>}</td>
              </tr>
            ))}
            {flat.length === 0 && (
              <tr>
                <td colSpan={4} className="py-10 text-center text-zinc-500">
                  Henüz kategori yok.
                </td>
              </tr>
            )}
          </tbody>
        </Table>
        <Card title="Yeni kategori" className="h-fit">
          <CategoryForm category={null} categories={flat} />
        </Card>
      </div>
    </>
  );
}
