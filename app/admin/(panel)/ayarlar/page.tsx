import type { Metadata } from "next";
import { PasswordForm, SettingsForm } from "@/components/admin/forms";
import { Card, PageHeader } from "@/components/admin/ui";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = { title: "Ayarlar" };

export default async function SettingsPage() {
  const settings = await getSettings();
  return (
    <>
      <PageHeader title="Ayarlar" description="Mağaza bilgileri, kargo, ödeme ve iletişim ayarları." />
      <SettingsForm settings={settings} />
      <Card title="Yönetici şifresi" className="mt-10">
        <PasswordForm />
      </Card>
    </>
  );
}
