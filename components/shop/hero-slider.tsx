"use client";

import { Children, useEffect, useState } from "react";
import { cn } from "@/lib/cn";

export function HeroSlider({
  children,
  intervalSeconds = 6,
}: {
  children: React.ReactNode;
  intervalSeconds?: number;
}) {
  const slides = Children.toArray(children);
  const [index, setIndex] = useState(0);
  const ms = Math.max(2, intervalSeconds) * 1000;

  useEffect(() => {
    if (slides.length < 2) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % slides.length), ms);
    return () => clearInterval(id);
  }, [slides.length, index, ms]);

  return (
    <section
      aria-roledescription="carousel"
      className="relative aspect-[4/5] w-full overflow-hidden bg-soft md:aspect-[1920/896]"
    >
      {slides.map((slide, i) => (
        <div
          key={i}
          aria-hidden={i !== index}
          className={cn(
            "absolute inset-0 transition-opacity duration-1000",
            i === index ? "z-10 opacity-100" : "pointer-events-none opacity-0",
          )}
        >
          {slide}
        </div>
      ))}
      {slides.length > 1 && (
        <div className="absolute inset-x-0 bottom-4 z-20 flex justify-center gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`${i + 1}. slayt`}
              className={cn(
                "h-1 rounded-full bg-white transition-all",
                i === index ? "w-8" : "w-4 opacity-60",
              )}
            />
          ))}
        </div>
      )}
    </section>
  );
}
