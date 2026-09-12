import type { Metadata } from "next";
import Link from "next/link";
import { ShippingSettingsForm } from "@/components/admin/settings-forms";
import { requireAdmin } from "@/lib/auth";
import { getSettings, redactSettings } from "@/lib/settings";

export const metadata: Metadata = { title: "Fiyat ve Kargo" };

export default async function ShippingSettingsPage() {
  await requireAdmin();
  const { settings } = redactSettings(await getSettings());
  return (
    <>
      <ShippingSettingsForm settings={settings} />
      <p className="mt-4 text-sm text-zinc-500">
        Kapıda ödeme hizmet bedeli ve ödeme yöntemleri{" "}
        <Link href="/admin/odeme" className="underline">
          Ödeme Yöntemleri
        </Link>{" "}
        sayfasında, kupon kodları{" "}
        <Link href="/admin/kuponlar" className="underline">
          Kuponlar
        </Link>{" "}
        sayfasında yönetilir.
      </p>
    </>
  );
}
