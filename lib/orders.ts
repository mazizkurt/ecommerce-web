import { and, eq, lt, sql } from "drizzle-orm";
import { db } from "./db";
import { coupons, orderItems, orders, productVariants } from "./db/schema";
import type { PaymentOrder } from "./payments/types";

export type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/** Kart ödemesi bu süre içinde tamamlanmazsa sipariş iptal edilir, stok serbest kalır. */
const PAYMENT_TIMEOUT_MINUTES = 45;

export function appendNote(existing: string, note: string) {
  const stamp = new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Europe/Istanbul",
  }).format(new Date());
  return `${existing ? `${existing}\n` : ""}[${stamp}] ${note}`;
}

export async function restoreStock(tx: Tx, orderId: number) {
  const items = await tx
    .select({ variantId: orderItems.variantId, quantity: orderItems.quantity })
    .from(orderItems)
    .where(eq(orderItems.orderId, orderId));
  for (const item of items) {
    if (!item.variantId) continue;
    await tx
      .update(productVariants)
      .set({ stock: sql`${productVariants.stock} + ${item.quantity}` })
      .where(eq(productVariants.id, item.variantId));
  }
}

export async function releaseCoupon(tx: Tx, code: string) {
  if (!code) return;
  await tx
    .update(coupons)
    .set({ usedCount: sql`greatest(${coupons.usedCount} - 1, 0)` })
    .where(eq(coupons.code, code));
}

/** Ödemesi tamamlanmayan kart siparişini iptal eder; stoğu ve kuponu serbest bırakır. */
export async function failCardOrder(
  orderId: number,
  reason: string,
  data?: Record<string, unknown>,
) {
  await db.transaction(async (tx) => {
    const [order] = await tx
      .select()
      .from(orders)
      .where(and(eq(orders.id, orderId), eq(orders.status, "awaiting_payment")))
      .limit(1)
      .for("update");
    if (!order) return;
    if (!order.stockRestored) await restoreStock(tx, order.id);
    await releaseCoupon(tx, order.couponCode);
    await tx
      .update(orders)
      .set({
        status: "cancelled",
        paymentStatus: "failed",
        stockRestored: true,
        adminNote: appendNote(order.adminNote, `Ödeme başarısız: ${reason}`),
        paymentData: data ?? order.paymentData,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, order.id));
  });
}

/** Terk edilmiş ödeme sayfalarının rezerve ettiği stokları geri bırakır (tembel temizlik). */
export async function expireStalePayments() {
  const cutoff = new Date(Date.now() - PAYMENT_TIMEOUT_MINUTES * 60_000);
  const stale = await db
    .select({ id: orders.id })
    .from(orders)
    .where(and(eq(orders.status, "awaiting_payment"), lt(orders.createdAt, cutoff)));
  for (const o of stale) {
    await failCardOrder(o.id, `${PAYMENT_TIMEOUT_MINUTES} dakika içinde tamamlanmadı, otomatik iptal edildi.`);
  }
  return stale.length;
}

/** Ödemeyi onaylar. Sipariş bu çağrıyla ödendi durumuna geçtiyse true döner (tekrar bildirimde false). */
export async function markOrderPaid(
  orderId: number,
  result: { paymentId: string; installment: number; data: Record<string, unknown> },
) {
  const updated = await db
    .update(orders)
    .set({
      status: "pending",
      paymentStatus: "paid",
      paymentId: result.paymentId,
      installment: result.installment,
      paymentData: result.data,
      paidAt: new Date(),
      updatedAt: new Date(),
    })
    .where(and(eq(orders.id, orderId), eq(orders.status, "awaiting_payment")))
    .returning({ id: orders.id });
  if (updated.length) return true;

  // Süresi dolup iptal edilmiş siparişe geç gelen başarılı ödeme: kaybolmasın, yöneticiye not düş.
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (order && order.status === "cancelled" && order.paymentStatus !== "paid") {
    await db
      .update(orders)
      .set({
        paymentStatus: "paid",
        paymentId: result.paymentId,
        paymentData: result.data,
        paidAt: new Date(),
        adminNote: appendNote(
          order.adminNote,
          "DİKKAT: İptal edilmiş siparişe ödeme geldi. Siparişi yeniden işleme alın veya ödemeyi iade edin.",
        ),
        updatedAt: new Date(),
      })
      .where(eq(orders.id, order.id));
  }
  return false;
}

export async function markOrderInReview(
  orderId: number,
  result: { paymentId: string; message: string; data: Record<string, unknown> },
) {
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (!order || order.status !== "awaiting_payment") return false;
  await db
    .update(orders)
    .set({
      status: "pending",
      paymentStatus: "pending",
      paymentId: result.paymentId,
      paymentData: result.data,
      adminNote: appendNote(order.adminNote, result.message),
      updatedAt: new Date(),
    })
    .where(eq(orders.id, order.id));
  return true;
}

export async function loadPaymentOrder(where: { id: number } | { token: string }): Promise<PaymentOrder | null> {
  const order = await db.query.orders.findFirst({
    where: "id" in where ? eq(orders.id, where.id) : eq(orders.token, where.token),
    with: { items: true },
  });
  if (!order) return null;
  return {
    ...order,
    items: order.items.map((i) => ({
      id: i.id,
      productId: i.productId,
      name: i.name,
      unitPrice: i.unitPrice,
      quantity: i.quantity,
    })),
  };
}
