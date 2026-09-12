import { asc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ConfirmForm } from "@/components/admin/form-client";
import { AdminReviewForm } from "@/components/admin/marketing-forms";
import { PageHeader } from "@/components/admin/ui";
import { deleteReview } from "@/lib/actions/admin";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { products, reviews } from "@/lib/db/schema";

export const metadata: Metadata = { title: "Yorum Düzenle" };

export default async function EditReviewPage({ params }: PageProps<"/admin/yorumlar/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const [[review], list] = await Promise.all([
    db.select().from(reviews).where(eq(reviews.id, Number(id) || 0)).limit(1),
    db.select({ id: products.id, name: products.name }).from(products).orderBy(asc(products.name)),
  ]);
  if (!review) notFound();

  return (
    <>
      <PageHeader
        title="Yorumu Düzenle"
        back={{ href: "/admin/yorumlar", label: "Yorumlar" }}
        actions={
          <ConfirmForm action={deleteReview} id={review.id} message="Yorum silinsin mi?">
            Sil
          </ConfirmForm>
        }
      />
      <AdminReviewForm review={review} products={list} />
    </>
  );
}
