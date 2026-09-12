import type { Metadata } from "next";
import { ManualOrderForm } from "@/components/admin/order-forms";
import { PageHeader } from "@/components/admin/ui";
import { getVariantOptions } from "@/lib/admin-queries";
import { requireAdmin } from "@/lib/auth";

export const metadata: Metadata = { title: "Yeni Sipariş" };

export default async function NewOrderPage() {
  await requireAdmin();
  const options = await getVariantOptions();
  return (
    <>
      <PageHeader
        title="Yeni Sipariş"
        description="Telefon, WhatsApp veya Instagram'dan gelen siparişleri kaydedin; stok otomatik düşer."
        back={{ href: "/admin/siparisler", label: "Siparişler" }}
      />
      <ManualOrderForm options={options} />
    </>
  );
}
