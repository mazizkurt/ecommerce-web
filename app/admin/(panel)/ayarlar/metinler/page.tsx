import type { Metadata } from "next";
import { TextsSettingsForm } from "@/components/admin/settings-forms";
import { requireAdmin } from "@/lib/auth";
import { getSettings, redactSettings } from "@/lib/settings";

export const metadata: Metadata = { title: "Metinler" };

export default async function TextsSettingsPage() {
  await requireAdmin();
  const { settings } = redactSettings(await getSettings());
  return <TextsSettingsForm settings={settings} />;
}
