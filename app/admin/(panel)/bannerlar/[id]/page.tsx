import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ConfirmForm } from "@/components/admin/form-client";
import { BannerForm } from "@/components/admin/forms";
import { PageHeader } from "@/components/admin/ui";
import { deleteBanner } from "@/lib/actions/admin";
import { db } from "@/lib/db";
import { banners } from "@/lib/db/schema";

export const metadata: Metadata = { title: "Banner Düzenle" };

export default async function EditBannerPage({ params }: PageProps<"/admin/bannerlar/[id]">) {
  const { id } = await params;
  const [banner] = await db.select().from(banners).where(eq(banners.id, Number(id) || 0)).limit(1);
  if (!banner) notFound();

  return (
    <>
      <PageHeader
        title={banner.title || "Banner"}
        back={{ href: "/admin/bannerlar", label: "Bannerlar" }}
        actions={
          <ConfirmForm action={deleteBanner} id={banner.id} message="Banner silinsin mi?">
            Sil
          </ConfirmForm>
        }
      />
      <BannerForm banner={banner} />
    </>
  );
}
