"use client";

import { ShoppingBag, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { cart } from "@/lib/cart-store";
import { formatPrice } from "@/lib/format";
import { calcTotals, cartPrice } from "@/lib/pricing";
import { useSyncedCart } from "@/lib/use-synced-cart";
import { FreeShippingProgress, QuantityStepper, useCartUI } from "./cart-ui";

export function CartView() {
  const { items, notice, synced } = useSyncedCart();
  const { pricing } = useCartUI();
  const totals = calcTotals(items, pricing);

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-24 text-center">
        <ShoppingBag className="size-16 text-zinc-300" strokeWidth={1} />
        <p className="text-sm text-zinc-600">
          {synced ? "Sepetinizde ürün bulunmamaktadır." : "Sepetiniz yükleniyor..."}
        </p>
        {notice && <p className="max-w-md text-[13px] text-amber-700">{notice}</p>}
        <Link href="/" className="h-11 bg-black px-8 text-sm font-medium leading-[44px] text-white">
          ALIŞVERİŞE BAŞLA
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div>
        {notice && (
          <p className="mb-4 border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-800">
            {notice}
          </p>
        )}
        <ul className="divide-y divide-line border-y border-line">
          {items.map((item) => (
            <li key={item.variantId} className="flex gap-4 py-4">
              <Link
                href={`/urun/${item.slug}`}
                className="relative h-[150px] w-[100px] shrink-0 overflow-hidden bg-soft"
              >
                {item.image && (
                  <Image src={item.image} alt={item.name} fill sizes="100px" className="object-cover" />
                )}
              </Link>
              <div className="flex min-w-0 flex-1 flex-col gap-1 sm:flex-row sm:items-start sm:gap-6">
                <div className="min-w-0 flex-1">
                  <Link href={`/urun/${item.slug}`} className="text-sm leading-5 hover:underline">
                    {item.name}
                  </Link>
                  <p className="mt-1 text-xs text-zinc-500">Beden: {item.size}</p>
                  <p className="mt-1 text-sm">
                    {pricing.cartDiscountPercent > 0 && (
                      <span className="mr-2 text-xs text-zinc-400 line-through">
                        {formatPrice(item.price)}
                      </span>
                    )}
                    {formatPrice(cartPrice(item.price, pricing.cartDiscountPercent))}
                  </p>
                </div>
                <div className="mt-2 flex items-center justify-between gap-6 sm:mt-0">
                  <QuantityStepper
                    value={item.quantity}
                    max={item.stock}
                    onChange={(q) => cart.setQuantity(item.variantId, q)}
                  />
                  <span className="w-24 text-right text-sm font-medium">
                    {formatPrice(cartPrice(item.price, pricing.cartDiscountPercent) * item.quantity)}
                  </span>
                  <button
                    type="button"
                    onClick={() => cart.remove(item.variantId)}
                    aria-label="Ürünü sil"
                    className="p-1 text-zinc-500 hover:text-black"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <aside className="h-fit border border-line p-5 lg:sticky lg:top-24">
        <h2 className="mb-4 text-base font-medium">Sipariş Özeti</h2>
        <FreeShippingProgress
          remaining={totals.remainingForFreeShipping}
          threshold={pricing.freeShippingThreshold}
        />
        <dl className="mt-4 space-y-2 text-sm">
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
          <div className="flex justify-between border-t border-line pt-3 text-base font-medium">
            <dt>Toplam</dt>
            <dd>{formatPrice(totals.total)}</dd>
          </div>
        </dl>
        <Link
          href="/odeme"
          className="mt-5 flex h-12 w-full items-center justify-center bg-[#030303] text-sm font-medium text-white transition-colors hover:bg-[#4dc762]"
        >
          ÖDEMEYE GEÇ
        </Link>
        <Link href="/" className="mt-3 block text-center text-[13px] underline">
          Alışverişe devam et
        </Link>
      </aside>
    </div>
  );
}
