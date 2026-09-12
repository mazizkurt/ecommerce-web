// Sunucu ve istemci tarafından ortak kullanılan fiyat hesapları (tüm tutarlar kuruş).

export type PricingSettings = {
  cartDiscountPercent: number;
  freeShippingThreshold: number;
  shippingFee: number;
  codFee: number;
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

export type TotalsLine = { price: number; quantity: number };

export function calcTotals(
  lines: TotalsLine[],
  s: PricingSettings,
  paymentMethod?: string,
) {
  const subtotal = lines.reduce((sum, l) => sum + l.price * l.quantity, 0);
  const discounted = lines.reduce(
    (sum, l) => sum + cartPrice(l.price, s.cartDiscountPercent) * l.quantity,
    0,
  );
  const discount = subtotal - discounted;
  const shippingFee =
    lines.length === 0 || discounted >= s.freeShippingThreshold
      ? 0
      : s.shippingFee;
  const paymentFee = paymentMethod === "cash_on_delivery" ? s.codFee : 0;
  return {
    subtotal,
    discount,
    shippingFee,
    paymentFee,
    total: discounted + shippingFee + paymentFee,
    remainingForFreeShipping: Math.max(0, s.freeShippingThreshold - discounted),
  };
}
