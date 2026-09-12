"use client";

import { Heart } from "lucide-react";
import Link from "next/link";
import { useFavorites } from "@/lib/favorites-store";
import { useCartUI } from "./cart-ui";
import { ProductCard } from "./product-card";

export function FavoritesList() {
  const items = useFavorites();
  const { pricing } = useCartUI();

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <Heart className="size-14 text-zinc-300" strokeWidth={1} />
        <p className="text-sm text-zinc-600">Favori listenizde ürün bulunmuyor.</p>
        <Link href="/" className="bg-brand px-8 py-3 text-sm font-medium text-brand-text">
          ÜRÜNLERİ KEŞFET
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-[5px] px-[3px] lg:grid-cols-3 xl:grid-cols-4">
      {items.map((p) => (
        <ProductCard key={p.id} product={p} cartDiscountPercent={pricing.cartDiscountPercent} titleStyle="normal" />
      ))}
    </div>
  );
}
