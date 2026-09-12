import { Star } from "lucide-react";
import Link from "next/link";
import { maskName } from "@/lib/format";
import type { ProductCardData } from "@/lib/queries";
import { Carousel } from "./carousel";
import { ProductCard } from "./product-card";

export function SectionHeader({ title, href }: { title: string; href?: string }) {
  return (
    <div className="flex items-center justify-between px-2.5 pb-3 pt-8 md:pt-10">
      <h2 className="text-xl text-[#222] md:text-2xl">{title}</h2>
      {href && (
        <Link href={href} className="text-[13px] font-medium hover:underline">
          Tümünü Gör
        </Link>
      )}
    </div>
  );
}

export function ProductGrid({
  items,
  cartDiscountPercent,
  titleStyle = "upper",
  columns = "default",
}: {
  items: ProductCardData[];
  cartDiscountPercent: number;
  titleStyle?: "upper" | "normal";
  columns?: "default" | "five";
}) {
  if (items.length === 0) {
    return (
      <p className="px-4 py-20 text-center text-sm text-zinc-500">
        Bu kriterlere uygun ürün bulunamadı.
      </p>
    );
  }
  return (
    <div
      className={
        columns === "five"
          ? "grid grid-cols-2 gap-[5px] px-[3px] md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
          : "grid grid-cols-2 gap-[5px] px-[3px] lg:grid-cols-3 xl:grid-cols-4"
      }
    >
      {items.map((p) => (
        <ProductCard
          key={p.id}
          product={p}
          cartDiscountPercent={cartDiscountPercent}
          titleStyle={titleStyle}
          sizes={
            columns === "five"
              ? "(min-width: 1280px) 20vw, (min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
              : undefined
          }
        />
      ))}
    </div>
  );
}

export function ProductCarousel({
  items,
  cartDiscountPercent,
}: {
  items: ProductCardData[];
  cartDiscountPercent: number;
}) {
  return (
    <Carousel
      label="Ürünler"
      itemClassName="w-[calc((100%-5px)/2)] lg:w-[calc((100%-10px)/3)] xl:w-[calc((100%-15px)/4)]"
    >
      {items.map((p) => (
        <ProductCard key={p.id} product={p} cartDiscountPercent={cartDiscountPercent} />
      ))}
    </Carousel>
  );
}

type HomeReview = {
  id: number;
  name: string;
  rating: number;
  comment: string;
  productSlug: string | null;
};

export function ReviewsCarousel({ reviews }: { reviews: HomeReview[] }) {
  return (
    <section className="py-10">
      <Carousel label="Müşteri yorumları" itemClassName="w-full md:w-1/2 lg:w-1/4">
        {reviews.map((r) => {
          const body = (
            <>
              <div className="flex gap-0.5 text-star" aria-label={`${r.rating} yıldız`}>
                {Array.from({ length: 5 }, (_, i) => (
                  <Star
                    key={i}
                    className="size-4"
                    fill={i < r.rating ? "currentColor" : "none"}
                    strokeWidth={i < r.rating ? 0 : 1.5}
                  />
                ))}
              </div>
              <p className="mt-4 line-clamp-4 h-[100px] text-base">{r.comment}</p>
              <p className="mt-3 text-sm">{maskName(r.name)}</p>
            </>
          );
          const cls = "flex flex-col items-center px-4 py-4 text-center";
          return r.productSlug ? (
            <Link key={r.id} href={`/urun/${r.productSlug}`} className={cls}>
              {body}
            </Link>
          ) : (
            <div key={r.id} className={cls}>
              {body}
            </div>
          );
        })}
      </Carousel>
    </section>
  );
}

export function Breadcrumb({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Konum" className="px-[22px] py-4 text-[13px]">
      <ol className="flex flex-wrap items-center gap-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-2">
            {i > 0 && <span className="text-zinc-400">&gt;</span>}
            {item.href ? (
              <Link href={item.href} className="text-zinc-600 hover:text-black">
                {item.label}
              </Link>
            ) : (
              <span className="text-black">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function Pagination({
  page,
  pageCount,
  hrefFor,
}: {
  page: number;
  pageCount: number;
  hrefFor: (page: number) => string;
}) {
  if (pageCount <= 1) return null;
  const pages = Array.from({ length: pageCount }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === pageCount || Math.abs(p - page) <= 2,
  );
  return (
    <nav aria-label="Sayfalar" className="flex justify-center gap-1.5 py-10">
      {pages.map((p, i) => (
        <span key={p} className="flex items-center gap-1.5">
          {i > 0 && pages[i - 1] !== p - 1 && <span className="px-1">…</span>}
          <Link
            href={hrefFor(p)}
            aria-current={p === page ? "page" : undefined}
            className={
              p === page
                ? "flex size-10 items-center justify-center bg-brand text-sm text-brand-text"
                : "flex size-10 items-center justify-center border border-line text-sm hover:border-black"
            }
          >
            {p}
          </Link>
        </span>
      ))}
    </nav>
  );
}
