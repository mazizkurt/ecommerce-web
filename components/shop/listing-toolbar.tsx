"use client";

import { AlignLeft, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { SORT_OPTIONS } from "@/lib/constants";
import type { ListingParams } from "@/lib/listing";
import { useLockBodyScroll } from "./cart-ui";

type Props = {
  current: ListingParams;
  /** Toolbar'ın korumak zorunda olduğu ek parametreler (ör. arama kelimesi). */
  baseParams?: Record<string, string>;
  sizes: string[];
  subcategories?: { name: string; slug: string }[];
  total: number;
};

export function ListingToolbar({
  current,
  baseParams = {},
  sizes,
  subcategories = [],
  total,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [selectedSizes, setSelectedSizes] = useState(current.sizes);
  const [min, setMin] = useState(current.min?.toString() ?? "");
  const [max, setMax] = useState(current.max?.toString() ?? "");
  useLockBodyScroll(open);

  const navigate = (patch: Partial<Record<string, string>>) => {
    const params = new URLSearchParams(baseParams);
    const merged: Record<string, string | undefined> = {
      sirala: current.sort === "newest" ? undefined : current.sort,
      beden: current.sizes.join(",") || undefined,
      min: current.min?.toString(),
      max: current.max?.toString(),
      ...patch,
    };
    for (const [k, v] of Object.entries(merged)) if (v) params.set(k, v);
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  };

  const applyFilters = () => {
    setOpen(false);
    navigate({
      beden: selectedSizes.join(",") || undefined,
      min: min || undefined,
      max: max || undefined,
    });
  };

  const activeCount =
    current.sizes.length + (current.min != null ? 1 : 0) + (current.max != null ? 1 : 0);

  return (
    <>
      <div className="mx-2.5 mb-[5px] flex items-center justify-between rounded-[3px] bg-[#f0f0f0] px-4 py-2.5 md:px-5">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 text-[13px] font-medium uppercase"
        >
          <AlignLeft className="size-4" />
          Filtreler
          {activeCount > 0 && (
            <span className="flex size-5 items-center justify-center rounded-full bg-black text-[11px] text-white">
              {activeCount}
            </span>
          )}
        </button>
        <div className="flex items-center gap-4">
          <span className="hidden text-[13px] text-zinc-500 sm:inline">{total} ürün</span>
          <select
            aria-label="Sıralama"
            value={current.sort}
            onChange={(e) =>
              navigate({ sirala: e.target.value === "newest" ? undefined : e.target.value })
            }
            className="h-9 min-w-[150px] border border-[#e2e2e2] bg-white px-3 text-[13px] outline-none md:min-w-[170px]"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className={cn("fixed inset-0 z-[60]", !open && "pointer-events-none")}>
        <div
          className={cn(
            "absolute inset-0 bg-black/50 transition-opacity",
            open ? "opacity-100" : "opacity-0",
          )}
          onClick={() => setOpen(false)}
        />
        <aside
          aria-label="Filtreler"
          className={cn(
            "absolute inset-y-0 left-0 flex w-[85%] max-w-sm flex-col bg-white transition-transform duration-300",
            open ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="flex h-16 items-center justify-between border-b border-line px-5">
            <span className="font-medium">FİLTRELER</span>
            <button type="button" onClick={() => setOpen(false)} aria-label="Kapat">
              <X className="size-6" strokeWidth={1.5} />
            </button>
          </div>
          <div className="flex-1 space-y-7 overflow-y-auto p-5">
            {subcategories.length > 0 && (
              <div>
                <h3 className="mb-3 text-sm font-medium">Kategoriler</h3>
                <ul className="space-y-2 text-sm">
                  {subcategories.map((c) => (
                    <li key={c.slug}>
                      <Link
                        href={`/kategori/${c.slug}`}
                        onClick={() => setOpen(false)}
                        className="hover:underline"
                      >
                        {c.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {sizes.length > 0 && (
              <div>
                <h3 className="mb-3 text-sm font-medium">Beden</h3>
                <div className="flex flex-wrap gap-2">
                  {sizes.map((s) => {
                    const active = selectedSizes.includes(s);
                    return (
                      <button
                        key={s}
                        type="button"
                        aria-pressed={active}
                        onClick={() =>
                          setSelectedSizes((prev) =>
                            active ? prev.filter((x) => x !== s) : [...prev, s],
                          )
                        }
                        className={cn(
                          "min-w-10 border px-2.5 py-1.5 text-sm",
                          active ? "border-black bg-black text-white" : "border-zinc-300",
                        )}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            <div>
              <h3 className="mb-3 text-sm font-medium">Fiyat Aralığı (TL)</h3>
              <div className="flex items-center gap-2">
                <input
                  inputMode="decimal"
                  value={min}
                  onChange={(e) => setMin(e.target.value.replace(/[^\d.]/g, ""))}
                  placeholder="En az"
                  className="h-10 w-full border border-zinc-300 px-3 text-sm outline-none focus:border-black"
                />
                <span>-</span>
                <input
                  inputMode="decimal"
                  value={max}
                  onChange={(e) => setMax(e.target.value.replace(/[^\d.]/g, ""))}
                  placeholder="En çok"
                  className="h-10 w-full border border-zinc-300 px-3 text-sm outline-none focus:border-black"
                />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 border-t border-line p-4">
            <button
              type="button"
              onClick={() => {
                setSelectedSizes([]);
                setMin("");
                setMax("");
                setOpen(false);
                navigate({ beden: undefined, min: undefined, max: undefined });
              }}
              className="h-11 border border-black text-sm font-medium"
            >
              TEMİZLE
            </button>
            <button
              type="button"
              onClick={applyFilters}
              className="h-11 bg-black text-sm font-medium text-white"
            >
              UYGULA
            </button>
          </div>
        </aside>
      </div>
    </>
  );
}
