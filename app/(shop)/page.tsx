import { CategoryBanner, HeroSlide, WideBanner } from "@/components/shop/banners";
import { HeroSlider } from "@/components/shop/hero-slider";
import { Newsletter } from "@/components/shop/newsletter-form";
import { ProductCarousel, ProductGrid, ReviewsCarousel, SectionHeader } from "@/components/shop/sections";
import { getBanners, getHomeReviews, getProducts } from "@/lib/queries";
import { getSettings, type HomeSectionKey, parseHomeSections, pricingFrom } from "@/lib/settings";

const count = (v: string) => Math.min(48, Math.max(1, Number.parseInt(v, 10) || 12));

export default async function HomePage() {
  const settings = await getSettings();
  const sections = parseHomeSections(settings).filter((s) => s.enabled);
  const on = (key: HomeSectionKey) => sections.some((s) => s.key === key);

  const [heroes, wides, categoryBanners, latest, trends, reviews] = await Promise.all([
    on("hero") ? getBanners("hero") : [],
    on("wide") ? getBanners("wide") : [],
    on("categories") ? getBanners("category") : [],
    on("new") ? getProducts({ isNew: true, perPage: count(settings.newCount) }) : null,
    on("trend") ? getProducts({ isTrend: true, perPage: count(settings.trendCount), sort: "discount" }) : null,
    on("reviews") ? getHomeReviews() : [],
  ]);
  const { cartDiscountPercent } = pricingFrom(settings);

  const render: Record<HomeSectionKey, () => React.ReactNode> = {
    hero: () =>
      heroes.length > 0 && (
        <HeroSlider intervalSeconds={Number(settings.heroInterval) || 6}>
          {heroes.map((b, i) => (
            <HeroSlide key={b.id} banner={b} priority={i === 0} />
          ))}
        </HeroSlider>
      ),
    wide: () => wides.map((b) => <WideBanner key={b.id} banner={b} logoText={settings.logoText} />),
    categories: () =>
      categoryBanners.length > 0 && (
        <section className="mt-[5px] grid gap-[5px] px-[3px] md:grid-cols-3">
          {categoryBanners.map((b) => (
            <CategoryBanner key={b.id} banner={b} />
          ))}
        </section>
      ),
    new: () =>
      latest &&
      latest.items.length > 0 && (
        <section>
          <SectionHeader title={settings.newTitle} href="/arama?liste=yeni" />
          <ProductGrid items={latest.items} cartDiscountPercent={cartDiscountPercent} />
        </section>
      ),
    trend: () =>
      trends &&
      trends.items.length > 0 && (
        <section>
          <SectionHeader title={settings.trendTitle} href="/arama?liste=indirim" />
          <ProductCarousel items={trends.items} cartDiscountPercent={cartDiscountPercent} />
        </section>
      ),
    reviews: () =>
      reviews.length > 0 && (
        <>
          {settings.reviewsTitle && <SectionHeader title={settings.reviewsTitle} />}
          <ReviewsCarousel reviews={reviews} />
        </>
      ),
    newsletter: () => <Newsletter title={settings.newsletterTitle} text={settings.newsletterText} />,
  };

  return (
    <>
      {sections.map((s) => (
        <div key={s.key} className="contents">
          {render[s.key]()}
        </div>
      ))}
    </>
  );
}
