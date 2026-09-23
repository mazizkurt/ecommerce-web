"use client";

import { ChevronLeft, ChevronRight, Share2, Star, Truck, X, ZoomIn } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { WhatsAppIcon } from "@/components/icons";
import { cn } from "@/lib/cn";
import { formatPrice } from "@/lib/format";
import { cartPrice, discountRate } from "@/lib/pricing";
import type { ProductCardData } from "@/lib/queries";
import { useCartUI, useLockBodyScroll } from "./cart-ui";
import { FavoriteButton } from "./product-card-actions";

export function ProductGallery({ images, name }: { images: string[]; name: string }) {
  const [index, setIndex] = useState(0);
  const [zoom, setZoom] = useState<number | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const count = images.length;

  const go = (i: number) => {
    const next = (i + count) % count;
    setIndex(next);
    const el = scroller.current;
    if (el) el.scrollTo({ left: next * el.clientWidth, behavior: "smooth" });
  };

  if (count === 0) return <div className="aspect-[2/3] bg-soft" />;

  return (
    <div className="flex gap-2">
      <div className="hidden w-[135px] shrink-0 flex-col gap-1.5 md:flex">
        {images.map((src, i) => (
          <button
            key={src}
            type="button"
            onClick={() => go(i)}
            aria-label={`${i + 1}. görsel`}
            className={cn(
              "relative aspect-[2/3] overflow-hidden border p-0.5",
              i === index ? "border-black" : "border-line",
            )}
          >
            <span className="relative block size-full">
              <Image src={src} alt="" fill sizes="135px" className="object-cover" />
            </span>
          </button>
        ))}
      </div>
      <div className="relative min-w-0 flex-1">
        <div
          ref={scroller}
          onScroll={(e) => {
            const el = e.currentTarget;
            const i = Math.round(el.scrollLeft / el.clientWidth);
            if (i !== index) setIndex(i);
          }}
          className="scrollbar-none flex snap-x snap-mandatory overflow-x-auto"
        >
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => setZoom(i)}
              aria-label="Görseli büyüt"
              className="relative aspect-[2/3] w-full shrink-0 cursor-zoom-in snap-center bg-soft"
            >
              <Image
                src={src}
                alt={i === 0 ? name : ""}
                fill
                priority={i === 0}
                sizes="(min-width: 1024px) 55vw, 100vw"
                className="object-cover"
              />
            </button>
          ))}
        </div>
        {count > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(index - 1)}
              aria-label="Önceki görsel"
              className="absolute left-3 top-1/2 hidden -translate-y-1/2 p-2 text-zinc-700 md:block"
            >
              <ChevronLeft className="size-8" strokeWidth={1.2} />
            </button>
            <button
              type="button"
              onClick={() => go(index + 1)}
              aria-label="Sonraki görsel"
              className="absolute right-3 top-1/2 hidden -translate-y-1/2 p-2 text-zinc-700 md:block"
            >
              <ChevronRight className="size-8" strokeWidth={1.2} />
            </button>
            <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5 md:hidden">
              {images.map((_, i) => (
                <span key={i} className={cn("size-1.5 rounded-full", i === index ? "bg-black" : "bg-black/25")} />
              ))}
            </div>
          </>
        )}
        <button
          type="button"
          onClick={() => setZoom(index)}
          aria-label="Görseli büyüt"
          className="absolute bottom-3 right-3 flex size-9 items-center justify-center rounded-full bg-white/90 text-black shadow-[0_1px_6px_rgba(0,0,0,0.15)] transition-colors hover:bg-white"
        >
          <ZoomIn className="size-4" strokeWidth={1.6} />
        </button>
      </div>

      {zoom !== null && (
        <Lightbox images={images} start={zoom} name={name} onClose={() => setZoom(null)} />
      )}
    </div>
  );
}

