import type {
  BannerPlacement,
  BannerStyle,
  CouponType,
  OrderStatus,
  PageGroup,
  PaymentMethod,
  PaymentStatus,
} from "./db/schema";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  awaiting_payment: "Ödeme Bekleniyor",
  pending: "Onay Bekliyor",
  preparing: "Hazırlanıyor",
  shipped: "Kargoya Verildi",
  delivered: "Teslim Edildi",
  cancelled: "İptal Edildi",
};

export const ORDER_STATUS_STYLES: Record<OrderStatus, string> = {
  awaiting_payment: "bg-orange-50 text-orange-700 ring-orange-200",
  pending: "bg-amber-50 text-amber-700 ring-amber-200",
  preparing: "bg-sky-50 text-sky-700 ring-sky-200",
  shipped: "bg-violet-50 text-violet-700 ring-violet-200",
  delivered: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  cancelled: "bg-zinc-100 text-zinc-600 ring-zinc-200",
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  bank_transfer: "Havale / EFT",
  cash_on_delivery: "Kapıda Ödeme",
  card: "Kredi / Banka Kartı",
  manual: "Diğer / Elden",
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: "Ödeme Bekleniyor",
  paid: "Ödendi",
  failed: "Başarısız",
  refunded: "İade Edildi",
};

export const COUPON_TYPE_LABELS: Record<CouponType, string> = {
  percent: "Yüzde indirim (%)",
  fixed: "Sabit tutar indirim (TL)",
  free_shipping: "Ücretsiz kargo",
};

export const BANNER_PLACEMENT_LABELS: Record<BannerPlacement, string> = {
  hero: "Ana Slider (tam genişlik)",
  wide: "Geniş Kampanya Bannerı",
  category: "Kategori Bannerları (3'lü)",
};

export const BANNER_STYLE_LABELS: Record<BannerStyle, string> = {
  auto: "Otomatik (konuma göre)",
  light: "Açık zemin, çerçeveli yazı",
  dark: "Koyu gölge, beyaz yazı",
  plain: "Sadece görsel (yazısız)",
};

export const PAGE_GROUP_LABELS: Record<PageGroup, string> = {
  kurumsal: "Footer › Kurumsal",
  musteri: "Footer › Müşteri Hizmetleri",
  none: "Footer'da gösterme",
};

export const SORT_OPTIONS = [
  { value: "newest", label: "En yeniler" },
  { value: "price_asc", label: "Fiyat (Artan)" },
  { value: "price_desc", label: "Fiyat (Azalan)" },
  { value: "discount", label: "İndirim oranı" },
] as const;

export const COMMON_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "STD"];

export const CARGO_COMPANIES = [
  "Yurtiçi Kargo",
  "Aras Kargo",
  "MNG Kargo",
  "PTT Kargo",
  "Sürat Kargo",
  "HepsiJet",
  "Trendyol Express",
];

export const CITIES = [
  "Adana", "Adıyaman", "Afyonkarahisar", "Ağrı", "Aksaray", "Amasya", "Ankara",
  "Antalya", "Ardahan", "Artvin", "Aydın", "Balıkesir", "Bartın", "Batman",
  "Bayburt", "Bilecik", "Bingöl", "Bitlis", "Bolu", "Burdur", "Bursa",
  "Çanakkale", "Çankırı", "Çorum", "Denizli", "Diyarbakır", "Düzce", "Edirne",
  "Elazığ", "Erzincan", "Erzurum", "Eskişehir", "Gaziantep", "Giresun",
  "Gümüşhane", "Hakkari", "Hatay", "Iğdır", "Isparta", "İstanbul", "İzmir",
  "Kahramanmaraş", "Karabük", "Karaman", "Kars", "Kastamonu", "Kayseri",
  "Kilis", "Kırıkkale", "Kırklareli", "Kırşehir", "Kocaeli", "Konya",
  "Kütahya", "Malatya", "Manisa", "Mardin", "Mersin", "Muğla", "Muş",
  "Nevşehir", "Niğde", "Ordu", "Osmaniye", "Rize", "Sakarya", "Samsun",
  "Şanlıurfa", "Siirt", "Sinop", "Şırnak", "Sivas", "Tekirdağ", "Tokat",
  "Trabzon", "Tunceli", "Uşak", "Van", "Yalova", "Yozgat", "Zonguldak",
];
