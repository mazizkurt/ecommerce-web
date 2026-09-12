import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { paymentProviders } from "@/lib/db/schema";
import { iyzico } from "./iyzico";
import { testProvider } from "./test-provider";
import type { PaymentProvider, ProviderConfig } from "./types";

/** Kullanılabilir tüm online ödeme sağlayıcıları. Yenisini eklemek için buraya ekleyin. */
export const PAYMENT_PROVIDERS: PaymentProvider[] = [
  iyzico,
  ...(process.env.NODE_ENV === "production" ? [] : [testProvider]),
];

export function getProvider(id: string) {
  return PAYMENT_PROVIDERS.find((p) => p.id === id) ?? null;
}

/**
 * Panelde kayıtlı ayarlar + ortam değişkeni geçersiz kılmaları.
 * Örn. IYZICO_API_KEY, IYZICO_SECRET_KEY, IYZICO_MODE tanımlıysa panel değerinin yerine geçer.
 */
export function resolveConfig(provider: PaymentProvider, stored: Record<string, string>): ProviderConfig {
  const config: ProviderConfig = {};
  for (const field of provider.fields) {
    const envKey = `${provider.id}_${field.key.replace(/([a-z])([A-Z])/g, "$1_$2")}`.toUpperCase();
    config[field.key] = process.env[envKey] || stored[field.key] || field.defaultValue || "";
  }
  return config;
}

export function envOverrides(provider: PaymentProvider) {
  return provider.fields
    .map((f) => `${provider.id}_${f.key.replace(/([a-z])([A-Z])/g, "$1_$2")}`.toUpperCase())
    .filter((k) => !!process.env[k]);
}

export async function getProviderRow(id: string) {
  const [row] = await db.select().from(paymentProviders).where(eq(paymentProviders.id, id)).limit(1);
  return row ?? null;
}

export async function getProviderConfig(provider: PaymentProvider) {
  const row = await getProviderRow(provider.id);
  return resolveConfig(provider, row?.config ?? {});
}

export type CheckoutProvider = {
  id: string;
  title: string;
  description: string;
};

/** Ödeme sayfasında gösterilecek, açık ve yapılandırılmış online sağlayıcılar. */
export async function getEnabledProviders(): Promise<CheckoutProvider[]> {
  const rows = await db
    .select()
    .from(paymentProviders)
    .where(eq(paymentProviders.isEnabled, true))
    .orderBy(asc(paymentProviders.sortOrder));
  const list: CheckoutProvider[] = [];
  for (const row of rows) {
    const provider = getProvider(row.id);
    if (!provider || !provider.isConfigured(resolveConfig(provider, row.config))) continue;
    list.push({
      id: provider.id,
      title: row.title || provider.defaultTitle,
      description: row.description || provider.defaultDescription,
    });
  }
  return list;
}
