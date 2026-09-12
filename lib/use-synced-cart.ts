"use client";

import { useEffect, useState } from "react";
import { syncCart } from "./actions/shop";
import { cart, type CartItem, useCartItems } from "./cart-store";

/**
 * Sayfa açıldığında sepetteki fiyat/stok bilgilerini sunucudan tazeler.
 * Stokta kalmayan ürünleri çıkarır, adetleri stokla sınırlar.
 */
export function useSyncedCart() {
  const items = useCartItems();
  const [notice, setNotice] = useState<string | null>(null);
  const [synced, setSynced] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const snapshot = cart.items();
    const request = snapshot.length
      ? syncCart(snapshot.map((i) => i.variantId))
      : Promise.resolve(null);
    request
      .then((fresh) => {
        if (cancelled || !fresh) return;
        const next: CartItem[] = [];
        const changes: string[] = [];
        for (const item of cart.items()) {
          const f = fresh.find((x) => x.variantId === item.variantId);
          if (!f || !f.isActive || f.stock <= 0) {
            changes.push(`${item.name} (${item.size}) stokta kalmadığı için sepetten çıkarıldı.`);
            continue;
          }
          const quantity = Math.min(item.quantity, f.stock);
          if (quantity < item.quantity) {
            changes.push(`${f.name} (${f.size}) adedi stok nedeniyle ${quantity} olarak güncellendi.`);
          }
          if (f.price !== item.price) changes.push(`${f.name} fiyatı güncellendi.`);
          next.push({
            ...item,
            name: f.name,
            slug: f.slug,
            size: f.size,
            price: f.price,
            comparePrice: f.comparePrice,
            stock: f.stock,
            quantity,
          });
        }
        cart.replace(next);
        setNotice(changes.length ? changes.join(" ") : null);
      })
      .catch(() => {})
      .finally(() => !cancelled && setSynced(true));
    return () => {
      cancelled = true;
    };
  }, []);

  return { items, notice, synced };
}
