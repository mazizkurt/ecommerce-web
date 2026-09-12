import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ConfirmForm } from "@/components/admin/form-client";
import { CouponForm } from "@/components/admin/marketing-forms";
import { PageHeader } from "@/components/admin/ui";
import { deleteCoupon } from "@/lib/actions/admin-marketing";
import { toLocalDateTime } from "@/lib/admin-utils";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { coupons } from "@/lib/db/schema";

export const metadata: Metadata = { title: "Kupon Düzenle" };

export default async function EditCouponPage({ params }: PageProps<"/admin/kuponlar/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const [coupon] = await db.select().from(coupons).where(eq(coupons.id, Number(id) || 0)).limit(1);
  if (!coupon) notFound();

  return (
    <>
      <PageHeader
        title={coupon.code}
        back={{ href: "/admin/kuponlar", label: "Kuponlar" }}
        actions={
          <ConfirmForm action={deleteCoupon} id={coupon.id} message="Kupon silinsin mi? Daha önce kullanıldığı siparişler etkilenmez.">
            Sil
          </ConfirmForm>
        }
      />
      <CouponForm
        coupon={{
          ...coupon,
          startsAt: toLocalDateTime(coupon.startsAt),
          endsAt: toLocalDateTime(coupon.endsAt),
        }}
      />
    </>
  );
}
