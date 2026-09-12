/**
 * Online ödeme sağlayıcısı sözleşmesi.
 *
 * Yeni bir sağlayıcı (PayTR, Param, Stripe...) eklemek için:
 *   1. Bu arayüzü uygulayan bir dosya yazın (örnek: iyzico.ts).
 *   2. lib/payments/index.ts içindeki PAYMENT_PROVIDERS listesine ekleyin.
 * Panel → Ödeme Yöntemleri sayfası `fields` listesinden ayar formunu otomatik oluşturur;
 * geri dönüş adresi /api/payments/<id>/callback olarak otomatik hazırlanır.
 */

export type ProviderField = {
  key: string;
  label: string;
  type: "text" | "secret" | "select";
  options?: { value: string; label: string }[];
  placeholder?: string;
  hint?: string;
  required?: boolean;
  defaultValue?: string;
};

export type ProviderConfig = Record<string, string>;

export type PaymentOrderItem = {
  id: number;
  productId: number | null;
  name: string;
  unitPrice: number;
  quantity: number;
};

export type PaymentOrder = {
  id: number;
  orderNo: number;
  token: string;
  userId: number | null;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  city: string;
  district: string;
  address: string;
  subtotal: number;
  discount: number;
  couponDiscount: number;
  shippingFee: number;
  paymentFee: number;
  total: number;
  paymentRef: string;
  paymentId: string;
  createdAt: Date;
  items: PaymentOrderItem[];
};

export type InitializeResult =
  | { ok: true; redirectUrl: string; reference: string }
  | { ok: false; message: string };

export type VerifyResult =
  | {
      status: "paid";
      paymentId: string;
      installment: number;
      data: Record<string, unknown>;
    }
  | { status: "review"; paymentId: string; message: string; data: Record<string, unknown> }
  | { status: "failed"; message: string; data?: Record<string, unknown> }
  /** Bildirim bu siparişe ait değil/eksik: sipariş durumuna dokunulmaz. */
  | { status: "invalid"; message: string };

export type RefundResult = { ok: true; message: string } | { ok: false; message: string };

export interface PaymentProvider {
  /** URL ve veritabanında kullanılan kısa ad. */
  id: string;
  /** Panelde gösterilen ad. */
  name: string;
  /** Ödeme sayfasında varsayılan başlık. */
  defaultTitle: string;
  defaultDescription: string;
  /** Panelde gösterilen kısa açıklama / nereden anahtar alınacağı. */
  adminHelp: string;
  fields: ProviderField[];
  isConfigured(config: ProviderConfig): boolean;
  initialize(ctx: {
    order: PaymentOrder;
    config: ProviderConfig;
    callbackUrl: string;
    ip: string;
  }): Promise<InitializeResult>;
  verify(ctx: {
    order: PaymentOrder;
    config: ProviderConfig;
    params: Record<string, string>;
  }): Promise<VerifyResult>;
  refund?(ctx: {
    order: PaymentOrder;
    config: ProviderConfig;
    amount: number;
    ip: string;
  }): Promise<RefundResult>;
}

/** Sipariş tutarını ürün satırlarına, kargo ve ek ücretlere bölüştürür (toplam birebir eşit). */
export function splitOrderAmounts(order: PaymentOrder) {
  const productNet = order.total - order.shippingFee - order.paymentFee;
  const gross = order.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const lines: { id: string; name: string; amount: number }[] = [];
  let allocated = 0;
  order.items.forEach((item, index) => {
    const lineGross = item.unitPrice * item.quantity;
    const amount =
      index === order.items.length - 1
        ? productNet - allocated
        : Math.round((productNet * lineGross) / (gross || 1));
    allocated += amount;
    lines.push({ id: String(item.id), name: item.name, amount });
  });
  return {
    products: lines.filter((l) => l.amount > 0),
    shipping: order.shippingFee,
    fee: order.paymentFee,
  };
}

export const toDecimal = (kurus: number) => (kurus / 100).toFixed(2);
