import { CategoryBanner, HeroSlide, WideBanner } from "@/components/shop/banners";
import { HeroSlider } from "@/components/shop/hero-slider";
import { Newsletter } from "@/components/shop/newsletter-form";
import {
  ProductCarousel,
  ProductGrid,
  ReviewsCarousel,
  SectionHeader,
} from "@/components/shop/sections";
import { getBanners, getHomeReviews, getProducts } from "@/lib/queries";
import { getSettings, pricingFrom } from "@/lib/settings";

export default async function HomePage() {
  const [settings, heroes, wides, categoryBanners, latest, trends, reviews] =
    await Promise.all([
      getSettings(),
      getBanners("hero"),
      getBanners("wide"),
      getBanners("category"),
      getProducts({ isNew: true, perPage: 12 }),
      getProducts({ isTrend: true, perPage: 12, sort: "discount" }),
      getHomeReviews(),
    ]);
  const { cartDiscountPercent } = pricingFrom(settings);

  return (
    <>
      {heroes.length > 0 && (
        <HeroSlider>
          {heroes.map((b, i) => (
            <HeroSlide key={b.id} banner={b} priority={i === 0} />
          ))}
        </HeroSlider>
      )}

      {wides.map((b) => (
        <WideBanner key={b.id} banner={b} logoText={settings.logoText} />
      ))}

      {categoryBanners.length > 0 && (
        <section className="mt-[5px] grid gap-[5px] px-[3px] md:grid-cols-3">
          {categoryBanners.map((b) => (
            <CategoryBanner key={b.id} banner={b} />
          ))}
        </section>
      )}

      {latest.items.length > 0 && (
        <section>
          <SectionHeader title="Yeni Ürünler" href="/arama?liste=yeni" />
          <ProductGrid items={latest.items} cartDiscountPercent={cartDiscountPercent} />
        </section>
      )}

      {trends.items.length > 0 && (
        <section>
          <SectionHeader title="İndirim Trendleri" href="/arama?liste=indirim" />
          <ProductCarousel items={trends.items} cartDiscountPercent={cartDiscountPercent} />
        </section>
      )}

      {reviews.length > 0 && <ReviewsCarousel reviews={reviews} />}

      <Newsletter />
    </>
  );
}
