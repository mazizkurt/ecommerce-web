import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { formatPrice } from "@/lib/format";
import { loadPaymentOrder } from "@/lib/orders";

export const metadata: Metadata = { title: "Test Ödeme", robots: { index: false } };

/** Yalnızca geliştirmede: "Test Ödeme" sağlayıcısının sahte ödeme sayfası. */
export default async function TestPaymentPage({ searchParams }: PageProps<"/odeme/test-odeme">) {
  if (process.env.NODE_ENV === "production") notFound();
  const sp = await searchParams;
  const token = typeof sp.order === "string" ? sp.order : "";
  const ref = typeof sp.ref === "string" ? sp.ref : "";
  const order = token ? await loadPaymentOrder({ token }) : null;
  if (!order) notFound();

  const action = `/api/payments/test/callback?order=${token}`;
  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center">
      <p className="text-xs font-medium uppercase tracking-widest text-orange-600">Test ortamı</p>
      <h1 className="mt-2 text-2xl">Sahte Ödeme Sayfası</h1>
      <p className="mt-2 text-sm text-zinc-600">
        Sipariş #{order.orderNo} · <b>{formatPrice(order.total)}</b>
        <br />
        Gerçek ödeme alınmaz. Sonucu seçin:
      </p>
      <div className="mt-8 grid grid-cols-2 gap-3">
        <form action={action} method="post">
          <input type="hidden" name="ref" value={ref} />
          <input type="hidden" name="result" value="success" />
          <button type="submit" className="h-12 w-full bg-emerald-600 text-sm font-medium text-white">
            Ödeme Başarılı
          </button>
        </form>
        <form action={action} method="post">
          <input type="hidden" name="ref" value={ref} />
          <input type="hidden" name="result" value="fail" />
          <button type="submit" className="h-12 w-full bg-red-600 text-sm font-medium text-white">
            Ödeme Başarısız
          </button>
        </form>
      </div>
    </div>
  );
}
