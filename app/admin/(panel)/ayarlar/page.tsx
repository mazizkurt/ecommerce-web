import type { Metadata } from "next";
import { GeneralSettingsForm } from "@/components/admin/settings-forms";
import { requireAdmin } from "@/lib/auth";
import { getSettings, redactSettings } from "@/lib/settings";

export const metadata: Metadata = { title: "Genel Ayarlar" };

export default async function GeneralSettingsPage() {
  await requireAdmin();
  const { settings } = redactSettings(await getSettings());
  return <GeneralSettingsForm settings={settings} />;
}
