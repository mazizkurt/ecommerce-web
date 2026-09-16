"use client";

import { X } from "lucide-react";
import { useEffect } from "react";
import { cn } from "@/lib/cn";
import { useLockBodyScroll } from "./cart-ui";

/** Mobilde alttan, masaüstünde sağdan açılan panel (sayfadan ayrılmadan içerik göstermek için). */
export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  useLockBodyScroll(open);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <div className={cn("fixed inset-0 z-[70]", !open && "pointer-events-none")} aria-hidden={!open}>
      <div
        className={cn(
          "absolute inset-0 bg-black/50 transition-opacity duration-300",
          open ? "opacity-100" : "opacity-0",
        )}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal={open}
        aria-label={title}
        className={cn(
          "absolute inset-x-0 bottom-0 flex max-h-[85vh] flex-col bg-white shadow-xl transition-transform duration-300 sm:inset-y-0 sm:left-auto sm:right-0 sm:max-h-none sm:w-[min(560px,100%)]",
          open ? "translate-y-0 sm:translate-x-0" : "translate-y-full sm:translate-y-0 sm:translate-x-full",
        )}
      >
        <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-4">
          <h2 className="text-base font-medium">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Kapat" className="p-1">
            <X className="size-5" strokeWidth={1.5} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>
      </div>
    </div>
  );
}
