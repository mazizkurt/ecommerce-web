import { ArrowRight } from "lucide-react";
import Image, { getImageProps } from "next/image";
import Link from "next/link";
import type { banners } from "@/lib/db/schema";

type Banner = typeof banners.$inferSelect;

function BannerLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
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
    ? getImageProps({ ...common, src: mobile, width: 900, height: 1100 }).props
        .srcSet
    : undefined;
  return (
    <picture>
      {mobileSet && <source media="(max-width: 767px)" srcSet={mobileSet} />}
      <source media="(min-width: 768px)" srcSet={desktopSet} />
      <img {...rest} alt={alt} className="absolute inset-0 size-full object-cover" />
    </picture>
  );
}

export function HeroSlide({ banner, priority }: { banner: Banner; priority?: boolean }) {
  return (
    <BannerLink href={banner.link} className="absolute inset-0 block">
      {banner.videoUrl ? (
        <video
          src={banner.videoUrl}
          poster={banner.imageUrl || undefined}
          autoPlay
          muted
          loop
          playsInline
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
      {(banner.title || banner.subtitle) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/15 px-6 text-center text-white">
          {banner.title && (
            <h2 className="font-display text-5xl font-extralight tracking-[0.06em] drop-shadow-sm md:text-8xl">
              {banner.title}
            </h2>
          )}
          {banner.subtitle && (
            <p className="mt-2 font-display text-sm font-light tracking-[0.3em] md:text-2xl">
              {banner.subtitle}
            </p>
          )}
        </div>
      )}
    </BannerLink>
  );
}

export function WideBanner({ banner, logoText }: { banner: Banner; logoText: string }) {
  return (
    <BannerLink
      href={banner.link}
      className="relative mx-[3px] mt-[5px] block aspect-[1920/896] overflow-hidden bg-soft"
    >
      {banner.imageUrl && (
        <Image src={banner.imageUrl} alt={banner.title} fill sizes="100vw" className="object-cover" />
      )}
      <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/80 to-white/70" />
      <div className="absolute inset-2.5 rounded-[18px] border border-red-600/60 md:inset-7 md:rounded-[44px]" />
      <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center text-red-600">
        <span className="font-logo text-[10px] tracking-[0.35em] text-black md:text-lg">
          {logoText}
        </span>
        {banner.title && (
          <h2 className="font-display text-3xl font-light tracking-wide md:text-8xl">
            {banner.title}
          </h2>
        )}
        {banner.subtitle && (
          <p className="text-[10px] md:mt-1 md:text-xl">{banner.subtitle}</p>
        )}
        {banner.buttonText && (
          <span className="mt-2 inline-flex items-center gap-1 rounded bg-red-600 px-2 py-1 text-[9px] text-white md:mt-6 md:px-5 md:py-2 md:text-sm">
            {banner.buttonText} <ArrowRight className="size-3 md:size-4" />
          </span>
        )}
      </div>
    </BannerLink>
  );
}

export function CategoryBanner({ banner }: { banner: Banner }) {
  return (
    <BannerLink
      href={banner.link}
      className="group relative block aspect-[2/3] overflow-hidden bg-soft"
    >
      {banner.imageUrl && (
        <Image
          src={banner.imageUrl}
          alt={banner.title}
          fill
          sizes="(min-width: 768px) 33vw, 100vw"
          className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/5 to-transparent" />
      <div className="absolute inset-x-0 bottom-[11%] flex flex-col items-center px-4 text-center text-white">
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
          <span className="mt-5 inline-flex items-center gap-1 border border-white/80 px-2.5 py-1 text-[11px] font-medium">
            {banner.buttonText} <ArrowRight className="size-3" />
          </span>
        )}
      </div>
    </BannerLink>
  );
}
