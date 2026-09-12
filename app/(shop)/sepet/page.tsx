import type { Metadata } from "next";
import { CartView } from "@/components/shop/cart-view";

export const metadata: Metadata = { title: "Sepetim", robots: { index: false } };

export default function CartPage() {
  return (
    <div className="mx-auto max-w-[1280px] px-4 py-8 lg:px-8">
      <h1 className="mb-6 text-2xl">Sepetim</h1>
      <CartView />
    </div>
  );
}
