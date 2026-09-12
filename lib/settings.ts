import { cache } from "react";
import { db } from "./db";
import { settings as settingsTable } from "./db/schema";
import type { PricingSettings } from "./pricing";

// Para alanları kuruş cinsindendir.
export const DEFAULT_SETTINGS = {
  storeName: "Elara Butik",
  logoText: "ELARA",
  tagline: "Şık ve Rahat Modanın Adresi",
  metaDescription:
    "Kadın giyimde en yeni sezon elbise, takım, üst ve dış giyim modelleri.",
  announcement: "2500₺ Üzeri Tüm Siparişlerde Ücretsiz Kargo!",
  announcementLink: "/kategori/yeni-gelenler",
  cartDiscountPercent: "10",
  freeShippingThreshold: "250000",
  shippingFee: "8990",
  codFee: "3000",
  paymentBankTransfer: "1",
  paymentCashOnDelivery: "1",
  bankName: "",
  accountHolder: "",
  iban: "",
  whatsapp: "905000000000",
  phone: "0 500 000 00 00",
  email: "info@example.com",
  instagram: "https://www.instagram.com/",
  workingHours:
    "Hafta içi 09:00 - 17:00, Cumartesi 10:00 - 13:00 saatleri arasında ulaşabilirsiniz.",
  secureText: "Tüm bilgileriniz 256bit SSL Sertifikası ile korunmaktadır.",
};

export type SettingKey = keyof typeof DEFAULT_SETTINGS;
export type Settings = Record<SettingKey, string>;

export const getSettings = cache(async (): Promise<Settings> => {
  const rows = await db.select().from(settingsTable);
  const merged: Settings = { ...DEFAULT_SETTINGS };
  for (const row of rows) {
    if (row.key in merged) merged[row.key as SettingKey] = row.value;
  }
  return merged;
});

const toInt = (v: string) => {
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) && n >= 0 ? n : 0;
};

export function pricingFrom(s: Settings): PricingSettings {
  return {
    cartDiscountPercent: Math.min(90, toInt(s.cartDiscountPercent)),
    freeShippingThreshold: toInt(s.freeShippingThreshold),
    shippingFee: toInt(s.shippingFee),
    codFee: toInt(s.codFee),
  };
}

export function enabledPaymentMethods(s: Settings) {
  const methods: ("bank_transfer" | "cash_on_delivery")[] = [];
  if (s.paymentBankTransfer === "1") methods.push("bank_transfer");
  if (s.paymentCashOnDelivery === "1") methods.push("cash_on_delivery");
  return methods;
}
