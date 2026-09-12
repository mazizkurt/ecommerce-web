"use client";

import { Heart, House, Package, ShoppingBag, User } from "lucide-react";
import Link from "next/link";
import { WhatsAppIcon } from "@/components/icons";
import { cartCount, useCartItems } from "@/lib/cart-store";
import { useCartUI } from "./cart-ui";

export function WhatsAppButton({ phone }: { phone: string }) {
  if (!phone) return null;
  return (
    <a
      href={`https://wa.me/${phone}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="WhatsApp ile yazın"
      className="fixed bottom-[76px] right-4 z-40 flex size-[52px] items-center justify-center rounded-full bg-whatsapp text-white shadow-lg transition-transform hover:scale-105 lg:bottom-6 lg:right-6"
    >
      <WhatsAppIcon className="size-7" />
    </a>
  );
}

export function MobileBottomNav() {
  const items = useCartItems();
  const { openCart } = useCartUI();
  const count = cartCount(items);
  const cls = "flex flex-col items-center justify-center gap-0.5 text-[11px]";

  return (
    <nav
      aria-label="Alt menü"
      className="fixed inset-x-0 bottom-0 z-40 grid h-[60px] grid-cols-5 border-t border-line bg-white pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <Link href="/" className={cls}>
        <House className="size-5" strokeWidth={1.5} />
        Anasayfa
      </Link>
      <Link href="/siparis-takip" className={cls}>
        <Package className="size-5" strokeWidth={1.5} />
        Sipariş Takip
      </Link>
      <button type="button" onClick={openCart} className={cls}>
        <span className="relative">
          <ShoppingBag className="size-5" strokeWidth={1.5} />
          <span className="absolute -right-2.5 -top-2 flex size-4 items-center justify-center rounded-full bg-badge text-[10px] text-white">
            {count}
          </span>
        </span>
        Sepetim
      </button>
      <Link href="/favoriler" className={cls}>
        <Heart className="size-5" strokeWidth={1.5} />
        Favorilerim
      </Link>
      <Link href="/hesabim" className={cls}>
        <User className="size-5" strokeWidth={1.5} />
        Hesabım
      </Link>
    </nav>
  );
}
