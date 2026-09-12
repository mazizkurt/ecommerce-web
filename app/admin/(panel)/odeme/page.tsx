import type { Metadata } from "next";
import { PaymentBuiltinForm, ProviderSettingsForm } from "@/components/admin/settings-forms";
import { Badge, Card, PageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { paymentProviders } from "@/lib/db/schema";
import { envOverrides, PAYMENT_PROVIDERS, resolveConfig } from "@/lib/payments";
import { siteOrigin } from "@/lib/request";
import { getSettings, redactSettings } from "@/lib/settings";

export const metadata: Metadata = { title: "Ödeme Yöntemleri" };

export default async function PaymentMethodsPage() {
  await requireAdmin();
  const [settings, rows] = await Promise.all([getSettings(), db.select().from(paymentProviders)]);
  const origin = await siteOrigin(settings);

  return (
    <>
      <PageHeader
        title="Ödeme Yöntemleri"
        description="Kredi kartı sağlayıcıları, havale/EFT ve kapıda ödeme ayarları. En az bir yöntem açık olmalıdır."
      />
      <div className="space-y-6">
        {PAYMENT_PROVIDERS.map((provider) => {
          const row = rows.find((r) => r.id === provider.id);
          const stored = row?.config ?? {};
          const config: Record<string, string> = {};
          const secretsSet: Record<string, boolean> = {};
          for (const field of provider.fields) {
            if (field.type === "secret") secretsSet[field.key] = !!stored[field.key];
            else config[field.key] = stored[field.key] ?? "";
          }
          const ready = provider.isConfigured(resolveConfig(provider, stored));
          return (
            <Card
              key={provider.id}
              title={`${provider.name} — Kredi / Banka Kartı`}
              actions={
                row?.isEnabled && ready ? (
                  <Badge className="bg-emerald-50 text-emerald-700 ring-emerald-200">Aktif</Badge>
                ) : (
                  <Badge>{ready ? "Kapalı" : "Yapılandırılmadı"}</Badge>
                )
              }
            >
              <ProviderSettingsForm
                provider={{ id: provider.id, name: provider.name, adminHelp: provider.adminHelp, fields: provider.fields }}
                row={{
                  isEnabled: row?.isEnabled ?? false,
                  title: row?.title ?? "",
                  description: row?.description ?? "",
                  sortOrder: row?.sortOrder ?? 0,
                  config,
                  secretsSet,
                }}
                defaults={{ title: provider.defaultTitle, description: provider.defaultDescription }}
                callbackUrl={`${origin}/api/payments/${provider.id}/callback`}
                envKeys={envOverrides(provider)}
              />
            </Card>
          );
        })}

        <PaymentBuiltinForm settings={redactSettings(settings).settings} />

        <p className="text-xs text-zinc-500">
          Yeni bir ödeme sağlayıcısı (PayTR, Param, Stripe…) eklemek için <span className="font-mono">lib/payments</span>{" "}
          klasörüne sağlayıcı dosyası yazılması yeterlidir; bu sayfada ayar formu otomatik oluşur.
        </p>
      </div>
    </>
  );
}
