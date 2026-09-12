import { eq } from "drizzle-orm";
import { ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { WhatsAppIcon } from "@/components/icons";
import { OrderUpdateForm } from "@/components/admin/forms";
import { PrintButton } from "@/components/admin/print-button";
import { Badge, btnSecondary, Card, PageHeader } from "@/components/admin/ui";
import { toWhatsAppNumber } from "@/lib/category-utils";
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_STYLES,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
} from "@/lib/constants";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { formatDate, formatPrice } from "@/lib/format";

export const metadata: Metadata = { title: "Sipariş Detayı" };

export default async function OrderDetailPage({ params }: PageProps<"/admin/siparisler/[id]">) {
  const { id } = await params;
  const order = await db.query.orders.findFirst({
    where: eq(orders.id, Number(id) || 0),
    with: { items: true },
  });
  if (!order) notFound();

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const waMessage = encodeURIComponent(
    `Merhaba ${order.firstName}, #${order.orderNo} numaralı siparişiniz hakkında yazıyoruz. Sipariş detayınız: ${siteUrl}/siparis/${order.token}`,
  );

  return (
    <>
      <PageHeader
        title={`Sipariş #${order.orderNo}`}
        description={formatDate(order.createdAt)}
        back={{ href: "/admin/siparisler", label: "Siparişler" }}
        actions={
          <>
            <a
              href={`https://wa.me/${toWhatsAppNumber(order.phone)}?text=${waMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              className={btnSecondary}
            >
              <WhatsAppIcon className="size-4 text-[#21bd5c]" /> Müşteriye yaz
            </a>
            <Link href={`/siparis/${order.token}`} target="_blank" className={btnSecondary}>
              <ExternalLink className="size-4" /> Müşteri görünümü
            </Link>
            <PrintButton />
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <Card
            title="Ürünler"
            actions={<Badge className={ORDER_STATUS_STYLES[order.status]}>{ORDER_STATUS_LABELS[order.status]}</Badge>}
          >
            <ul className="divide-y divide-zinc-100">
              {order.items.map((item) => (
                <li key={item.id} className="flex items-center gap-4 py-3 first:pt-0">
                  <div className="h-16 w-11 shrink-0 overflow-hidden rounded bg-zinc-100">
                    {item.imageUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.imageUrl} alt="" className="size-full object-cover" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1 text-sm">
                    {item.productId ? (
                      <Link href={`/admin/urunler/${item.productId}`} className="font-medium hover:underline">
                        {item.name}
                      </Link>
                    ) : (
                      <span className="font-medium">{item.name}</span>
                    )}
                    <p className="text-xs text-zinc-500">
                      {item.code && `${item.code} · `}Beden: <b className="text-zinc-800">{item.size}</b>
                    </p>
                  </div>
                  <span className="text-sm tabular-nums text-zinc-500">
                    {item.quantity} × {formatPrice(item.unitPrice)}
                  </span>
                  <span className="w-24 text-right text-sm font-medium tabular-nums">
                    {formatPrice(item.quantity * item.unitPrice)}
                  </span>
                </li>
              ))}
            </ul>
            <dl className="mt-4 space-y-1.5 border-t border-zinc-100 pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-zinc-500">Ara toplam</dt>
                <dd className="tabular-nums">{formatPrice(order.subtotal)}</dd>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between">
                  <dt className="text-zinc-500">Sepet indirimi</dt>
                  <dd className="tabular-nums">-{formatPrice(order.discount)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-zinc-500">Kargo</dt>
                <dd className="tabular-nums">{order.shippingFee ? formatPrice(order.shippingFee) : "Ücretsiz"}</dd>
              </div>
              {order.paymentFee > 0 && (
                <div className="flex justify-between">
                  <dt className="text-zinc-500">Kapıda ödeme bedeli</dt>
                  <dd className="tabular-nums">{formatPrice(order.paymentFee)}</dd>
                </div>
              )}
              <div className="flex justify-between pt-1 text-base font-semibold">
                <dt>Toplam</dt>
                <dd className="tabular-nums">{formatPrice(order.total)}</dd>
              </div>
            </dl>
          </Card>

          <div className="grid gap-6 sm:grid-cols-2">
            <Card title="Müşteri">
              <div className="space-y-1 text-sm">
                <p className="font-medium">
                  {order.firstName} {order.lastName}
                </p>
                <p>
                  <a href={`mailto:${order.email}`} className="hover:underline">
                    {order.email}
                  </a>
                </p>
                <p>
                  <a href={`tel:${order.phone}`} className="hover:underline">
                    {order.phone}
                  </a>
                </p>
                <p className="pt-2 text-xs text-zinc-500">{order.userId ? "Üye müşteri" : "Misafir sipariş"}</p>
              </div>
            </Card>
            <Card title="Teslimat adresi">
              <div className="space-y-1 text-sm">
                <p>{order.address}</p>
                <p>
                  {order.district} / {order.city}
                </p>
                {order.note && (
                  <p className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-[13px] text-amber-900">Not: {order.note}</p>
                )}
              </div>
            </Card>
          </div>
        </div>

        <div className="space-y-6 print:hidden">
          <Card title="Ödeme">
            <p className="text-sm">{PAYMENT_METHOD_LABELS[order.paymentMethod]}</p>
            <p className="text-xs text-zinc-500">{PAYMENT_STATUS_LABELS[order.paymentStatus]}</p>
          </Card>
          <Card title="Siparişi güncelle">
            <OrderUpdateForm order={order} />
          </Card>
        </div>
      </div>
    </>
  );
}
