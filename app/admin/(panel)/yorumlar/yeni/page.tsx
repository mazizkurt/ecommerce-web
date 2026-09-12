import { asc } from "drizzle-orm";
import type { Metadata } from "next";
import { AdminReviewForm } from "@/components/admin/marketing-forms";
import { PageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { products } from "@/lib/db/schema";

export const metadata: Metadata = { title: "Yeni Yorum" };

export default async function NewReviewPage() {
  await requireAdmin();
  const list = await db.select({ id: products.id, name: products.name }).from(products).orderBy(asc(products.name));
  return (
    <>
      <PageHeader
        title="Yeni Yorum"
        description="WhatsApp veya Instagram'dan gelen gerçek müşteri yorumlarını buradan ekleyebilirsiniz."
        back={{ href: "/admin/yorumlar", label: "Yorumlar" }}
      />
      <AdminReviewForm review={null} products={list} />
    </>
  );
}
