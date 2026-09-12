import type { Metadata } from "next";
import { BannerForm } from "@/components/admin/forms";
import { PageHeader } from "@/components/admin/ui";

export const metadata: Metadata = { title: "Yeni Banner" };

export default function NewBannerPage() {
  return (
    <>
      <PageHeader title="Yeni Banner" back={{ href: "/admin/bannerlar", label: "Bannerlar" }} />
      <BannerForm banner={null} />
    </>
  );
}
