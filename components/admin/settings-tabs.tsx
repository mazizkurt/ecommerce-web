"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const TABS = [
  { href: "/admin/ayarlar", label: "Genel" },
  { href: "/admin/ayarlar/gorunum", label: "Görünüm" },
  { href: "/admin/ayarlar/anasayfa", label: "Anasayfa" },
  { href: "/admin/ayarlar/metinler", label: "Metinler" },
  { href: "/admin/ayarlar/kargo", label: "Fiyat & Kargo" },
  { href: "/admin/ayarlar/e-posta", label: "E-posta" },
  { href: "/admin/ayarlar/seo", label: "SEO & Analitik" },
  { href: "/admin/ayarlar/yoneticiler", label: "Yöneticiler" },
];

export function SettingsTabs() {
  const pathname = usePathname();
  return (
    <nav aria-label="Ayar bölümleri" className="scrollbar-none -mx-4 mb-6 flex gap-1 overflow-x-auto border-b border-zinc-200 px-4 lg:mx-0 lg:px-0">
      {TABS.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "-mb-px whitespace-nowrap border-b-2 px-3 py-2.5 text-sm transition",
              active ? "border-zinc-900 font-medium text-zinc-900" : "border-transparent text-zinc-500 hover:text-zinc-900",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
