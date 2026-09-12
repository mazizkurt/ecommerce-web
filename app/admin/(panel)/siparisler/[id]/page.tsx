import { eq } from "drizzle-orm";
import { ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { WhatsAppIcon } from "@/components/icons";
import { ConfirmForm } from "@/components/admin/form-client";
import { OrderUpdateForm } from "@/components/admin/forms";
import { OrderInfoForm, OrderItemsEditor, RefundForm } from "@/components/admin/order-forms";
import { PrintButton } from "@/components/admin/print-button";
import { Badge, btnSecondary, Card, PageHeader } from "@/components/admin/ui";
import { deleteOrder } from "@/lib/actions/admin-orders";
import { getVariantOptions } from "@/lib/admin-queries";
import { requireAdmin } from "@/lib/auth";
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
import { getProvider } from "@/lib/payments";
import { siteOrigin } from "@/lib/request";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = { title: "Sipariş Detayı" };

export default async function OrderDetailPage({ params }: PageProps<"/admin/siparisler/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const order = await db.query.orders.findFirst({
    where: eq(orders.id, Number(id) || 0),
    with: { items: true },
  });
  if (!order) notFound();

  const itemsLocked =
    ["shipped", "delivered", "cancelled", "awaiting_payment"].includes(order.status) ||
    (order.paymentMethod === "card" && order.paymentStatus === "paid");
  const [settings, options] = await Promise.all([getSettings(), itemsLocked ? [] : getVariantOptions()]);
  const origin = await siteOrigin(settings);
  const provider = order.paymentProvider ? getProvider(order.paymentProvider) : null;
  const card = order.paymentData as { cardAssociation?: string; cardFamily?: string; lastFourDigits?: string } | null;
  const waMessage = encodeURIComponent(
    `Merhaba ${order.firstName}, #${order.orderNo} numaralı siparişiniz hakkında yazıyoruz. Sipariş detayınız: ${origin}/siparis/${order.token}`,
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
                  <dt className="text-zinc-500">Sepet indirimi (%{order.discountPercent})</dt>
                  <dd className="tabular-nums">-{formatPrice(order.discount)}</dd>
                </div>
              )}
              {order.couponDiscount > 0 && (
                <div className="flex justify-between">
                  <dt className="text-zinc-500">Kupon ({order.couponCode})</dt>
                  <dd className="tabular-nums">-{formatPrice(order.couponDiscount)}</dd>
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

          {!itemsLocked && (
            <Card title="Ürünleri düzenle" description="Adet değiştirin, ürün çıkarın veya ekleyin; stok ve tutar otomatik güncellenir." className="print:hidden">
              <OrderItemsEditor
                orderId={order.id}
                items={order.items.map(({ id, name, size, unitPrice, quantity }) => ({ id, name, size, unitPrice, quantity }))}
                shippingFee={order.shippingFee}
                options={options}
              />
            </Card>
          )}

          <Card title="Müşteri ve teslimat">
            <div className="mb-5 grid gap-4 text-sm sm:grid-cols-2 print:mb-0">
              <div>
                <p className="font-medium">
                  {order.firstName} {order.lastName}
                </p>
                <p>{order.email}</p>
                <p>{order.phone}</p>
                <p className="pt-1 text-xs text-zinc-500">{order.userId ? "Üye müşteri" : "Misafir sipariş"}</p>
              </div>
              <div>
                <p>{order.address}</p>
                <p>
                  {order.district} / {order.city}
                </p>
                {order.note && <p className="mt-2 rounded-md bg-amber-50 px-3 py-2 text-[13px] text-amber-900">Not: {order.note}</p>}
              </div>
            </div>
            <details className="print:hidden">
              <summary className="cursor-pointer text-sm font-medium text-zinc-700">Bilgileri düzenle</summary>
              <div className="mt-4">
                <OrderInfoForm
                  orderId={order.id}
                  values={{
                    email: order.email,
                    phone: order.phone,
                    firstName: order.firstName,
                    lastName: order.lastName,
                    city: order.city,
                    district: order.district,
                    address: order.address,
                    note: order.note,
                  }}
                />
              </div>
            </details>
          </Card>
        </div>

        <div className="space-y-6 print:hidden">
          <Card title="Ödeme">
            <div className="space-y-1 text-sm">
              <p>
                {PAYMENT_METHOD_LABELS[order.paymentMethod]}
                {provider && <span className="text-zinc-500"> · {provider.name}</span>}
              </p>
              <p className="text-zinc-600">{PAYMENT_STATUS_LABELS[order.paymentStatus]}</p>
              {card?.lastFourDigits && (
                <p className="text-zinc-600">
                  {card.cardAssociation?.replaceAll("_", " ")} {card.cardFamily} •••• {card.lastFourDigits}
                  {order.installment > 1 && ` · ${order.installment} taksit`}
                </p>
              )}
              {order.paymentId && <p className="font-mono text-xs text-zinc-500">Ödeme no: {order.paymentId}</p>}
              {order.paidAt && <p className="text-xs text-zinc-500">Ödeme tarihi: {formatDate(order.paidAt)}</p>}
            </div>
            {order.paymentStatus === "refunded" && (
              <p className="mt-3 rounded-md bg-zinc-100 px-3 py-2 text-xs text-zinc-700">
                <b>Ödeme iade edildi.</b> {order.adminNote.split("\n").filter(Boolean).at(-1)}
              </p>
            )}
            {order.paymentMethod === "card" && order.paymentStatus === "paid" && provider?.refund && (
              <div className="mt-4 border-t border-zinc-100 pt-4">
                <RefundForm orderId={order.id} total={order.total} providerName={provider.name} />
              </div>
            )}
          </Card>
          <Card title="Siparişi güncelle">
            <OrderUpdateForm order={order} />
          </Card>
          <Card title="Siparişi sil">
            <p className="mb-3 text-xs text-zinc-500">
              Sipariş kalıcı olarak silinir; iptal edilmemişse stoklar geri eklenir. Kayıt tutmak için silmek yerine iptal etmeniz önerilir.
            </p>
            <ConfirmForm action={deleteOrder} id={order.id} message={`#${order.orderNo} numaralı sipariş kalıcı olarak silinsin mi?`}>
              Siparişi sil
            </ConfirmForm>
          </Card>
        </div>
      </div>
    </>
  );
}
