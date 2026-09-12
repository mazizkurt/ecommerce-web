import { requireAdmin } from "@/lib/auth";
import type { Metadata } from "next";
import { PageForm } from "@/components/admin/forms";
import { PageHeader } from "@/components/admin/ui";

export const metadata: Metadata = { title: "Yeni Sayfa" };

export default async function NewPagePage() {
  await requireAdmin();
  return (
    <>
      <PageHeader title="Yeni Sayfa" back={{ href: "/admin/sayfalar", label: "Sayfalar" }} />
      <PageForm page={null} />
    </>
  );
}
