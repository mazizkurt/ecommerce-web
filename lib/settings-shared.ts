// Veritabanına bağımlı olmayan ayar sabitleri ve yardımcıları: istemci bileşenlerinde de kullanılabilir.
import type { PricingSettings } from "./pricing";

// Para alanları kuruş cinsindendir. Tüm değerler metin olarak saklanır.
export const DEFAULT_SETTINGS = {
  // Genel
  storeName: "Elara Butik",
  logoText: "ELARA",
  tagline: "Şık ve Rahat Modanın Adresi",
  metaDescription: "Kadın giyimde en yeni sezon elbise, takım, üst ve dış giyim modelleri.",
  siteUrl: "",

  // Görünüm
  logoUrl: "",
  logoHeight: "44",
  faviconUrl: "",
  ogImageUrl: "",
  colorPrimary: "#000000",
  colorPrimaryText: "#ffffff",
  colorHover: "#4dc760",
  colorBadge: "#db2534",
  colorAccent: "#e5645f",
  colorAnnouncementBg: "#000000",
  colorAnnouncementText: "#ffffff",
  fontBody: "roboto",
  fontLogo: "bodoni",

  // Anasayfa
  homeSections:
    '[{"key":"hero","enabled":true},{"key":"wide","enabled":true},{"key":"categories","enabled":true},{"key":"new","enabled":true},{"key":"trend","enabled":true},{"key":"reviews","enabled":true},{"key":"newsletter","enabled":true}]',
  heroInterval: "6",
  newTitle: "Yeni Ürünler",
  newCount: "12",
  trendTitle: "İndirim Trendleri",
  trendCount: "12",
  reviewsTitle: "",
  newsletterTitle: "E-BÜLTEN ABONELİĞİ",
  newsletterText: "Kampanya, duyuru, bilgilendirmelerden e-posta ile haberdar olmak istiyorum.",
  infoBar: '[{"icon":"shield","text":"Güvenli Alışveriş"},{"icon":"truck","text":"HIZLI TESLİMAT"}]',

  // Metinler
  announcement: "2500₺ Üzeri Tüm Siparişlerde Ücretsiz Kargo!",
  announcementLink: "/kategori/yeni-gelenler",
  cartPriceLabel: "Sepetteki Fiyat",
  whatsappMessage: "Merhaba, bu ürünü sipariş etmek istiyorum:\n{urun} {beden}\n{link}",
  footerCol1Title: "Müşteri Hizmetleri",
  footerCol2Title: "Kurumsal",
  footerCol3Title: "Kategoriler",
  footerCol4Title: "Bize Ulaşın",
  orderSuccessTitle: "Siparişiniz alındı!",
  orderSuccessText:
    "Teşekkür ederiz. Sipariş detaylarınız aşağıdadır; bu sayfanın linkini saklayarak siparişinizi takip edebilirsiniz.",
  secureText: "Tüm bilgileriniz 256bit SSL Sertifikası ile korunmaktadır.",

  // Fiyat ve kargo
  cartDiscountPercent: "10",
  freeShippingThreshold: "250000",
  shippingFee: "8990",
  codFee: "3000",
  // Ürün sayfasında "Son X ürün!" uyarısı bu adet ve altında gösterilir; 0 = kapalı.
  lowStockThreshold: "1",

  // Ödeme (yerleşik yöntemler; online sağlayıcılar payment_providers tablosunda)
  paymentBankTransfer: "1",
  paymentCashOnDelivery: "1",
  // iyzico logoları anahtarlar girilmeden de gösterilebilir.
  showIyzicoLogo: "1",
  bankTransferText:
    "Siparişinizi tamamladıktan sonra banka hesap bilgilerimiz gösterilecektir. Ödemeniz onaylandığında siparişiniz hazırlanır.",
  codText: "Ödemeyi ürünü teslim alırken kapıda nakit veya kart ile yapabilirsiniz.",
  bankName: "",
  accountHolder: "",
  iban: "",

  // İletişim ve sosyal medya
  whatsapp: "905000000000",
  phone: "0 500 000 00 00",
  email: "info@example.com",
  workingHours: "Hafta içi 09:00 - 17:00, Cumartesi 10:00 - 13:00 saatleri arasında ulaşabilirsiniz.",
  instagram: "",
  facebook: "",
  tiktok: "",
  youtube: "",
  twitter: "",
  pinterest: "",

  // SEO ve analitik
  googleAnalyticsId: "",
  metaPixelId: "",
  googleSiteVerification: "",

  // E-posta
  emailProvider: "none",
  emailFromName: "",
  emailFromAddress: "",
  adminNotifyEmail: "",
  resendApiKey: "",
  smtpHost: "",
  smtpPort: "587",
  smtpUser: "",
  smtpPassword: "",
  smtpSecure: "0",
  notifyCustomerOrder: "1",
  notifyAdminOrder: "1",
  notifyShipped: "1",
  notifyDelivered: "0",
  notifyCancelled: "1",
  notifyPaid: "1",
};

export type SettingKey = keyof typeof DEFAULT_SETTINGS;
export type Settings = Record<SettingKey, string>;

