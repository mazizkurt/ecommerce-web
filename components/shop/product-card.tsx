import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { formatPrice } from "@/lib/format";
import { cartPrice, discountRate } from "@/lib/pricing";
import type { ProductCardData } from "@/lib/queries";
import { AddToCartCardButton, FavoriteButton } from "./product-card-actions";

const CARD_SIZES =
  "(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, 50vw";

export function ProductCard({
  product,
  cartDiscountPercent,
  titleStyle = "upper",
  sizes = CARD_SIZES,
}: {
  product: ProductCardData;
  cartDiscountPercent: number;
  titleStyle?: "upper" | "normal";
  sizes?: string;
}) {
  const href = `/urun/${product.slug}`;
  const rate = discountRate(product.comparePrice, product.price);
  const basket = cartPrice(product.price, cartDiscountPercent);
  const hasBasketPrice = basket < product.price;
  const inStock = product.variants.some((v) => v.stock > 0);
  const [image, hoverImage] = product.images;

  return (
    <div className="group/card relative flex h-full flex-col overflow-hidden rounded-[5px] border border-card bg-white">
      <div className="relative aspect-[2/3] overflow-hidden bg-soft">
        <Link href={href} className="block h-full" tabIndex={-1}>
          {image && (
            <Image
              src={image}
              alt={product.name}
              fill
              sizes={sizes}
              className="object-cover"
            />
          )}
          {hoverImage && (
            <Image
              src={hoverImage}
              alt=""
              fill
              sizes={sizes}
              className="object-cover opacity-0 transition-opacity duration-500 group-hover/card:opacity-100"
            />
          )}
        </Link>
        {rate > 0 && (
          <span className="absolute left-0 top-0 z-10 flex size-10 items-center justify-center bg-black text-xs font-medium text-white">
            %{rate}
          </span>
        )}
        <FavoriteButton
          product={product}
          className="absolute right-2.5 top-2.5 z-10"
        />
        {!inStock && (
          <span className="absolute inset-x-0 bottom-[10%] z-10 flex h-[50px] items-center justify-center border-y border-black bg-white/90 text-lg">
            Tükendi
          </span>
        )}
      </div>

      <Link href={href} className="flex flex-1 flex-col">
        <div className="mt-2.5">
          <h3
            className={cn(
              "mx-[7px] line-clamp-2 text-black",
              titleStyle === "upper"
                ? "text-[13px] uppercase leading-[15px]"
                : "text-sm leading-[18px]",
            )}
          >
            {product.name}
          </h3>
          <div className="mx-[7px] flex min-h-10 flex-wrap items-center">
            {rate > 0 && (
              <span className="mr-2.5 text-[13px] text-[#aaa] line-through sm:text-[15px]">
                {formatPrice(product.comparePrice!)}
              </span>
            )}
            <span
              className={cn(
                "text-[15px] font-semibold sm:text-base",
                hasBasketPrice && "line-through",
              )}
            >
              {formatPrice(product.price)}
            </span>
          </div>
        </div>
        {hasBasketPrice && (
          <div className="mt-auto flex flex-col items-center border-y border-line py-[5px] text-[13px] leading-5">
            Sepetteki Fiyat
            <span className="text-[15px] font-medium">{formatPrice(basket)}</span>
          </div>
        )}
      </Link>

      <div className="flex justify-center py-2.5">
        <AddToCartCardButton product={product} disabled={!inStock} />
      </div>
    </div>
  );
}
