import { SettingsTabs } from "@/components/admin/settings-tabs";
import { PageHeader } from "@/components/admin/ui";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PageHeader title="Ayarlar" description="Mağazanın görünümü, metinleri, kargo, e-posta ve yönetici ayarları." />
      <SettingsTabs />
      {children}
    </>
  );
}
