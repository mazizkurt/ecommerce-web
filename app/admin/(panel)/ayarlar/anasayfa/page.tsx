import type { Metadata } from "next";
import { HomeSettingsForm } from "@/components/admin/settings-forms";
import { requireAdmin } from "@/lib/auth";
import { getSettings, redactSettings } from "@/lib/settings";

export const metadata: Metadata = { title: "Anasayfa Ayarları" };

export default async function HomeSettingsPage() {
  await requireAdmin();
  const { settings } = redactSettings(await getSettings());
  return <HomeSettingsForm settings={settings} />;
}
