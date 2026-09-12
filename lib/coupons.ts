import { eq } from "drizzle-orm";
import { db } from "./db";
import { coupons } from "./db/schema";
import { formatPrice } from "./format";
import type { AppliedCoupon } from "./pricing";

export type Coupon = typeof coupons.$inferSelect;

const TR_MAP: Record<string, string> = { Ç: "C", Ğ: "G", İ: "I", Ö: "O", Ş: "S", Ü: "U" };

/** "indirim10" / "İNDİRİM10" → "INDIRIM10" (yalnızca A-Z, 0-9, - ve _). */
export function normalizeCouponCode(input: string) {
  return input
    .trim()
    .toUpperCase()
    .replace(/[ÇĞİÖŞÜ]/g, (c) => TR_MAP[c] ?? c)
    .replace(/[^A-Z0-9_-]/g, "")
    .slice(0, 40);
}

export async function findCoupon(code: string) {
  const normalized = normalizeCouponCode(code);
  if (!normalized) return undefined;
  const [coupon] = await db.select().from(coupons).where(eq(coupons.code, normalized)).limit(1);
  return coupon;
}

export function checkCoupon(
  coupon: Coupon | undefined,
  discountedSubtotal: number,
  now = new Date(),
): { ok: true; applied: AppliedCoupon } | { ok: false; message: string } {
  if (!coupon || !coupon.isActive) return { ok: false, message: "Kupon kodu geçersiz." };
  if (coupon.startsAt && coupon.startsAt > now) {
    return { ok: false, message: "Bu kupon henüz kullanıma açılmadı." };
  }
  if (coupon.endsAt && coupon.endsAt < now) return { ok: false, message: "Bu kuponun süresi dolmuş." };
  if (coupon.maxUses != null && coupon.usedCount >= coupon.maxUses) {
    return { ok: false, message: "Bu kuponun kullanım limiti dolmuş." };
  }
  if (discountedSubtotal < coupon.minSubtotal) {
    return {
      ok: false,
      message: `Bu kupon ${formatPrice(coupon.minSubtotal)} ve üzeri alışverişlerde geçerlidir.`,
    };
  }
  return { ok: true, applied: { code: coupon.code, type: coupon.type, value: coupon.value } };
}
