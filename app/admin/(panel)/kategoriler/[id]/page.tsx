import { requireAdmin } from "@/lib/auth";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ConfirmForm } from "@/components/admin/form-client";
import { CategoryForm } from "@/components/admin/forms";
import { btnSecondary, Card, PageHeader } from "@/components/admin/ui";
import { deleteCategory } from "@/lib/actions/admin";
import { flattenCategories } from "@/lib/category-utils";
import { getAllCategories } from "@/lib/queries";

export const metadata: Metadata = { title: "Kategoriyi Düzenle" };

export default async function EditCategoryPage({ params }: PageProps<"/admin/kategoriler/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const all = await getAllCategories();
  const category = all.find((c) => c.id === Number(id));
  if (!category) notFound();

  return (
    <>
      <PageHeader
        title={category.name}
        back={{ href: "/admin/kategoriler", label: "Kategoriler" }}
        actions={
          <>
            <Link href={`/kategori/${category.slug}`} target="_blank" className={btnSecondary}>
              Mağazada gör
            </Link>
            <ConfirmForm
              action={deleteCategory}
              id={category.id}
              message="Kategori silinecek. Alt kategoriler bir üst seviyeye taşınır, ürünler silinmez. Devam edilsin mi?"
            >
              Sil
            </ConfirmForm>
          </>
        }
      />
      <Card className="max-w-xl">
        <CategoryForm category={category} categories={flattenCategories(all)} />
      </Card>
    </>
  );
}
