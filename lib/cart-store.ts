"use client";

import { createPersistentStore } from "./persistent-store";

export type CartItem = {
  variantId: number;
  productId: number;
  slug: string;
  name: string;
  size: string;
  image: string;
  price: number;
  comparePrice: number | null;
  stock: number;
  quantity: number;
};

const EMPTY: CartItem[] = [];

const store = createPersistentStore<CartItem[]>("cart:v1", EMPTY, (raw) =>
  Array.isArray(raw)
    ? raw.filter(
        (i): i is CartItem =>
          typeof i?.variantId === "number" && typeof i?.quantity === "number",
      )
    : EMPTY,
);

export const useCartItems = store.useValue;

export const cart = {
  items: store.get,
  add(item: Omit<CartItem, "quantity">, quantity = 1) {
    const items = store.get();
    const existing = items.find((i) => i.variantId === item.variantId);
    const max = Math.max(0, item.stock);
    if (existing) {
      store.set(
        items.map((i) =>
          i.variantId === item.variantId
            ? { ...i, ...item, quantity: Math.min(max, i.quantity + quantity) }
            : i,
        ),
      );
    } else if (max > 0) {
      store.set([...items, { ...item, quantity: Math.min(max, quantity) }]);
    }
  },
  setQuantity(variantId: number, quantity: number) {
    const items = store.get();
    store.set(
      quantity <= 0
        ? items.filter((i) => i.variantId !== variantId)
        : items.map((i) =>
            i.variantId === variantId
              ? { ...i, quantity: Math.min(i.stock, quantity) }
              : i,
          ),
    );
  },
  remove(variantId: number) {
    store.set(store.get().filter((i) => i.variantId !== variantId));
  },
  replace(items: CartItem[]) {
    store.set(items);
  },
  clear() {
    store.set(EMPTY);
  },
};

export function cartCount(items: CartItem[]) {
  return items.reduce((sum, i) => sum + i.quantity, 0);
}