/** Görselin tamamını (kırpmadan) tam ekran gösterir. */
function Lightbox({
  images,
  start,
  name,
  onClose,
}: {
  images: string[];
  start: number;
  name: string;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(start);
  const scroller = useRef<HTMLDivElement>(null);
  const count = images.length;
  useLockBodyScroll(true);

  const step = (dir: 1 | -1) => {
    const next = (index + dir + count) % count;
    setIndex(next);
    const el = scroller.current;
    if (el) el.scrollTo({ left: next * el.clientWidth, behavior: "smooth" });
  };

  // Açılışta tıklanan görsele konumlan.
  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTo({ left: start * el.clientWidth });
  }, [start]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${name} görselleri`}
      className="fixed inset-0 z-[70] animate-fade-in bg-black/95"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Kapat"
        className="absolute right-3 top-3 z-20 p-2 text-white/80 transition-colors hover:text-white"
      >
        <X className="size-7" strokeWidth={1.3} />
      </button>

      <div
        ref={scroller}
        onScroll={(e) => {
          const el = e.currentTarget;
          const i = Math.round(el.scrollLeft / el.clientWidth);
          if (i !== index) setIndex(i);
        }}
        className="scrollbar-none flex h-full snap-x snap-mandatory overflow-x-auto overscroll-contain"
      >
        {images.map((src, i) => (
          // Görselin dışına (ya da üstüne) tıklayınca kapanır.
          <div key={src} onClick={onClose} className="relative h-full w-full shrink-0 snap-center">
            <Image
              src={src}
              alt={`${name} — ${i + 1}. görsel`}
              fill
              sizes="100vw"
              quality={90}
              priority={i === start}
              className="object-contain p-3 md:p-10"
            />
          </div>
        ))}
      </div>

      {count > 1 && (
        <>
          <button
            type="button"
            onClick={() => step(-1)}
            aria-label="Önceki görsel"
            className="absolute left-2 top-1/2 z-20 hidden -translate-y-1/2 p-3 text-white/70 transition-colors hover:text-white md:block"
          >
            <ChevronLeft className="size-9" strokeWidth={1.2} />
          </button>
          <button
            type="button"
            onClick={() => step(1)}
            aria-label="Sonraki görsel"
            className="absolute right-2 top-1/2 z-20 hidden -translate-y-1/2 p-3 text-white/70 transition-colors hover:text-white md:block"
          >
            <ChevronRight className="size-9" strokeWidth={1.2} />
          </button>
          <span className="absolute inset-x-0 bottom-5 z-10 text-center text-[13px] text-white/70">
            {index + 1} / {count}
          </span>
        </>
      )}
    </div>
  );
}

export function Stars({ rating, className }: { rating: number; className?: string }) {
  return (
    <span className={cn("flex gap-0.5", className)} aria-label={`5 üzerinden ${rating.toFixed(1)}`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} className="size-4" fill={i < Math.round(rating) ? "currentColor" : "none"} strokeWidth={1.5} />
      ))}
    </span>
  );
}

export type ColorOption = {
  slug: string;
  colorName: string;
  colorHex: string;
  image: string | null;
  current: boolean;
};

export function BuyBox({
  product,
  code,
  rating,
  reviewCount,
  whatsapp,
  whatsappMessage,
  siteUrl,
  colorName,
  colors,
}: {
  product: ProductCardData;
  code: string;
  rating: number;
  reviewCount: number;
  whatsapp: string;
  whatsappMessage: string;
  siteUrl: string;
  colorName: string;
  colors: ColorOption[];
}) {
  const router = useRouter();
  const { pricing, cartPriceLabel, addVariant } = useCartUI();
  const single = product.variants.length === 1 ? product.variants[0] : null;
  const [selected, setSelected] = useState<number | null>(single && single.stock > 0 ? single.id : null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const rate = discountRate(product.comparePrice, product.price);
  const basket = cartPrice(product.price, pricing.cartDiscountPercent);
  const variant = product.variants.find((v) => v.id === selected);
  const inStock = product.variants.some((v) => v.stock > 0);

  const add = (thenCheckout: boolean) => {
    if (!variant) {
      setError("Lütfen beden seçiniz.");
      return;
    }
    addVariant(product, variant.id);
    if (thenCheckout) router.push("/odeme");
  };

  const productUrl = `${siteUrl}/urun/${product.slug}`;
  const waText = encodeURIComponent(
    whatsappMessage
      .replaceAll("{urun}", product.name)
      .replaceAll("{beden}", variant ? `- Beden: ${variant.size}` : "")
      .replaceAll("{kod}", code)
      .replaceAll("{link}", productUrl)
      .trim(),
  );

  const share = async () => {
    try {
      if (navigator.share) await navigator.share({ title: product.name, url: productUrl });
      else {
        await navigator.clipboard.writeText(productUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // kullanıcı paylaşımı iptal etti
    }
  };

  return (
    <div className="lg:pr-2.5">
      <div className="flex items-start gap-4">
        <h1 className="flex-1 text-lg font-medium leading-snug tracking-[0.06em]">{product.name}</h1>
        <div className="flex items-center gap-3 pt-1">
          <FavoriteButton product={product} />
          <button type="button" onClick={share} aria-label="Paylaş" className="relative">
            <Share2 className="size-5" strokeWidth={1.6} />
            {copied && (
              <span className="absolute right-0 top-7 whitespace-nowrap bg-black px-2 py-1 text-[11px] text-white">
                Link kopyalandı
              </span>
            )}
          </button>
        </div>
      </div>

      <a href="#yorumlar" className="mt-2 flex items-center gap-2 text-xs text-zinc-500">
        <Stars rating={reviewCount ? rating : 5} className="text-black" />
        {reviewCount > 0 && <span>({reviewCount} yorum)</span>}
      </a>

      {code && <p className="mt-6 text-[13px] tracking-wider text-[#999]">Ürün Kodu: {code}</p>}

      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1">
        {rate > 0 && (
          <span className="text-[15px] text-[#a3a3a3] line-through">{formatPrice(product.comparePrice!)}</span>
        )}
        <span className={cn("text-2xl font-medium", basket < product.price && "line-through")}>
          {formatPrice(product.price)}
        </span>
        {rate > 0 && (
          <span className="flex h-7 items-center bg-brand px-3 text-sm font-medium text-brand-text">
            %{rate} İndirim
          </span>
        )}
      </div>
      {basket < product.price && (
        <div className="mt-3 inline-flex items-center gap-2 border border-line px-3 py-2.5 text-accent">
          <span className="text-sm font-medium">{cartPriceLabel}</span>
          <span className="text-xl font-medium">{formatPrice(basket)}</span>
        </div>
      )}

      {colors.length > 1 && (
        <div className="mt-6">
          <p className="text-base font-medium">
            Renk: <span className="font-normal">{colorName}</span>
          </p>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {colors.map((c) => (
              <Link
                key={c.slug}
                href={`/urun/${c.slug}`}
                title={c.colorName}
                aria-current={c.current ? "true" : undefined}
                className={cn(
                  "relative block size-9 overflow-hidden rounded-full border-2 p-0.5",
                  c.current ? "border-black" : "border-transparent hover:border-zinc-300",
                )}
              >
                {c.colorHex ? (
                  <span className="block size-full rounded-full border border-black/10" style={{ background: c.colorHex }} />
                ) : c.image ? (
                  <span className="relative block size-full overflow-hidden rounded-full">
                    <Image src={c.image} alt={c.colorName} fill sizes="36px" className="object-cover" />
                  </span>
                ) : (
                  <span className="flex size-full items-center justify-center rounded-full bg-soft text-[9px]">
                    {c.colorName.slice(0, 3)}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6">
        <p className="text-base font-medium">Beden:</p>
        <div className="mt-2.5 flex flex-wrap gap-2">
          {product.variants.map((v) => (
            <button
              key={v.id}
              type="button"
              disabled={v.stock <= 0}
              onClick={() => {
                setSelected(v.id);
                setError(null);
              }}
              aria-pressed={selected === v.id}
              title={v.stock <= 0 ? "Tükendi" : undefined}
              className={cn(
                "flex h-[30px] min-w-[30px] items-center justify-center border px-2 text-sm transition-colors",
                selected === v.id ? "border-brand bg-brand text-brand-text" : "border-[#ccc] hover:border-black",
                v.stock <= 0 && "cursor-not-allowed text-zinc-300 line-through hover:border-[#ccc]",
              )}
            >
              {v.size}
            </button>
          ))}
        </div>
        {variant && variant.stock <= 3 && <p className="mt-2 text-[13px] text-red-600">Son {variant.stock} ürün!</p>}
        {error && <p className="mt-2 text-[13px] text-red-600">{error}</p>}
      </div>

      <div className="mt-4 space-y-2.5">
        <button
          type="button"
          disabled={!inStock}
          onClick={() => add(false)}
          className="h-[45px] w-full border border-brand bg-brand text-base font-medium text-brand-text transition-colors hover:bg-white hover:text-brand disabled:border-zinc-300 disabled:bg-zinc-300 disabled:text-white"
        >
          {inStock ? "SEPETE EKLE" : "TÜKENDİ"}
        </button>
        {inStock && (
          <button
            type="button"
            onClick={() => add(true)}
            className="h-[45px] w-full border border-brand bg-[#f4f4f5] text-base font-medium transition-colors hover:bg-[#e8e8e8]"
          >
            HEMEN AL
          </button>
        )}
        {whatsapp && (
          <a
            href={`https://wa.me/${whatsapp}?text=${waText}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 flex h-[45px] w-full items-center justify-center gap-2 bg-[#2ea836] text-sm font-medium text-white transition-colors hover:bg-[#25902c]"
          >
            <WhatsAppIcon className="size-4" />
            WHATSAPP İLE SİPARİŞ VER
          </a>
        )}
      </div>

      {pricing.freeShippingThreshold > 0 && (
        <p className="mt-4 flex items-center gap-2 text-[13px] text-zinc-600">
          <Truck className="size-4" strokeWidth={1.5} />
          {formatPrice(pricing.freeShippingThreshold)} ve üzeri siparişlerde kargo ücretsiz.
        </p>
      )}
    </div>
  );
}
