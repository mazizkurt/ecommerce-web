import type { Metadata } from "next";
import { AppearanceSettingsForm } from "@/components/admin/settings-forms";
import { requireAdmin } from "@/lib/auth";
import { getSettings, redactSettings } from "@/lib/settings";

export const metadata: Metadata = { title: "Görünüm" };

export default async function AppearanceSettingsPage() {
  await requireAdmin();
  const { settings } = redactSettings(await getSettings());
  return <AppearanceSettingsForm settings={settings} />;
}
