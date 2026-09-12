import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ConfirmForm } from "@/components/admin/form-client";
import { PageForm } from "@/components/admin/forms";
import { btnSecondary, PageHeader } from "@/components/admin/ui";
import { deletePage } from "@/lib/actions/admin";
import { db } from "@/lib/db";
import { pages } from "@/lib/db/schema";

export const metadata: Metadata = { title: "Sayfa Düzenle" };

export default async function EditPagePage({ params }: PageProps<"/admin/sayfalar/[id]">) {
  const { id } = await params;
  const [page] = await db.select().from(pages).where(eq(pages.id, Number(id) || 0)).limit(1);
  if (!page) notFound();

  return (
    <>
      <PageHeader
        title={page.title}
        back={{ href: "/admin/sayfalar", label: "Sayfalar" }}
        actions={
          <>
            <Link href={`/sayfa/${page.slug}`} target="_blank" className={btnSecondary}>
              Mağazada gör
            </Link>
            <ConfirmForm action={deletePage} id={page.id} message="Sayfa silinsin mi?">
              Sil
            </ConfirmForm>
          </>
        }
      />
      <PageForm page={page} />
    </>
  );
}
