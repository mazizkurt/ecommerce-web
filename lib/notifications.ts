import { eq } from "drizzle-orm";
import { db } from "./db";
import { type OrderStatus, orders, type PaymentStatus } from "./db/schema";
import { sendEmail } from "./email";
import {
  newOrderAdminEmail,
  orderCancelledEmail,
  orderDeliveredEmail,
  orderReceivedEmail,
  orderShippedEmail,
  paymentReceivedEmail,
  passwordResetEmail,
} from "./email/templates";
import { getSettings } from "./settings";

// Bildirimler asla sipariş akışını bozmamalı: tüm hatalar yakalanır ve e-posta loguna yazılır.

async function loadOrder(orderId: number) {
  return db.query.orders.findFirst({ where: eq(orders.id, orderId), with: { items: true } });
}

export async function notifyOrderPlaced(orderId: number) {
  try {
    const [s, order] = await Promise.all([getSettings(), loadOrder(orderId)]);
    if (!order) return;
    if (s.notifyCustomerOrder === "1") {
      const mail = orderReceivedEmail(s, order);
      await sendEmail({ to: order.email, ...mail, template: "order_received", replyTo: s.email || undefined }, s);
    }
    const adminTo = s.adminNotifyEmail || s.email;
    if (s.notifyAdminOrder === "1" && adminTo) {
      const mail = newOrderAdminEmail(s, order);
      await sendEmail({ to: adminTo, ...mail, template: "order_admin", replyTo: order.email }, s);
    }
  } catch (e) {
    console.error("notifyOrderPlaced", e);
  }
}

export async function notifyOrderUpdated(
  orderId: number,
  prev: { status: OrderStatus; paymentStatus: PaymentStatus },
) {
  try {
    const [s, order] = await Promise.all([getSettings(), loadOrder(orderId)]);
    if (!order) return;
    const send = (mail: { subject: string; html: string }, template: string) =>
      sendEmail({ to: order.email, ...mail, template, replyTo: s.email || undefined }, s);

    if (order.status !== prev.status) {
      if (order.status === "shipped" && s.notifyShipped === "1") await send(orderShippedEmail(s, order), "order_shipped");
      if (order.status === "delivered" && s.notifyDelivered === "1") await send(orderDeliveredEmail(s, order), "order_delivered");
      if (order.status === "cancelled" && s.notifyCancelled === "1") await send(orderCancelledEmail(s, order), "order_cancelled");
    }
    if (
      order.paymentStatus === "paid" &&
      prev.paymentStatus !== "paid" &&
      order.paymentMethod !== "card" &&
      s.notifyPaid === "1"
    ) {
      await send(paymentReceivedEmail(s, order), "payment_received");
    }
  } catch (e) {
    console.error("notifyOrderUpdated", e);
  }
}

export async function sendPasswordReset(user: { email: string; name: string }, link: string) {
  try {
    const s = await getSettings();
    const mail = passwordResetEmail(s, user.name, link);
    await sendEmail({ to: user.email, ...mail, template: "password_reset" }, s);
  } catch (e) {
    console.error("sendPasswordReset", e);
  }
}