/** Panel formlarına asla gönderilmeyen gizli değerler. */
export const SECRET_KEYS: SettingKey[] = ["resendApiKey", "smtpPassword"];
export const BOOLEAN_KEYS: SettingKey[] = [
  "paymentBankTransfer",
  "paymentCashOnDelivery",
  "showIyzicoLogo",
  "smtpSecure",
  "notifyCustomerOrder",
  "notifyAdminOrder",
  "notifyShipped",
  "notifyDelivered",
  "notifyCancelled",
  "notifyPaid",
];
export const MONEY_KEYS: SettingKey[] = ["freeShippingThreshold", "shippingFee", "codFee"];
export const COLOR_KEYS: SettingKey[] = [
  "colorPrimary",
  "colorPrimaryText",
  "colorHover",
  "colorBadge",
  "colorAccent",
  "colorAnnouncementBg",
  "colorAnnouncementText",
];

const toInt = (v: string, fallback = 0) => {
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
};

export function pricingFrom(s: Settings): PricingSettings {
  return {
    cartDiscountPercent: Math.min(90, toInt(s.cartDiscountPercent)),
    freeShippingThreshold: toInt(s.freeShippingThreshold),
    shippingFee: toInt(s.shippingFee),
    codFee: toInt(s.codFee),
  };
}

export function siteUrlFrom(s: Settings) {
  const url = s.siteUrl || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return url.replace(/\/+$/, "");
}

export function enabledBuiltinMethods(s: Settings) {
  const methods: ("bank_transfer" | "cash_on_delivery")[] = [];
  if (s.paymentBankTransfer === "1") methods.push("bank_transfer");
  if (s.paymentCashOnDelivery === "1") methods.push("cash_on_delivery");
  return methods;
}

/* ---------------- Anasayfa bölümleri ---------------- */

export const HOME_SECTIONS = {
  hero: "Ana slider",
  wide: "Geniş kampanya bannerı",
  categories: "Kategori bannerları (3'lü)",
  new: "Yeni ürünler",
  trend: "İndirim trendleri",
  reviews: "Müşteri yorumları",
  newsletter: "E-bülten",
} as const;
export type HomeSectionKey = keyof typeof HOME_SECTIONS;
export type HomeSection = { key: HomeSectionKey; enabled: boolean };

export function parseHomeSections(s: Pick<Settings, "homeSections">): HomeSection[] {
  let list: HomeSection[] = [];
  try {
    const raw = JSON.parse(s.homeSections) as HomeSection[];
    list = raw
      .filter((x) => x && x.key in HOME_SECTIONS)
      .map((x) => ({ key: x.key, enabled: x.enabled !== false }));
  } catch {
    // varsayılana dön
  }
  // Listeye sonradan eklenen bölümler kaybolmasın.
  for (const key of Object.keys(HOME_SECTIONS) as HomeSectionKey[]) {
    if (!list.some((x) => x.key === key)) list.push({ key, enabled: true });
  }
  return list;
}

/* ---------------- Bilgi şeridi ---------------- */

export const INFO_ICONS = {
  shield: "Güvenlik kalkanı",
  truck: "Kargo aracı",
  refresh: "İade / değişim",
  card: "Kredi kartı",
  headphones: "Destek",
  gift: "Hediye",
  star: "Yıldız",
  lock: "Kilit",
} as const;
export type InfoIcon = keyof typeof INFO_ICONS;
export type InfoItem = { icon: InfoIcon; text: string };

export function parseInfoBar(s: Pick<Settings, "infoBar">): InfoItem[] {
  try {
    const raw = JSON.parse(s.infoBar) as InfoItem[];
    return raw
      .filter((x) => x && typeof x.text === "string" && x.text.trim())
      .map((x) => ({ icon: x.icon in INFO_ICONS ? x.icon : "shield", text: x.text }));
  } catch {
    return [];
  }
}

/* ---------------- Yazı tipleri ve tema ---------------- */

export const BODY_FONTS = {
  roboto: "Roboto",
  inter: "Inter",
  montserrat: "Montserrat",
  poppins: "Poppins",
} as const;
export const LOGO_FONTS = {
  bodoni: "Bodoni Moda",
  playfair: "Playfair Display",
  cormorant: "Cormorant Garamond",
  cinzel: "Cinzel",
} as const;

export const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

/** Panelden seçilen renk ve yazı tiplerini CSS değişkenlerine çevirir. */
export function themeCss(s: Settings) {
  const color = (key: SettingKey) => (HEX_COLOR.test(s[key]) ? s[key] : DEFAULT_SETTINGS[key]);
  const body = s.fontBody in BODY_FONTS ? s.fontBody : "roboto";
  const logo = s.fontLogo in LOGO_FONTS ? s.fontLogo : "bodoni";
  return `:root{--color-brand:${color("colorPrimary")};--color-brand-text:${color("colorPrimaryText")};--color-cart-hover:${color("colorHover")};--color-badge:${color("colorBadge")};--color-accent:${color("colorAccent")};--color-announce-bg:${color("colorAnnouncementBg")};--color-announce-text:${color("colorAnnouncementText")};--body-font:var(--font-${body});--logo-font:var(--font-${logo});}`;
}
