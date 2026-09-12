"use server";

import { randomBytes } from "node:crypto";
import { and, asc, eq, gte, inArray, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { z } from "zod";
import { checkbox, idFrom, parseJson, refreshStore, str } from "@/lib/admin-utils";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { orderItems, orders, productImages, products, productVariants } from "@/lib/db/schema";
import { parsePrice } from "@/lib/format";
import { type FormState, fieldErrors } from "@/lib/form-utils";
import { notifyOrderPlaced, notifyOrderUpdated } from "@/lib/notifications";
import { appendNote, loadPaymentOrder, releaseCoupon, restoreStock, type Tx } from "@/lib/orders";
import { getProvider, getProviderConfig } from "@/lib/payments";
import { cartPrice } from "@/lib/pricing";
import { clientIp } from "@/lib/request";

class OrderEditError extends Error {}

const contactSchema = z.object({
  email: z.email("Geçerli bir e-posta girin."),
  phone: z.string().trim().min(10, "Telefon girin.").max(20),
  firstName: z.string().trim().min(1, "Ad girin.").max(50),
  lastName: z.string().trim().min(1, "Soyad girin.").max(50),
  city: z.string().trim().min(2, "İl girin.").max(40),
  district: z.string().trim().min(1, "İlçe girin.").max(60),
  address: z.string().trim().min(5, "Adres girin.").max(500),
  note: z.string().trim().max(500),
});

const contactFrom = (fd: FormData) => ({
  email: str(fd, "email").toLowerCase(),
  phone: str(fd, "phone"),
  firstName: str(fd, "firstName"),
  lastName: str(fd, "lastName"),
  city: str(fd, "city"),
  district: str(fd, "district"),
  address: str(fd, "address"),
  note: str(fd, "note"),
});

const linesSchema = z
  .array(
    z.object({
      itemId: z.number().int().positive().optional(),
      variantId: z.number().int().positive().optional(),
      quantity: z.number().int().min(0).max(999),
    }),
  )
  .max(100);

async function changeStock(tx: Tx, variantId: number, delta: number, label: string) {
  if (delta === 0) return;
  if (delta > 0) {
    const updated = await tx
      .update(productVariants)
      .set({ stock: sql`${productVariants.stock} - ${delta}` })
      .where(and(eq(productVariants.id, variantId), gte(productVariants.stock, delta)))
      .returning({ id: productVariants.id });
    if (!updated.length) throw new OrderEditError(`${label} için yeterli stok yok.`);
  } else {
    await tx
      .update(productVariants)
      .set({ stock: sql`${productVariants.stock} + ${-delta}` })
      .where(eq(productVariants.id, variantId));
  }
}

async function variantRows(ids: number[]) {
  if (!ids.length) return [];
  const rows = await db
    .select({
      variantId: productVariants.id,
      productId: products.id,
      name: products.name,
      code: products.code,
      size: productVariants.size,
      price: products.price,
    })
    .from(productVariants)
    .innerJoin(products, eq(products.id, productVariants.productId))
    .where(inArray(productVariants.id, ids));
  const images = await db
    .select({ productId: productImages.productId, url: productImages.url })
    .from(productImages)
    .where(inArray(productImages.productId, rows.map((r) => r.productId)))
    .orderBy(asc(productImages.sortOrder), asc(productImages.id));
  return rows.map((r) => ({ ...r, image: images.find((i) => i.productId === r.productId)?.url ?? "" }));
}

export async function updateOrderInfo(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const id = idFrom(fd);
  if (!id) return { ok: false, message: "Sipariş bulunamadı." };
  const parsed = contactSchema.safeParse(contactFrom(fd));
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
  await db.update(orders).set({ ...parsed.data, updatedAt: new Date() }).where(eq(orders.id, id));
  revalidatePath(`/admin/siparisler/${id}`);
  return { ok: true, message: "Müşteri ve adres bilgileri güncellendi." };
}

export async function updateOrderItems(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const id = idFrom(fd);
  const [order] = id ? await db.select().from(orders).where(eq(orders.id, id)).limit(1) : [];
  if (!order) return { ok: false, message: "Sipariş bulunamadı." };
  if (["shipped", "delivered", "cancelled", "awaiting_payment"].includes(order.status)) {
    return { ok: false, message: "Bu durumdaki siparişin ürünleri değiştirilemez." };
  }
  if (order.paymentMethod === "card" && order.paymentStatus === "paid") {
    return { ok: false, message: "Kartla ödenmiş siparişin tutarı değiştirilemez. Gerekirse iade edip yeni sipariş oluşturun." };
  }
  const lines = linesSchema.safeParse(parseJson(fd.get("items")));
  if (!lines.success) return { ok: false, message: "Ürün listesi okunamadı." };
  const shippingFee = parsePrice(fd.get("shippingFee")) ?? 0;

  const existing = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
  const qtyOf = (itemId: number) => lines.data.find((l) => l.itemId === itemId)?.quantity ?? 0;
  const added = lines.data.filter((l) => !l.itemId && l.variantId && l.quantity > 0);
  if (existing.filter((i) => qtyOf(i.id) > 0).length + added.length === 0) {
    return { ok: false, message: "Siparişte en az bir ürün kalmalı. Siparişi iptal etmek için durumu 'İptal Edildi' yapın." };
  }
  const newVariants = await variantRows(added.map((a) => a.variantId!));

  try {
    await db.transaction(async (tx) => {
      for (const item of existing) {
        const qty = qtyOf(item.id);
        if (qty === item.quantity) continue;
        if (!order.stockRestored && item.variantId) {
          await changeStock(tx, item.variantId, qty - item.quantity, `${item.name} (${item.size})`);
        }
        if (qty === 0) await tx.delete(orderItems).where(eq(orderItems.id, item.id));
        else await tx.update(orderItems).set({ quantity: qty }).where(eq(orderItems.id, item.id));
      }
      for (const a of added) {
        const v = newVariants.find((r) => r.variantId === a.variantId);
        if (!v) throw new OrderEditError("Eklenen ürün bulunamadı.");
        if (!order.stockRestored) await changeStock(tx, v.variantId, a.quantity, `${v.name} (${v.size})`);
        await tx.insert(orderItems).values({
          orderId: order.id,
          productId: v.productId,
          variantId: v.variantId,
          name: v.name,
          code: v.code,
          size: v.size,
          imageUrl: v.image,
          unitPrice: v.price,
          quantity: a.quantity,
        });
      }
      const items = await tx.select().from(orderItems).where(eq(orderItems.orderId, order.id));
      const subtotal = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
      const discounted = items.reduce((s, i) => s + cartPrice(i.unitPrice, order.discountPercent) * i.quantity, 0);
      const couponDiscount = Math.min(order.couponDiscount, discounted);
      await tx
        .update(orders)
        .set({
          subtotal,
          discount: subtotal - discounted,
          couponDiscount,
          shippingFee,
          total: discounted - couponDiscount + shippingFee + order.paymentFee,
          adminNote: appendNote(order.adminNote, "Sipariş ürünleri/kargo ücreti yönetici tarafından düzenlendi."),
          updatedAt: new Date(),
        })
        .where(eq(orders.id, order.id));
    });
  } catch (e) {
    if (e instanceof OrderEditError) return { ok: false, message: e.message };
    throw e;
  }
  refreshStore();
  revalidatePath(`/admin/siparisler/${order.id}`);
  return { ok: true, message: "Sipariş ürünleri ve tutarı güncellendi." };
}

export async function deleteOrder(fd: FormData) {
  await requireAdmin();
  const id = idFrom(fd);
  if (!id) return;
  const [order] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  if (!order) return;
  await db.transaction(async (tx) => {
    if (!order.stockRestored && order.status !== "cancelled") {
      await restoreStock(tx, order.id);
      await releaseCoupon(tx, order.couponCode);
    }
    await tx.delete(orders).where(eq(orders.id, order.id));
  });
  refreshStore();
  redirect("/admin/siparisler");
}

export async function refundOrderPayment(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const id = idFrom(fd);
  const [row] = id ? await db.select().from(orders).where(eq(orders.id, id)).limit(1) : [];
  if (!row) return { ok: false, message: "Sipariş bulunamadı." };
  if (row.paymentMethod !== "card" || row.paymentStatus !== "paid") {
    return { ok: false, message: "Yalnızca kartla ödenmiş siparişler panelden iade edilebilir." };
  }
  const provider = getProvider(row.paymentProvider);
  if (!provider?.refund) {
    return { ok: false, message: "Bu sağlayıcı panelden iadeyi desteklemiyor; iadeyi sağlayıcının panelinden yapın." };
  }
  const amount = parsePrice(fd.get("amount")) ?? row.total;
  if (amount <= 0 || amount > row.total) return { ok: false, message: "İade tutarı sipariş tutarını geçemez." };

  const paymentOrder = await loadPaymentOrder({ id: row.id });
  const result = await provider.refund({
    order: paymentOrder!,
    config: await getProviderConfig(provider),
    amount,
    ip: await clientIp(),
  });
  if (!result.ok) return { ok: false, message: result.message };

  const cancel = checkbox(fd, "cancelOrder") && row.status !== "cancelled";
  await db.transaction(async (tx) => {
    if (cancel && !row.stockRestored) {
      await restoreStock(tx, row.id);
      await releaseCoupon(tx, row.couponCode);
    }
    await tx
      .update(orders)
      .set({
        paymentStatus: amount >= row.total ? "refunded" : row.paymentStatus,
        status: cancel ? "cancelled" : row.status,
        stockRestored: cancel || row.stockRestored,
        adminNote: appendNote(row.adminNote, result.message),
        updatedAt: new Date(),
      })
      .where(eq(orders.id, row.id));
  });
  if (cancel) after(() => notifyOrderUpdated(row.id, { status: row.status, paymentStatus: row.paymentStatus }));
  refreshStore();
  revalidatePath(`/admin/siparisler/${row.id}`);
  return { ok: true, message: result.message };
}

const manualSchema = contactSchema.extend({
  paymentMethod: z.enum(["bank_transfer", "cash_on_delivery", "manual"]),
  paymentStatus: z.enum(["pending", "paid"]),
});

/** Telefonla/Instagram'dan gelen siparişleri panelden kaydetmek için. */
export async function createManualOrder(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = manualSchema.safeParse({
    ...contactFrom(fd),
    paymentMethod: str(fd, "paymentMethod"),
    paymentStatus: str(fd, "paymentStatus"),
  });
  if (!parsed.success) {
    return { ok: false, errors: fieldErrors(parsed.error), message: "Lütfen işaretli alanları kontrol edin." };
  }
  const lines = linesSchema.safeParse(parseJson(fd.get("items")));
  const quantities = new Map<number, number>();
  for (const l of lines.success ? lines.data : []) {
    if (l.variantId && l.quantity > 0) quantities.set(l.variantId, (quantities.get(l.variantId) ?? 0) + l.quantity);
  }
  if (!quantities.size) return { ok: false, message: "En az bir ürün ekleyin." };

  const shippingFee = parsePrice(fd.get("shippingFee")) ?? 0;
  const discountInput = parsePrice(fd.get("discount")) ?? 0;
  const rows = await variantRows([...quantities.keys()]);
  const d = parsed.data;

  let orderId: number;
  try {
    orderId = await db.transaction(async (tx) => {
      const lineItems = [];
      for (const [variantId, quantity] of [...quantities].sort((a, b) => a[0] - b[0])) {
        const v = rows.find((r) => r.variantId === variantId);
        if (!v) throw new OrderEditError("Seçilen ürünlerden biri bulunamadı.");
        await changeStock(tx, variantId, quantity, `${v.name} (${v.size})`);
        lineItems.push({ ...v, quantity });
      }
      const subtotal = lineItems.reduce((s, l) => s + l.price * l.quantity, 0);
      const discount = Math.min(discountInput, subtotal);
      const [order] = await tx
        .insert(orders)
        .values({
          token: randomBytes(16).toString("hex"),
          ...d,
          status: "pending",
          paidAt: d.paymentStatus === "paid" ? new Date() : null,
          subtotal,
          discount,
          shippingFee,
          total: subtotal - discount + shippingFee,
          adminNote: appendNote("", "Sipariş yönetim panelinden oluşturuldu."),
        })
        .returning({ id: orders.id });
      await tx.insert(orderItems).values(
        lineItems.map((l) => ({
          orderId: order.id,
          productId: l.productId,
          variantId: l.variantId,
          name: l.name,
          code: l.code,
          size: l.size,
          imageUrl: l.image,
          unitPrice: l.price,
          quantity: l.quantity,
        })),
      );
      return order.id;
    });
  } catch (e) {
    if (e instanceof OrderEditError) return { ok: false, message: e.message };
    throw e;
  }
  if (checkbox(fd, "notifyCustomer")) after(() => notifyOrderPlaced(orderId));
  refreshStore();
  redirect(`/admin/siparisler/${orderId}`);
}
