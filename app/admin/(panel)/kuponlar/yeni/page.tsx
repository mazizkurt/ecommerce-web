import type { Metadata } from "next";
import { CouponForm } from "@/components/admin/marketing-forms";
import { PageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth";

export const metadata: Metadata = { title: "Yeni Kupon" };

export default async function NewCouponPage() {
  await requireAdmin();
  return (
    <>
      <PageHeader title="Yeni Kupon" back={{ href: "/admin/kuponlar", label: "Kuponlar" }} />
      <CouponForm coupon={null} />
    </>
  );
}
