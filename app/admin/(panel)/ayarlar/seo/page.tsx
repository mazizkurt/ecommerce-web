import type { Metadata } from "next";
import { SeoSettingsForm } from "@/components/admin/settings-forms";
import { requireAdmin } from "@/lib/auth";
import { siteOrigin } from "@/lib/request";
import { getSettings, redactSettings } from "@/lib/settings";

export const metadata: Metadata = { title: "SEO ve Analitik" };

export default async function SeoSettingsPage() {
  await requireAdmin();
  const settings = await getSettings();
  return <SeoSettingsForm settings={redactSettings(settings).settings} siteUrl={await siteOrigin(settings)} />;
}
