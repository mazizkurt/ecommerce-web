import { eq } from "drizzle-orm";
import { CheckCircle2, Clock } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ClearCart } from "@/components/shop/clear-cart";
import { cn } from "@/lib/cn";
import { ORDER_STATUS_LABELS, PAYMENT_METHOD_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/constants";
import { db } from "@/lib/db";
import { orders, type OrderStatus } from "@/lib/db/schema";
import { formatDate, formatPrice } from "@/lib/format";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = { title: "Sipariş Detayı", robots: { index: false } };

const STEPS: OrderStatus[] = ["pending", "preparing", "shipped", "delivered"];

export default async function OrderPage({ params, searchParams }: PageProps<"/siparis/[token]">) {
  const [{ token }, sp] = await Promise.all([params, searchParams]);
  const [order, settings] = await Promise.all([
    db.query.orders.findFirst({ where: eq(orders.token, token), with: { items: true } }),
    getSettings(),
  ]);
  if (!order) notFound();
  const isNew = sp.yeni === "1";
  const awaiting = order.status === "awaiting_payment";
  const stepIndex = STEPS.indexOf(order.status);
  const card = order.paymentData as { cardAssociation?: string; lastFourDigits?: string } | null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      {isNew && !awaiting && order.status !== "cancelled" && (
        <>
          <ClearCart />
          <div className="mb-8 flex flex-col items-center text-center">
            <CheckCircle2 className="size-14 text-cart-hover" strokeWidth={1.3} />
            <h1 className="mt-3 text-2xl">{settings.orderSuccessTitle}</h1>
            {order.paymentStatus === "paid" && <p className="mt-2 text-sm font-medium">Ödemeniz başarıyla alındı.</p>}
            <p className="mt-2 text-sm text-zinc-600">{settings.orderSuccessText}</p>
          </div>
        </>
      )}

      {awaiting && (
        <div className="mb-6 flex items-start gap-3 border border-orange-200 bg-orange-50 p-4 text-sm text-orange-900">
          <Clock className="mt-0.5 size-5 shrink-0" />
          <p>
            Bu siparişin ödemesi henüz tamamlanmadı. Ödeme sayfasını kapattıysanız{" "}
            <Link href="/odeme" className="font-medium underline">
              ödeme sayfasına dönerek
            </Link>{" "}
            tekrar deneyebilirsiniz; tamamlanmayan siparişler kısa süre içinde otomatik iptal edilir.
          </p>
        </div>
      )}

      <div className="border border-line p-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="text-lg font-medium">Sipariş #{order.orderNo}</p>
            <p className="text-[13px] text-zinc-500">{formatDate(order.createdAt)}</p>
          </div>
          <span className="bg-brand px-3 py-1 text-[13px] text-brand-text">{ORDER_STATUS_LABELS[order.status]}</span>
        </div>

        {order.status !== "cancelled" && !awaiting && (
          <ol className="mt-6 grid grid-cols-4 gap-1 text-center text-[11px] sm:text-xs">
            {STEPS.map((s, i) => (
              <li key={s}>
                <div className={cn("h-1 rounded-full", i <= stepIndex ? "bg-brand" : "bg-line")} />
                <span className={cn("mt-2 block", i <= stepIndex ? "text-black" : "text-zinc-400")}>
                  {ORDER_STATUS_LABELS[s]}
                </span>
              </li>
            ))}
          </ol>
        )}

        {order.trackingNo && (
          <p className="mt-5 bg-soft px-4 py-3 text-sm">
            Kargo: <b>{order.cargoCompany || "-"}</b> · Takip No: <b>{order.trackingNo}</b>
          </p>
        )}
      </div>

      {order.paymentMethod === "bank_transfer" && order.paymentStatus === "pending" && order.status !== "cancelled" && (
        <div className="mt-5 border border-black p-5 text-sm">
          <p className="font-medium">Havale / EFT Bilgileri</p>
          {settings.iban ? (
            <dl className="mt-3 grid grid-cols-[120px_1fr] gap-y-1.5">
              <dt className="text-zinc-500">Banka</dt>
              <dd>{settings.bankName || "-"}</dd>
              <dt className="text-zinc-500">Alıcı</dt>
              <dd>{settings.accountHolder || "-"}</dd>
              <dt className="text-zinc-500">IBAN</dt>
              <dd className="font-mono">{settings.iban}</dd>
              <dt className="text-zinc-500">Tutar</dt>
              <dd className="font-medium">{formatPrice(order.total)}</dd>
            </dl>
          ) : (
            <p className="mt-2 text-zinc-600">Banka bilgileri için bizimle iletişime geçin: {settings.phone}</p>
          )}
          <p className="mt-3 text-[13px] text-zinc-600">
            Açıklama kısmına sipariş numaranızı (<b>#{order.orderNo}</b>) yazmayı unutmayın. Ödemeniz onaylandığında
            siparişiniz hazırlanmaya başlar.
          </p>
        </div>
      )}

      <div className="mt-5 border border-line p-5">
        <h2 className="mb-3 text-base font-medium">Ürünler</h2>
        <ul className="divide-y divide-line">
          {order.items.map((item) => (
            <li key={item.id} className="flex gap-3 py-3">
              <div className="relative h-[90px] w-[60px] shrink-0 overflow-hidden bg-soft">
                {item.imageUrl && <Image src={item.imageUrl} alt="" fill sizes="60px" className="object-cover" />}
              </div>
              <div className="flex-1 text-sm">
                <p>{item.name}</p>
                <p className="mt-1 text-[13px] text-zinc-500">
                  Beden: {item.size} · {item.quantity} adet
                </p>
              </div>
              <span className="text-sm">{formatPrice(item.unitPrice * item.quantity)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-3 space-y-1.5 border-t border-line pt-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-zinc-600">Ara Toplam</dt>
            <dd>{formatPrice(order.subtotal)}</dd>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between text-accent">
              <dt>Sepet İndirimi</dt>
              <dd>-{formatPrice(order.discount)}</dd>
            </div>
          )}
          {order.couponDiscount > 0 && (
            <div className="flex justify-between text-accent">
              <dt>Kupon ({order.couponCode})</dt>
              <dd>-{formatPrice(order.couponDiscount)}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-zinc-600">Kargo</dt>
            <dd>{order.shippingFee ? formatPrice(order.shippingFee) : "Ücretsiz"}</dd>
          </div>
          {order.paymentFee > 0 && (
            <div className="flex justify-between">
              <dt className="text-zinc-600">Kapıda Ödeme Bedeli</dt>
              <dd>{formatPrice(order.paymentFee)}</dd>
            </div>
          )}
          <div className="flex justify-between pt-1 text-base font-medium">
            <dt>Toplam</dt>
            <dd>{formatPrice(order.total)}</dd>
          </div>
        </dl>
      </div>

      <div className="mt-5 grid gap-5 border border-line p-5 text-sm sm:grid-cols-2">
        <div>
          <h2 className="mb-2 font-medium">Teslimat Adresi</h2>
          <p>
            {order.firstName} {order.lastName}
          </p>
          <p className="text-zinc-600">{order.address}</p>
          <p className="text-zinc-600">
            {order.district} / {order.city}
          </p>
          <p className="text-zinc-600">{order.phone}</p>
        </div>
        <div>
          <h2 className="mb-2 font-medium">Ödeme</h2>
          <p>{PAYMENT_METHOD_LABELS[order.paymentMethod]}</p>
          <p className="text-zinc-600">{PAYMENT_STATUS_LABELS[order.paymentStatus]}</p>
          {card?.lastFourDigits && (
            <p className="text-zinc-600">
              {card.cardAssociation?.replaceAll("_", " ")} •••• {card.lastFourDigits}
              {order.installment > 1 ? ` · ${order.installment} taksit` : ""}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
