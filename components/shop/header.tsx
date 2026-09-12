"use client";

import {
  ChevronDown,
  ChevronRight,
  Heart,
  Menu,
  Search,
  ShoppingBag,
  ShoppingCart,
  User,
  X,
} from "lucide-react";
import Form from "next/form";
import Link from "next/link";
import { useState } from "react";
import { WhatsAppIcon } from "@/components/icons";
import { cartCount, useCartItems } from "@/lib/cart-store";
import { cn } from "@/lib/cn";
import type { CategoryNode } from "@/lib/queries";
import { useCartUI, useLockBodyScroll } from "./cart-ui";

type HeaderProps = {
  menu: CategoryNode[];
  logoText: string;
  whatsapp: string;
};

export function Logo({ text, className }: { text: string; className?: string }) {
  return (
    <Link
      href="/"
      className={cn(
        "font-logo leading-none tracking-[0.16em] text-black",
        className,
      )}
    >
      {text}
    </Link>
  );
}

function CountBadge({ count, className }: { count: number; className?: string }) {
  return (
    <span
      className={cn(
        "absolute -right-2.5 -top-2.5 flex size-[18px] items-center justify-center rounded-full text-[11px] leading-none text-white",
        className,
      )}
    >
      {count}
    </span>
  );
}

export function Header({ menu, logoText, whatsapp }: HeaderProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const items = useCartItems();
  const count = cartCount(items);
  const { openCart } = useCartUI();

  return (
    <header className="sticky top-0 z-40 border-b border-line-strong bg-white">
      {/* Masaüstü */}
      <div className="hidden h-20 grid-cols-[1fr_4fr_1fr] lg:grid">
        <div className="flex items-center border-r border-line-strong pl-8">
          <Logo text={logoText} className="text-[34px]" />
        </div>
        <nav aria-label="Ana menü" className="flex items-center justify-center">
          <ul className="flex flex-wrap items-center justify-center gap-x-[30px]">
            {menu.map((item) => (
              <li key={item.id} className="group relative py-2">
                <Link
                  href={`/kategori/${item.slug}`}
                  className={cn(
                    "relative flex items-center gap-1 text-[15px] font-medium text-black after:absolute after:-bottom-0.5 after:left-0 after:h-px after:w-0 after:bg-black after:transition-all after:duration-300 group-hover:after:w-full",
                    item.highlight && "animate-blink text-red-600",
                  )}
                >
                  {item.name}
                  {item.children.length > 0 && (
                    <ChevronDown className="size-3.5" strokeWidth={2} />
                  )}
                </Link>
                {item.children.length > 0 && (
                  <ul className="invisible absolute left-0 top-full z-50 w-[170px] translate-y-5 bg-white py-1 opacity-0 shadow-[1px_1px_3px_0_#dcdcdc] transition-all duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                    {item.children.map((child) => (
                      <li key={child.id}>
                        <Link
                          href={`/kategori/${child.slug}`}
                          className="block px-5 py-2.5 text-[13px] text-black transition-colors hover:text-zinc-500"
                        >
                          {child.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex items-center justify-end gap-6 border-l border-line-strong pr-8">
          <button
            type="button"
            onClick={() => setSearchOpen((v) => !v)}
            aria-label="Ara"
          >
            <Search className="size-6" strokeWidth={1.5} />
          </button>
          <Link href="/favoriler" aria-label="Favorilerim">
            <Heart className="size-6" strokeWidth={1.5} />
          </Link>
          <Link href="/hesabim" aria-label="Hesabım">
            <User className="size-6" strokeWidth={1.5} />
          </Link>
          <button
            type="button"
            onClick={openCart}
            aria-label="Sepetim"
            className="relative"
          >
            <ShoppingCart className="size-6" strokeWidth={1.5} />
            <CountBadge count={count} className="bg-badge" />
          </button>
        </div>
      </div>

      {/* Mobil */}
      <div className="grid h-[58px] grid-cols-[1fr_auto_1fr] items-center px-3 lg:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="flex items-center gap-2 justify-self-start text-[15px]"
        >
          <Menu className="size-6" strokeWidth={1.8} />
          Menü
        </button>
        <Logo text={logoText} className="text-2xl" />
        <div className="flex items-center gap-4 justify-self-end">
          <Link href="/hesabim" aria-label="Hesabım">
            <User className="size-6" strokeWidth={1.5} />
          </Link>
          <button
            type="button"
            onClick={() => setSearchOpen((v) => !v)}
            aria-label="Ara"
          >
            <Search className="size-6" strokeWidth={1.5} />
          </button>
          <button
            type="button"
            onClick={openCart}
            aria-label="Sepetim"
            className="relative mr-1"
          >
            <ShoppingBag className="size-6" strokeWidth={1.5} />
            <CountBadge count={count} className="bg-black" />
          </button>
        </div>
      </div>

      {searchOpen && (
        <div className="absolute inset-x-0 top-full z-30 animate-fade-in bg-[#ebebeb]">
          <Form
            action="/arama"
            onSubmit={() => setSearchOpen(false)}
            className="relative mx-auto flex h-[60px] items-center"
          >
            <input
              type="search"
              name="q"
              autoFocus
              placeholder="Aramak istediğin ürün"
              className="h-full w-full bg-transparent pl-6 pr-16 text-sm font-medium text-zinc-700 outline-none placeholder:text-zinc-500"
            />
            <button
              type="submit"
              aria-label="Ara"
              className="absolute right-3.5 flex size-[45px] items-center justify-center rounded-full bg-black text-white"
            >
              <Search className="size-4" />
            </button>
          </Form>
        </div>
      )}

      <MobileMenu
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        menu={menu}
        logoText={logoText}
        whatsapp={whatsapp}
      />
    </header>
  );
}

function MobileMenu({
  open,
  onClose,
  menu,
  logoText,
  whatsapp,
}: HeaderProps & { open: boolean; onClose: () => void }) {
  const [expanded, setExpanded] = useState<number | null>(null);
  useLockBodyScroll(open);

  return (
    <div
      className={cn("fixed inset-0 z-[60] lg:hidden", !open && "pointer-events-none")}
      aria-hidden={!open}
    >
      <div
        className={cn(
          "absolute inset-0 bg-black/50 transition-opacity duration-300",
          open ? "opacity-100" : "opacity-0",
        )}
        onClick={onClose}
      />
      <nav
        aria-label="Mobil menü"
        className={cn(
          "absolute inset-y-0 left-0 flex w-[85%] max-w-sm flex-col bg-white transition-transform duration-300",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between border-b border-[#e2e2e2] p-4">
          <Logo text={logoText} className="text-3xl" />
          <button type="button" onClick={onClose} aria-label="Menüyü kapat">
            <X className="size-6" strokeWidth={1.5} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <Form action="/arama" onSubmit={onClose} className="relative m-4">
            <input
              type="search"
              name="q"
              placeholder="Ara.."
              className="h-11 w-full border border-line bg-soft pl-3 pr-11 text-sm outline-none"
            />
            <button
              type="submit"
              aria-label="Ara"
              className="absolute right-0 top-0 flex size-11 items-center justify-center"
            >
              <Search className="size-4" />
            </button>
          </Form>
          <ul className="border-t border-[#eaeaea]">
            {menu.map((item) => (
              <li key={item.id} className="border-b border-[#eaeaea]">
                <div className="flex items-center">
                  <Link
                    href={`/kategori/${item.slug}`}
                    onClick={onClose}
                    className={cn(
                      "flex-1 px-4 py-3.5 text-sm font-medium",
                      item.highlight && "text-red-600",
                    )}
                  >
                    {item.name}
                  </Link>
                  {item.children.length > 0 && (
                    <button
                      type="button"
                      onClick={() =>
                        setExpanded((v) => (v === item.id ? null : item.id))
                      }
                      aria-label={`${item.name} alt kategorileri`}
                      className="px-4 py-3.5"
                    >
                      <ChevronRight
                        className={cn(
                          "size-4 transition-transform",
                          expanded === item.id && "rotate-90",
                        )}
                      />
                    </button>
                  )}
                </div>
                {expanded === item.id && (
                  <ul className="bg-soft pb-2">
                    {item.children.map((child) => (
                      <li key={child.id}>
                        <Link
                          href={`/kategori/${child.slug}`}
                          onClick={onClose}
                          className="block px-8 py-2.5 text-[13px]"
                        >
                          {child.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
          <ul className="mt-4 text-sm text-[#333]">
            <li>
              <Link href="/siparis-takip" onClick={onClose} className="block px-4 py-2.5">
                Sipariş Takip
              </Link>
            </li>
            <li>
              <Link href="/favoriler" onClick={onClose} className="block px-4 py-2.5">
                Favorilerim
              </Link>
            </li>
            <li>
              <Link href="/hesabim" onClick={onClose} className="block px-4 py-2.5">
                Hesabım
              </Link>
            </li>
            {whatsapp && (
              <li>
                <a
                  href={`https://wa.me/${whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2.5"
                >
                  <WhatsAppIcon className="size-4 text-[#21bd5c]" />
                  WhatsApp Destek
                </a>
              </li>
            )}
          </ul>
        </div>
      </nav>
    </div>
  );
}
