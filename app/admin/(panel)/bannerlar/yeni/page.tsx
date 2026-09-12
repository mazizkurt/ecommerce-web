import { requireAdmin } from "@/lib/auth";
import type { Metadata } from "next";
import { BannerForm } from "@/components/admin/forms";
import { PageHeader } from "@/components/admin/ui";

export const metadata: Metadata = { title: "Yeni Banner" };

export default async function NewBannerPage() {
  await requireAdmin();
  return (
    <>
      <PageHeader title="Yeni Banner" back={{ href: "/admin/bannerlar", label: "Bannerlar" }} />
      <BannerForm banner={null} />
    </>
  );
}
