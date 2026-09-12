"use client";

import { useEffect } from "react";
import { cart } from "@/lib/cart-store";

/** Sipariş onay sayfasında sepeti boşaltır (kartlı ödemede geri dönüşten sonra). */
export function ClearCart() {
  useEffect(() => {
    cart.clear();
  }, []);
  return null;
}
