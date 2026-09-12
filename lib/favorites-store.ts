"use client";

import { createPersistentStore } from "./persistent-store";
import type { ProductCardData } from "./queries";

const EMPTY: ProductCardData[] = [];

const store = createPersistentStore<ProductCardData[]>(
  "favorites:v1",
  EMPTY,
  (raw) =>
    Array.isArray(raw)
      ? raw.filter((p): p is ProductCardData => typeof p?.id === "number")
      : EMPTY,
);

export const useFavorites = store.useValue;

export const favorites = {
  toggle(product: ProductCardData) {
    const list = store.get();
    store.set(
      list.some((p) => p.id === product.id)
        ? list.filter((p) => p.id !== product.id)
        : [product, ...list].slice(0, 100),
    );
  },
};
