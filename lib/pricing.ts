// Sunucu ve istemci tarafından ortak kullanılan fiyat hesapları (tüm tutarlar kuruş).

export type PricingSettings = {
  cartDiscountPercent: number;
  freeShippingThreshold: number;
  shippingFee: number;
  codFee: number;
};

export type AppliedCoupon = {
  code: string;
  type: "percent" | "fixed" | "free_shipping";
  value: number; // percent: 1-100, fixed: kuruş
};

export function cartPrice(price: number, cartDiscountPercent: number) {
  if (cartDiscountPercent <= 0) return price;
  return Math.round((price * (100 - cartDiscountPercent)) / 100);
}

/** Eski fiyata göre indirim yüzdesi (ürün kartındaki "%26" rozeti). */
export function discountRate(comparePrice: number | null, price: number) {
  if (!comparePrice || comparePrice <= price) return 0;
  return Math.round(((comparePrice - price) / comparePrice) * 100);
}

/** Kupon indirimi, sepet indirimi uygulanmış ara toplam üzerinden hesaplanır. */
export function couponAmount(coupon: AppliedCoupon | null | undefined, discounted: number) {
  if (!coupon) return 0;
  if (coupon.type === "percent") {
    return Math.round((discounted * Math.min(100, Math.max(0, coupon.value))) / 100);
  }
  if (coupon.type === "fixed") return Math.min(coupon.value, discounted);
  return 0;
}

export type TotalsLine = { price: number; quantity: number };

export function calcTotals(
  lines: TotalsLine[],
  s: PricingSettings,
  paymentMethod?: string,
  coupon?: AppliedCoupon | null,
) {
  const subtotal = lines.reduce((sum, l) => sum + l.price * l.quantity, 0);
  const discounted = lines.reduce(
    (sum, l) => sum + cartPrice(l.price, s.cartDiscountPercent) * l.quantity,
    0,
  );
  const discount = subtotal - discounted;
  const couponDiscount = couponAmount(coupon, discounted);
  const freeShipping =
    coupon?.type === "free_shipping" || discounted >= s.freeShippingThreshold;
  const shippingFee = lines.length === 0 || freeShipping ? 0 : s.shippingFee;
  const paymentFee = paymentMethod === "cash_on_delivery" ? s.codFee : 0;
  return {
    subtotal,
    discount,
    couponDiscount,
    shippingFee,
    paymentFee,
    total: discounted - couponDiscount + shippingFee + paymentFee,
    remainingForFreeShipping: Math.max(0, s.freeShippingThreshold - discounted),
  };
}
