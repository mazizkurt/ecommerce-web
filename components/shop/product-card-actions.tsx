"use client";

import { Heart, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/cn";
import { favorites, useFavorites } from "@/lib/favorites-store";
import type { ProductCardData } from "@/lib/queries";
import { useCartUI } from "./cart-ui";

export function FavoriteButton({
  product,
  className,
  size = "size-[22px]",
}: {
  product: ProductCardData;
  className?: string;
  size?: string;
}) {
  const list = useFavorites();
  const active = list.some((p) => p.id === product.id);
  return (
    <button
      type="button"
      onClick={() => favorites.toggle(product)}
      aria-label={active ? "Favorilerden çıkar" : "Favorilere ekle"}
      aria-pressed={active}
      className={cn("text-black", className)}
    >
      <Heart className={size} strokeWidth={1.6} fill={active ? "currentColor" : "none"} />
    </button>
  );
}

/** Paneldeki "Sepetteki Fiyat" etiketi. */
export function CartPriceLabel() {
  const { cartPriceLabel } = useCartUI();
  return <>{cartPriceLabel}</>;
}

export function AddToCartCardButton({
  product,
  disabled,
}: {
  product: ProductCardData;
  disabled?: boolean;
}) {
  const { quickAdd } = useCartUI();
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => quickAdd(product)}
      className="inline-flex h-8 items-center gap-1.5 rounded-[3px] bg-brand px-4 text-[13px] font-medium text-brand-text transition-colors hover:bg-cart-hover disabled:bg-zinc-300"
    >
      <ShoppingCart className="size-3.5" strokeWidth={2} />
      {disabled ? "Tükendi" : "Sepete Ekle"}
    </button>
  );
}
