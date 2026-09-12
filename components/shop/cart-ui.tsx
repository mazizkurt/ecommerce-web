"use client";

import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { cart, cartCount, useCartItems } from "@/lib/cart-store";
import { cn } from "@/lib/cn";
import { formatPrice } from "@/lib/format";
import { calcTotals, cartPrice, type PricingSettings } from "@/lib/pricing";
import type { ProductCardData } from "@/lib/queries";

type CartUI = {
  pricing: PricingSettings;
  cartPriceLabel: string;
  openCart: () => void;
  closeCart: () => void;
  quickAdd: (product: ProductCardData) => void;
  addVariant: (product: ProductCardData, variantId: number, qty?: number) => void;
};

const CartUIContext = createContext<CartUI | null>(null);

export function useCartUI() {
  const ctx = useContext(CartUIContext);
  if (!ctx) throw new Error("useCartUI, CartUIProvider içinde kullanılmalı");
  return ctx;
}

export function useLockBodyScroll(locked: boolean) {
  useEffect(() => {
    if (!locked) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [locked]);
}

export function CartUIProvider({
  pricing,
  cartPriceLabel,
  children,
}: {
  pricing: PricingSettings;
  cartPriceLabel: string;
  children: React.ReactNode;
}) {
  const [cartOpen, setCartOpen] = useState(false);
  const [quickProduct, setQuickProduct] = useState<ProductCardData | null>(
    null,
  );

  const addVariant = useCallback(
    (product: ProductCardData, variantId: number, qty = 1) => {
      const variant = product.variants.find((v) => v.id === variantId);
      if (!variant || variant.stock <= 0) return;
      cart.add(
        {
          variantId: variant.id,
          productId: product.id,
          slug: product.slug,
          name: product.name,
          size: variant.size,
          image: product.images[0] ?? "",
          price: product.price,
          comparePrice: product.comparePrice,
          stock: variant.stock,
        },
        qty,
      );
      setQuickProduct(null);
      setCartOpen(true);
    },
    [],
  );

  const quickAdd = useCallback(
    (product: ProductCardData) => {
      const available = product.variants.filter((v) => v.stock > 0);
      if (available.length === 1) addVariant(product, available[0].id);
      else if (available.length > 1) setQuickProduct(product);
    },
    [addVariant],
  );

  const value = useMemo<CartUI>(
    () => ({
      pricing,
      cartPriceLabel,
      openCart: () => setCartOpen(true),
      closeCart: () => setCartOpen(false),
      quickAdd,
      addVariant,
    }),
    [pricing, cartPriceLabel, quickAdd, addVariant],
  );

  return (
    <CartUIContext.Provider value={value}>
      {children}
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
      {quickProduct && (
        <QuickAddModal
          product={quickProduct}
          onClose={() => setQuickProduct(null)}
        />
      )}
    </CartUIContext.Provider>
  );
}

function CartDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const items = useCartItems();
  const { pricing } = useCartUI();
  const totals = calcTotals(items, pricing);
  useLockBodyScroll(open);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <div
      className={cn("fixed inset-0 z-[60]", !open && "pointer-events-none")}
      aria-hidden={!open}
    >
      <div
        className={cn(
          "absolute inset-0 bg-black/50 transition-opacity duration-300",
          open ? "opacity-100" : "opacity-0",
        )}
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-label="Sepetim"
        className={cn(
          "absolute inset-y-0 right-0 flex w-full max-w-[420px] flex-col bg-white shadow-xl transition-transform duration-300",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-line px-5">
          <span className="text-lg font-medium">
            Sepetim ({cartCount(items)})
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Kapat"
            className="p-1"
          >
            <X className="size-6" strokeWidth={1.5} />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
            <ShoppingBag className="size-14 text-zinc-300" strokeWidth={1} />
            <p className="text-sm text-zinc-600">
              Sepetinizde ürün bulunmamaktadır.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="h-11 bg-brand px-8 text-sm font-medium text-brand-text"
            >
              ALIŞVERİŞE BAŞLA
            </button>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-line overflow-y-auto px-5">
              {items.map((item) => (
                <li key={item.variantId} className="flex gap-3 py-4">
                  <Link
                    href={`/urun/${item.slug}`}
                    onClick={onClose}
                    className="relative h-[120px] w-20 shrink-0 overflow-hidden bg-soft"
                  >
                    {item.image && (
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    )}
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <Link
                      href={`/urun/${item.slug}`}
                      onClick={onClose}
                      className="line-clamp-2 text-[13px] leading-4"
                    >
                      {item.name}
                    </Link>
                    <span className="mt-1 text-xs text-zinc-500">
                      Beden: {item.size}
                    </span>
                    <div className="mt-1 flex items-baseline gap-2 text-sm">
                      {pricing.cartDiscountPercent > 0 && (
                        <span className="text-xs text-zinc-400 line-through">
                          {formatPrice(item.price)}
                        </span>
                      )}
                      <span className="font-medium">
                        {formatPrice(
                          cartPrice(item.price, pricing.cartDiscountPercent),
                        )}
                      </span>
                    </div>
                    <div className="mt-auto flex items-center justify-between pt-2">
                      <QuantityStepper
                        value={item.quantity}
                        max={item.stock}
                        onChange={(q) => cart.setQuantity(item.variantId, q)}
                      />
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

            <div className="border-t border-line px-5 py-4">
              <FreeShippingProgress
                remaining={totals.remainingForFreeShipping}
                threshold={pricing.freeShippingThreshold}
              />
              <dl className="mt-3 space-y-1 text-sm">
                <div className="flex justify-between">
                  <dt className="text-zinc-600">Ara Toplam</dt>
                  <dd>{formatPrice(totals.subtotal)}</dd>
                </div>
                {totals.discount > 0 && (
                  <div className="flex justify-between text-accent">
                    <dt>Sepet İndirimi (%{pricing.cartDiscountPercent})</dt>
                    <dd>-{formatPrice(totals.discount)}</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-zinc-600">Kargo</dt>
                  <dd>
                    {totals.shippingFee === 0
                      ? "Ücretsiz"
                      : formatPrice(totals.shippingFee)}
                  </dd>
                </div>
                <div className="flex justify-between pt-1 text-base font-medium">
                  <dt>Toplam</dt>
                  <dd>{formatPrice(totals.total)}</dd>
                </div>
              </dl>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <Link
                  href="/sepet"
                  onClick={onClose}
                  className="flex h-11 items-center justify-center border border-black text-sm font-medium"
                >
                  SEPETE GİT
                </Link>
                <Link
                  href="/odeme"
                  onClick={onClose}
                  className="flex h-11 items-center justify-center bg-brand text-sm font-medium text-brand-text transition-colors hover:bg-cart-hover"
                >
                  ÖDEMEYE GEÇ
                </Link>
              </div>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}

export function FreeShippingProgress({
  remaining,
  threshold,
}: {
  remaining: number;
  threshold: number;
}) {
  if (threshold <= 0) return null;
  const pct = Math.min(100, ((threshold - remaining) / threshold) * 100);
  return (
    <div>
      <p className="text-[13px]">
        {remaining > 0 ? (
          <>
            Ücretsiz kargo için <b>{formatPrice(remaining)}</b> daha ekleyin.
          </>
        ) : (
          <b>Kargonuz ücretsiz!</b>
        )}
      </p>
      <div className="mt-2 h-1 overflow-hidden rounded-full bg-line">
        <div
          className="h-full rounded-full bg-cart-hover transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function QuantityStepper({
  value,
  max,
  onChange,
}: {
  value: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex h-8 items-center border border-line">
      <button
        type="button"
        onClick={() => onChange(value - 1)}
        aria-label="Azalt"
        className="flex h-full w-8 items-center justify-center hover:bg-soft"
      >
        <Minus className="size-3" />
      </button>
      <span className="w-8 text-center text-sm">{value}</span>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        disabled={value >= max}
        aria-label="Arttır"
        className="flex h-full w-8 items-center justify-center hover:bg-soft disabled:opacity-30"
      >
        <Plus className="size-3" />
      </button>
    </div>
  );
}

function QuickAddModal({
  product,
  onClose,
}: {
  product: ProductCardData;
  onClose: () => void;
}) {
  const { pricing, addVariant } = useCartUI();
  const [selected, setSelected] = useState<number | null>(null);
  useLockBodyScroll(true);

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div
        role="dialog"
        aria-label="Beden seçin"
        className="relative w-full max-w-md animate-fade-in bg-white p-5 sm:rounded"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Kapat"
          className="absolute right-3 top-3 p-1"
        >
          <X className="size-5" />
        </button>
        <div className="flex gap-4">
          <div className="relative h-[150px] w-[100px] shrink-0 overflow-hidden bg-soft">
            {product.images[0] && (
              <Image
                src={product.images[0]}
                alt={product.name}
                fill
                sizes="100px"
                className="object-cover"
              />
            )}
          </div>
          <div className="min-w-0 pr-6">
            <p className="text-sm leading-5">{product.name}</p>
            <p className="mt-2 text-sm">
              <span className="text-zinc-400 line-through">
                {formatPrice(product.price)}
              </span>{" "}
              <span className="font-medium text-accent">
                {formatPrice(cartPrice(product.price, pricing.cartDiscountPercent))}
              </span>
            </p>
            <p className="mt-4 text-sm font-medium">Beden:</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {product.variants.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  disabled={v.stock <= 0}
                  onClick={() => setSelected(v.id)}
                  className={cn(
                    "min-w-9 border px-2 py-1.5 text-sm transition-colors",
                    selected === v.id
                      ? "border-black bg-black text-white"
                      : "border-zinc-300 hover:border-black",
                    v.stock <= 0 && "cursor-not-allowed text-zinc-300 line-through hover:border-zinc-300",
                  )}
                >
                  {v.size}
                </button>
              ))}
            </div>
          </div>
        </div>
        <button
          type="button"
          disabled={selected == null}
          onClick={() => selected != null && addVariant(product, selected)}
          className="mt-5 h-11 w-full bg-brand text-sm font-medium text-brand-text transition-colors hover:bg-cart-hover disabled:bg-zinc-400"
        >
          {selected == null ? "BEDEN SEÇİNİZ" : "SEPETE EKLE"}
        </button>
      </div>
    </div>
  );
}
