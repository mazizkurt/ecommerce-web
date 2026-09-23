import { ArrowRight } from "lucide-react";
import Image, { getImageProps } from "next/image";
import Link from "next/link";
import { cn } from "@/lib/cn";
import type { banners } from "@/lib/db/schema";
import { HeroVideo } from "./hero-video";

type Banner = typeof banners.$inferSelect;

function BannerLink({ href, className, children }: { href: string; className?: string; children: React.ReactNode }) {
  if (!href) return <div className={className}>{children}</div>;
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

/** Masaüstü ve mobil için ayrı görsel destekleyen <picture>. */
function ResponsivePicture({
  desktop,
  mobile,
  alt,
  priority,
}: {
  desktop: string;
  mobile?: string;
  alt: string;
  priority?: boolean;
}) {
  const common = { alt, sizes: "100vw", priority };
  const {
    props: { srcSet: desktopSet, ...rest },
  } = getImageProps({ ...common, src: desktop, width: 1920, height: 896 });
  const mobileSet = mobile
    ? getImageProps({ ...common, src: mobile, width: 900, height: 1100 }).props.srcSet
    : undefined;
  return (
    <picture>
      {mobileSet && <source media="(max-width: 767px)" srcSet={mobileSet} />}
      <source media="(min-width: 768px)" srcSet={desktopSet} />
      <img {...rest} alt={alt} className="absolute inset-0 size-full object-cover" />
    </picture>
  );
}

const hasText = (b: Banner) => b.style !== "plain" && (b.title || b.subtitle || b.buttonText);

export function HeroSlide({ banner, priority }: { banner: Banner; priority?: boolean }) {
  const light = banner.style === "light";
  return (
    <BannerLink href={banner.link} className="absolute inset-0 block">
      {banner.videoUrl ? (
        <HeroVideo
          src={banner.videoUrl}
          poster={banner.imageUrl || undefined}
          className="absolute inset-0 size-full object-cover"
        />
      ) : (
        banner.imageUrl && (
          <ResponsivePicture
            desktop={banner.imageUrl}
            mobile={banner.mobileImageUrl || undefined}
            alt={banner.title}
            priority={priority}
          />
        )
      )}
      {hasText(banner) && (
        <div
          className={cn(
            "absolute inset-0 flex flex-col items-center justify-center px-6 text-center",
            light ? "bg-white/40 text-black" : "bg-black/15 text-white",
          )}
        >
          {banner.title && (
            <h2 className="font-display text-5xl font-extralight tracking-[0.06em] drop-shadow-sm md:text-8xl">
              {banner.title}
            </h2>
          )}
          {banner.subtitle && (
            <p className="mt-2 font-display text-sm font-light tracking-[0.3em] md:text-2xl">{banner.subtitle}</p>
          )}
          {banner.buttonText && (
            <span
              className={cn(
                "mt-6 inline-flex items-center gap-1 border px-4 py-2 text-xs font-medium md:text-sm",
                light ? "border-black" : "border-white/80",
              )}
            >
              {banner.buttonText} <ArrowRight className="size-4" />
            </span>
          )}
        </div>
      )}
    </BannerLink>
  );
}

export function WideBanner({ banner, logoText }: { banner: Banner; logoText: string }) {
  const dark = banner.style === "dark";
  return (
    <BannerLink
      href={banner.link}
      className="relative mx-[3px] mt-[5px] block aspect-[1920/896] overflow-hidden bg-soft"
    >
      {banner.imageUrl && (
        <Image src={banner.imageUrl} alt={banner.title} fill sizes="100vw" className="object-cover" />
      )}
      {hasText(banner) && (
        <>
          <div
            className={cn(
              "absolute inset-0",
              dark ? "bg-black/40" : "bg-gradient-to-r from-white/95 via-white/80 to-white/70",
            )}
          />
          <div
            className={cn(
              "absolute inset-2.5 rounded-[18px] border md:inset-7 md:rounded-[44px]",
              dark ? "border-white/60" : "border-badge/60",
            )}
          />
          <div
            className={cn(
              "absolute inset-0 flex flex-col items-center justify-center px-6 text-center",
              dark ? "text-white" : "text-badge",
            )}
          >
            <span className={cn("font-logo text-[10px] tracking-[0.35em] md:text-lg", !dark && "text-black")}>
              {logoText}
            </span>
            {banner.title && (
              <h2 className="font-display text-3xl font-light tracking-wide md:text-8xl">{banner.title}</h2>
            )}
            {banner.subtitle && <p className="text-[10px] md:mt-1 md:text-xl">{banner.subtitle}</p>}
            {banner.buttonText && (
              <span
                className={cn(
                  "mt-2 inline-flex items-center gap-1 rounded px-2 py-1 text-[9px] md:mt-6 md:px-5 md:py-2 md:text-sm",
                  dark ? "bg-white text-black" : "bg-badge text-white",
                )}
              >
                {banner.buttonText} <ArrowRight className="size-3 md:size-4" />
              </span>
            )}
          </div>
        </>
      )}
    </BannerLink>
  );
}

export function CategoryBanner({ banner }: { banner: Banner }) {
  const light = banner.style === "light";
  return (
    <BannerLink href={banner.link} className="group relative block aspect-[2/3] overflow-hidden bg-soft">
      {banner.imageUrl && (
        <Image
          src={banner.imageUrl}
          alt={banner.title}
          fill
          sizes="(min-width: 768px) 33vw, 100vw"
          className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
        />
      )}
      {hasText(banner) && (
        <>
          <div
            className={cn(
              "absolute inset-0 bg-gradient-to-t to-transparent",
              light ? "from-white/70 via-white/10" : "from-black/45 via-black/5",
            )}
          />
          <div
            className={cn(
              "absolute inset-x-0 bottom-[11%] flex flex-col items-center px-4 text-center",
              light ? "text-black" : "text-white",
            )}
          >
            {banner.title && (
              <h3 className="font-display text-6xl font-extralight leading-none tracking-tight md:text-5xl xl:text-7xl">
                {banner.title}
              </h3>
            )}
            {banner.subtitle && (
              <p className="mt-1 font-display text-2xl font-extralight tracking-[0.12em] md:text-xl xl:text-3xl">
                {banner.subtitle}
              </p>
            )}
            {banner.buttonText && (
              <span
                className={cn(
                  "mt-5 inline-flex items-center gap-1 border px-2.5 py-1 text-[11px] font-medium",
                  light ? "border-black/70" : "border-white/80",
                )}
              >
                {banner.buttonText} <ArrowRight className="size-3" />
              </span>
            )}
          </div>
        </>
      )}
    </BannerLink>
  );
}
