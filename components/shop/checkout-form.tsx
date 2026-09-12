"use client";

import { Banknote, Lock, Truck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { type CheckoutState, placeOrder } from "@/lib/actions/shop";
import { cart } from "@/lib/cart-store";
import { cn } from "@/lib/cn";
import { CITIES, PAYMENT_METHOD_LABELS } from "@/lib/constants";
import type { PaymentMethod } from "@/lib/db/schema";
import { formatPrice } from "@/lib/format";
import { calcTotals, cartPrice } from "@/lib/pricing";
import { useSyncedCart } from "@/lib/use-synced-cart";
import { useCartUI } from "./cart-ui";

type Defaults = { email: string; phone: string; firstName: string; lastName: string };

const inputCls = (error?: string) =>
  cn(
    "h-11 w-full border bg-white px-3 text-sm outline-none transition-colors focus:border-black",
    error ? "border-red-500" : "border-zinc-300",
  );

function Field({
  label,
  error,
  children,
  className,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1.5 block text-[13px] text-zinc-700">{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  );
}

export function CheckoutForm({
  methods,
  defaults,
}: {
  methods: PaymentMethod[];
  defaults: Defaults;
}) {
  const router = useRouter();
  const { items, notice, synced } = useSyncedCart();
  const { pricing } = useCartUI();
  const [method, setMethod] = useState<PaymentMethod | undefined>(methods[0]);
  const [state, action, pending] = useActionState<CheckoutState, FormData>(placeOrder, {});
  const totals = calcTotals(items, pricing, method);
  const v = { ...defaults, ...state.values } as Record<string, string | undefined>;
  const e = state.errors ?? {};

  useEffect(() => {
    if (state.ok && state.token) {
      cart.clear();
      router.replace(`/siparis/${state.token}?yeni=1`);
    }
  }, [state, router]);

  if (state.ok) {
    return <p className="py-24 text-center text-sm">Siparişiniz oluşturuluyor...</p>;
  }

  if (items.length === 0) {
    return (
      <div className="py-24 text-center">
        <p className="text-sm text-zinc-600">
          {synced ? "Sepetinizde ürün bulunmuyor." : "Sepetiniz yükleniyor..."}
        </p>
        {notice && <p className="mt-2 text-[13px] text-amber-700">{notice}</p>}
        <Link href="/" className="mt-6 inline-block bg-black px-8 py-3 text-sm text-white">
          ALIŞVERİŞE BAŞLA
        </Link>
      </div>
    );
  }

  if (methods.length === 0) {
    return (
      <p className="py-24 text-center text-sm text-red-600">
        Şu anda aktif bir ödeme yöntemi bulunmuyor. Lütfen bizimle iletişime geçin.
      </p>
    );
  }

  return (
    <form action={action} className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_420px]">
      <input
        type="hidden"
        name="items"
        value={JSON.stringify(items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })))}
      />

      <div className="space-y-8">
        {notice && (
          <p className="border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-800">
            {notice}
          </p>
        )}

        <section>
          <h2 className="mb-4 text-base font-medium">1. İletişim Bilgileri</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="E-posta" error={e.email}>
              <input name="email" type="email" autoComplete="email" defaultValue={v.email} className={inputCls(e.email)} />
            </Field>
            <Field label="Cep Telefonu" error={e.phone}>
              <input name="phone" type="tel" autoComplete="tel" placeholder="05xx xxx xx xx" defaultValue={v.phone} className={inputCls(e.phone)} />
            </Field>
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-base font-medium">2. Teslimat Adresi</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Ad" error={e.firstName}>
              <input name="firstName" autoComplete="given-name" defaultValue={v.firstName} className={inputCls(e.firstName)} />
            </Field>
            <Field label="Soyad" error={e.lastName}>
              <input name="lastName" autoComplete="family-name" defaultValue={v.lastName} className={inputCls(e.lastName)} />
            </Field>
            <Field label="İl" error={e.city}>
              <select name="city" defaultValue={v.city ?? ""} className={inputCls(e.city)}>
                <option value="" disabled>
                  İl seçiniz
                </option>
                {CITIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="İlçe" error={e.district}>
              <input name="district" defaultValue={v.district} className={inputCls(e.district)} />
            </Field>
            <Field label="Açık Adres" error={e.address} className="sm:col-span-2">
              <textarea
                name="address"
                rows={3}
                autoComplete="street-address"
                placeholder="Mahalle, cadde, sokak, bina ve daire no"
                defaultValue={v.address}
                className={cn(inputCls(e.address), "h-auto py-2.5")}
              />
            </Field>
            <Field label="Sipariş Notu (isteğe bağlı)" className="sm:col-span-2">
              <input name="note" defaultValue={v.note} className={inputCls()} />
            </Field>
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-base font-medium">3. Ödeme Yöntemi</h2>
          <div className="space-y-2.5">
            {methods.map((m) => (
              <label
                key={m}
                className={cn(
                  "flex cursor-pointer items-start gap-3 border p-4 transition-colors",
                  method === m ? "border-black" : "border-zinc-300",
                )}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value={m}
                  checked={method === m}
                  onChange={() => setMethod(m)}
                  className="mt-1 accent-black"
                />
                <span className="flex-1">
                  <span className="flex items-center gap-2 text-sm font-medium">
                    {m === "bank_transfer" ? <Banknote className="size-4" /> : <Truck className="size-4" />}
                    {PAYMENT_METHOD_LABELS[m]}
                    {m === "cash_on_delivery" && pricing.codFee > 0 && (
                      <span className="font-normal text-zinc-500">(+{formatPrice(pricing.codFee)} hizmet bedeli)</span>
                    )}
                  </span>
                  <span className="mt-1 block text-[13px] text-zinc-500">
                    {m === "bank_transfer"
                      ? "Siparişinizi tamamladıktan sonra banka hesap bilgilerimiz gösterilecektir. Ödemeniz onaylandığında siparişiniz hazırlanır."
                      : "Ödemeyi ürünü teslim alırken kapıda nakit veya kart ile yapabilirsiniz."}
                  </span>
                </span>
              </label>
            ))}
          </div>
          {e.paymentMethod && <p className="mt-1 text-xs text-red-600">{e.paymentMethod}</p>}
        </section>
      </div>

      <aside className="h-fit border border-line p-5 lg:sticky lg:top-24">
        <h2 className="mb-4 text-base font-medium">Sipariş Özeti ({items.length} ürün)</h2>
        <ul className="max-h-72 space-y-3 overflow-y-auto pr-1">
          {items.map((i) => (
            <li key={i.variantId} className="flex gap-3">
              <div className="relative h-[72px] w-12 shrink-0 overflow-hidden bg-soft">
                {i.image && <Image src={i.image} alt="" fill sizes="48px" className="object-cover" />}
              </div>
              <div className="min-w-0 flex-1 text-[13px]">
                <p className="line-clamp-2 leading-4">{i.name}</p>
                <p className="mt-1 text-zinc-500">
                  {i.size} · {i.quantity} adet
                </p>
              </div>
              <span className="text-[13px] font-medium">
                {formatPrice(cartPrice(i.price, pricing.cartDiscountPercent) * i.quantity)}
              </span>
            </li>
          ))}
        </ul>
        <dl className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-zinc-600">Ara Toplam</dt>
            <dd>{formatPrice(totals.subtotal)}</dd>
          </div>
          {totals.discount > 0 && (
            <div className="flex justify-between text-accent">
              <dt>Sepet İndirimi</dt>
              <dd>-{formatPrice(totals.discount)}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-zinc-600">Kargo</dt>
            <dd>{totals.shippingFee === 0 ? "Ücretsiz" : formatPrice(totals.shippingFee)}</dd>
          </div>
          {totals.paymentFee > 0 && (
            <div className="flex justify-between">
              <dt className="text-zinc-600">Kapıda Ödeme Bedeli</dt>
              <dd>{formatPrice(totals.paymentFee)}</dd>
            </div>
          )}
          <div className="flex justify-between border-t border-line pt-3 text-base font-medium">
            <dt>Toplam</dt>
            <dd>{formatPrice(totals.total)}</dd>
          </div>
        </dl>

        <label className="mt-5 flex items-start gap-2.5 text-[13px] leading-5">
          <input type="checkbox" name="agreement" className="mt-1 accent-black" />
          <span>
            <Link href="/sayfa/mesafeli-satis-sozlesmesi" target="_blank" className="underline">
              Mesafeli Satış Sözleşmesi
            </Link>{" "}
            ve{" "}
            <Link href="/sayfa/gizlilik-sozlesmesi" target="_blank" className="underline">
              Gizlilik Sözleşmesi
            </Link>
            &apos;ni okudum, onaylıyorum.
          </span>
        </label>
        {e.agreement && <p className="mt-1 text-xs text-red-600">{e.agreement}</p>}

        {state.message && (
          <p role="alert" className="mt-4 bg-red-50 px-3 py-2.5 text-[13px] text-red-700">
            {state.message}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="mt-5 flex h-12 w-full items-center justify-center gap-2 bg-[#030303] text-sm font-medium text-white transition-colors hover:bg-[#4dc762] disabled:opacity-60"
        >
          <Lock className="size-4" />
          {pending ? "İŞLENİYOR..." : "SİPARİŞİ TAMAMLA"}
        </button>
      </aside>
    </form>
  );
}
