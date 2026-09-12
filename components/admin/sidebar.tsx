"use client";

import {
  ClipboardList,
  CreditCard,
  ExternalLink,
  FileText,
  Folder,
  Image as ImageIcon,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  MessageSquare,
  Package,
  Settings,
  Ticket,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { adminLogout } from "@/lib/actions/admin";
import { cn } from "@/lib/cn";

type Counts = { pendingOrders: number; pendingReviews: number };

const NAV = [
  { href: "/admin", label: "Genel Bakış", icon: LayoutDashboard, exact: true },
  { href: "/admin/siparisler", label: "Siparişler", icon: ClipboardList, count: "pendingOrders" },
  { href: "/admin/urunler", label: "Ürünler", icon: Package },
  { href: "/admin/kategoriler", label: "Kategoriler", icon: Folder },
  { href: "/admin/kuponlar", label: "Kuponlar", icon: Ticket },
  { href: "/admin/bannerlar", label: "Bannerlar", icon: ImageIcon },
  { href: "/admin/yorumlar", label: "Yorumlar", icon: MessageSquare, count: "pendingReviews" },
  { href: "/admin/sayfalar", label: "Sayfalar", icon: FileText },
  { href: "/admin/musteriler", label: "Müşteriler", icon: Users },
  { href: "/admin/aboneler", label: "Bülten Aboneleri", icon: Mail },
  { href: "/admin/odeme", label: "Ödeme Yöntemleri", icon: CreditCard },
  { href: "/admin/ayarlar", label: "Ayarlar", icon: Settings },
] as const;

export function AdminSidebar({
  storeName,
  userName,
  counts,
}: {
  storeName: string;
  userName: string;
  counts: Counts;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const nav = (
    <nav className="flex flex-1 flex-col gap-0.5 px-3 py-4">
      {NAV.map((item) => {
        const active = "exact" in item ? pathname === item.href : pathname.startsWith(item.href);
        const count = "count" in item ? counts[item.count] : 0;
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition",
              active ? "bg-white/10 font-medium text-white" : "text-zinc-400 hover:bg-white/5 hover:text-white",
            )}
          >
            <Icon className="size-4" />
            <span className="flex-1">{item.label}</span>
            {count > 0 && (
              <span className="rounded-full bg-white px-1.5 text-[11px] font-semibold text-zinc-900">{count}</span>
            )}
          </Link>
        );
      })}
    </nav>
  );

  const footer = (
    <div className="border-t border-white/10 p-3">
      <Link
        href="/"
        target="_blank"
        className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-zinc-400 hover:bg-white/5 hover:text-white"
      >
        <ExternalLink className="size-4" /> Mağazayı Görüntüle
      </Link>
      <form action={adminLogout}>
        <button
          type="submit"
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-zinc-400 hover:bg-white/5 hover:text-white"
        >
          <LogOut className="size-4" /> Çıkış Yap
        </button>
      </form>
      <p className="px-3 pt-2 text-xs text-zinc-500">{userName}</p>
    </div>
  );

  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-zinc-800 bg-zinc-950 px-4 text-white lg:hidden">
        <button type="button" onClick={() => setOpen(true)} aria-label="Menüyü aç">
          <Menu className="size-5" />
        </button>
        <span className="text-sm font-semibold">{storeName} · Yönetim</span>
        <span className="w-5" />
      </header>

      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col bg-zinc-950 lg:flex">
        <div className="flex h-16 items-center border-b border-white/10 px-6">
          <Link href="/admin" className="text-[15px] font-semibold text-white">
            {storeName}
            <span className="block text-[11px] font-normal text-zinc-500">Yönetim Paneli</span>
          </Link>
        </div>
        {nav}
        {footer}
      </aside>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-64 flex-col bg-zinc-950">
            <div className="flex h-14 items-center justify-between border-b border-white/10 px-5 text-white">
              <span className="text-sm font-semibold">{storeName}</span>
              <button type="button" onClick={() => setOpen(false)} aria-label="Kapat">
                <X className="size-5" />
              </button>
            </div>
            {nav}
            {footer}
          </aside>
        </div>
      )}
    </>
  );
}
