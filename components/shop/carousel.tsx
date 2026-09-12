"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Children, useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

export function Carousel({
  children,
  itemClassName,
  label,
}: {
  children: React.ReactNode;
  itemClassName: string;
  label: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [update]);

  const scroll = (dir: 1 | -1) => {
    const el = ref.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.9, behavior: "smooth" });
  };

  const arrow =
    "absolute top-1/2 z-10 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-[0_0_8px_rgba(0,0,0,0.25)] transition-opacity";

  return (
    <div className="relative" role="region" aria-label={label}>
      <div
        ref={ref}
        className="scrollbar-none flex snap-x snap-mandatory gap-[5px] overflow-x-auto px-[3px]"
      >
        {Children.map(children, (child) => (
          <div className={cn("shrink-0 snap-start", itemClassName)}>{child}</div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => scroll(-1)}
        aria-label="Önceki"
        className={cn(arrow, "left-2", !canPrev && "pointer-events-none opacity-0")}
      >
        <ChevronLeft className="size-5" />
      </button>
      <button
        type="button"
        onClick={() => scroll(1)}
        aria-label="Sonraki"
        className={cn(arrow, "right-2", !canNext && "pointer-events-none opacity-0")}
      >
        <ChevronRight className="size-5" />
      </button>
    </div>
  );
}
