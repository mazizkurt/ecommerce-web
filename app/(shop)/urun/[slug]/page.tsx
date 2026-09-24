import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { absoluteUrl, breadcrumbLd, excerpt, JsonLd } from "@/components/shop/json-ld";
import { BuyBox, ProductGallery, Stars } from "@/components/shop/product-detail";
import { ReviewForm } from "@/components/shop/review-form";
import { Breadcrumb, ProductGrid, SectionHeader } from "@/components/shop/sections";
import { formatDate, maskName } from "@/lib/format";
import {
  categoryTrail,
  getAllCategories,
  getColorSiblings,
  getProductBySlug,
  getProductReviews,
  getProducts,
  type ProductCardData,
} from "@/lib/queries";
import { getSettings, pricingFrom, siteUrlFrom } from "@/lib/settings";

export async function generateMetadata({ params }: PageProps<"/urun/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Ürün bulunamadı" };
  const description = product.metaDescription || excerpt(product.description) || undefined;
  return {
    title: product.metaTitle || product.name,
    description,
    alternates: { canonical: `/urun/${product.slug}` },
    openGraph: {
      title: product.metaTitle || product.name,
      description,
      url: `/urun/${product.slug}`,
      images: product.images.slice(0, 1).map((i) => i.url),
    },
  };
}

export default async function ProductPage({ params }: PageProps<"/urun/[slug]">) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const [settings, categories, reviews, related, siblings] = await Promise.all([
    getSettings(),
    getAllCategories(),
    getProductReviews(product.id),
    product.categoryId
      ? getProducts({ categoryIds: [product.categoryId], excludeId: product.id, perPage: 10 })
      : Promise.resolve({ items: [] as ProductCardData[] }),
    getColorSiblings(product.groupCode),
  ]);
  const siteUrl = siteUrlFrom(settings);
  const trail = categoryTrail(categories, product.categoryId);
  const rating = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  const card: ProductCardData = {
    id: product.id,
    name: product.name,
    slug: product.slug,
    price: product.price,
    comparePrice: product.comparePrice,
    images: product.images.map((i) => i.url),
    variants: product.variants.map(({ id, size, stock }) => ({ id, size, stock })),
  };
  const inStock = card.variants.some((v) => v.stock > 0);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    sku: product.code || undefined,
    image: card.images.map((i) => absoluteUrl(siteUrl, i)),
    description: product.metaDescription || excerpt(product.description, 5000),
    brand: { "@type": "Brand", name: settings.storeName },
    ...(product.colorName && { color: product.colorName }),
    offers: {
      "@type": "Offer",
      priceCurrency: "TRY",
      price: (product.price / 100).toFixed(2),
      availability: inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      url: `${siteUrl}/urun/${product.slug}`,
      seller: { "@type": "Organization", name: settings.storeName },
    },
    ...(reviews.length > 0 && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: rating.toFixed(1),
        reviewCount: reviews.length,
      },
    }),
  };

  return (
    <div className="pb-8">
      <JsonLd data={jsonLd} />
      <JsonLd
        data={breadcrumbLd(siteUrl, [
          { name: "Ana Sayfa", path: "/" },
          ...trail.map((c) => ({ name: c.name, path: `/kategori/${c.slug}` })),
          { name: product.name, path: `/urun/${product.slug}` },
        ])}
      />
      <div className="[&>nav]:px-2.5 [&>nav]:py-2">
        <Breadcrumb
          items={[
            { label: "Ana Sayfa", href: "/" },
            ...trail.map((c) => ({ label: c.name, href: `/kategori/${c.slug}` })),
          ]}
        />
      </div>

      <div className="grid gap-6 px-2.5 lg:grid-cols-[minmax(0,1fr)_460px] lg:gap-8">
        <ProductGallery images={card.images} name={product.name} />
        <div className="lg:sticky lg:top-24 lg:self-start">
          <BuyBox
            product={card}
            code={product.code}
            rating={rating}
            reviewCount={reviews.length}
            whatsapp={settings.whatsapp}
            whatsappMessage={settings.whatsappMessage}
            siteUrl={siteUrl}
            colorName={product.colorName}
            colors={siblings.map((s) => ({
              slug: s.slug,
              colorName: s.colorName || "Renk",
              colorHex: s.colorHex,
              image: s.image,
              current: s.id === product.id,
            }))}
          />
          <details className="group mt-6" open>
            <summary className="flex cursor-pointer list-none items-center gap-3 bg-[#f5f5f5] px-4 py-3 text-sm">
              <span className="transition-transform group-open:rotate-90">›</span>
              Ürün Özellikleri
            </summary>
            <div className="whitespace-pre-line px-1 pt-4 text-[13px] leading-[1.6] text-[#222]">
              {product.description || "Bu ürün için açıklama eklenmemiş."}
            </div>
          </details>
        </div>
      </div>

      <section id="yorumlar" className="mx-auto max-w-3xl scroll-mt-28 px-4 pt-14">
        {reviews.length === 0 ? (
          <p className="mb-3 text-center text-sm">Bu ürün için henüz yorum yapılmadı.</p>
        ) : (
          <>
            <h2 className="mb-4 text-center text-lg">Değerlendirmeler ({reviews.length})</h2>
            <ul className="mb-6 divide-y divide-line border-y border-line">
              {reviews.map((r) => (
                <li key={r.id} className="py-4">
                  <div className="flex items-center justify-between">
                    <Stars rating={r.rating} className="text-star" />
                    <span className="text-xs text-zinc-500">{formatDate(r.createdAt)}</span>
                  </div>
                  <p className="mt-2 text-sm">{r.comment}</p>
                  <p className="mt-1 text-xs text-zinc-500">{maskName(r.name)}</p>
                </li>
              ))}
            </ul>
          </>
        )}
        <ReviewForm productId={product.id} />
      </section>

      {related.items.length > 0 && (
        <section>
          <SectionHeader title="Benzer Ürünler" />
          <ProductGrid
            items={related.items}
            cartDiscountPercent={pricingFrom(settings).cartDiscountPercent}
            columns="five"
          />
        </section>
      )}
    </div>
  );
}
