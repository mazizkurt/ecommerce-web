/**
 * Örnek verilerle veritabanını doldurur.
 *   bun run db:seed    -> boşsa örnek katalog + yönetici hesabı oluşturur
 *   bun run db:reset   -> katalog/sipariş tablolarını temizleyip yeniden doldurur
 *
 * Görseller Unsplash (ücretsiz lisans) üzerinden örnek amaçlıdır; kendi ürün
 * fotoğraflarınızı yönetim panelinden yükleyin.
 */
import { count, eq, sql } from "drizzle-orm";
import { db } from "../lib/db";
import * as t from "../lib/db/schema";
import { slugify } from "../lib/format";
import { hashPassword } from "../lib/password";

const reset = process.argv.includes("--reset");

const photo = (id: string, params: string) =>
  `https://images.unsplash.com/${id}?${params}`;
const productShot = (id: string) =>
  photo(id, "w=1000&h=1500&fit=crop&crop=entropy");
const detailShot = (id: string) =>
  photo(
    id,
    "w=1000&h=1500&fit=crop&crop=focalpoint&fp-x=0.5&fp-y=0.45&fp-z=1.5",
  );
const wideShot = (id: string) => photo(id, "w=1920&h=900&fit=crop&crop=entropy");
const tallShot = (id: string) => photo(id, "w=800&h=1200&fit=crop&crop=entropy");
const mobileShot = (id: string) =>
  photo(id, "w=900&h=1100&fit=crop&crop=entropy");

const IMG = {
  yellowTracksuit: "photo-1515886657613-9f3515b0c78f",
  burgundyCoat: "photo-1483985988355-763728e1935b",
  floralDress: "photo-1496747611176-843222e1e57c",
  stripedPants: "photo-1509631179647-0177331693ae",
  plaidBlazer: "photo-1485968579580-b6d095142e6e",
  blueTrench: "photo-1539109136881-3be0616acf4b",
  pinkDress: "photo-1581044777550-4cfa60707c03",
  redTee: "photo-1529139574466-a303027c1d8b",
  poncho: "photo-1434389677669-e08b4cac3105",
  rack: "photo-1551232864-3f0890e580d9",
  knitRack: "photo-1558769132-cb1aea458c5e",
  laceBustier: "photo-1469334031218-e382a71b716b",
  blackTee: "photo-1503342217505-b0a15ec3261c",
  jumpsuit: "photo-1495385794356-15371f348c31",
  whiteTee: "photo-1554568218-0f1715e72254",
  blueTee: "photo-1564584217132-2271feaeb3c5",
  redDress: "photo-1572804013309-59a88b7e92f1",
  denimDress: "photo-1591369822096-ffd140ec948f",
  pinkPants: "photo-1594633312681-425c7b97ccd1",
  whiteMini: "photo-1515372039744-b8f02a3ae446",
  purpleGown: "photo-1566174053879-31528523f8ae",
};

type CategorySeed = {
  name: string;
  slug?: string;
  highlight?: boolean;
  children?: string[];
};

const CATEGORY_SEED: CategorySeed[] = [
  { name: "Büyük İndirim", highlight: true },
  { name: "Sezon İndirimi" },
  { name: "Yeni Gelenler" },
  { name: "Takım" },
  {
    name: "Dış Giyim",
    children: ["Hırka", "Yelek", "Trençkot", "Panço", "Ceket", "Kaban", "Mont"],
  },
  {
    name: "Üst Giyim",
    children: [
      "Crop",
      "Kimono",
      "Body",
      "Bluz",
      "Tshirt",
      "Bustiyer",
      "Gömlek",
      "Sweatshirt",
      "Kazak",
    ],
  },
  {
    name: "Alt Giyim",
    children: ["Etek", "Tulum", "Şort", "Pantolon", "Tayt", "Eşofman"],
  },
  { name: "Elbise" },
];

type ProductSeed = {
  name: string;
  code: string;
  categories: string[]; // ilk eleman ana kategori
  price: number; // TL
  comparePrice?: number;
  image: string;
  isNew?: boolean;
  isTrend?: boolean;
  stock?: [number, number, number];
  description: string;
};

const PRODUCT_SEED: ProductSeed[] = [
  {
    name: "Kapüşonlu Sweatshirt Eşofman Takım - Hardal",
    code: "TK-4203",
    categories: ["takim", "esofman", "sezon-indirimi"],
    price: 1599.9,
    comparePrice: 1899.9,
    image: IMG.yellowTracksuit,
    isNew: true,
    isTrend: true,
    description:
      "Yumuşak dokulu iki iplik kumaştan kapüşonlu sweatshirt ve eşofman altı takım.\nGörselde S beden kullanılmıştır.\n%70 pamuk %30 polyester\nPantolon beli lastiklidir.",
  },
  {
    name: "Yün Karışımlı Uzun Kaban - Bordo",
    code: "KB-2811",
    categories: ["kaban", "yeni-gelenler"],
    price: 2349.9,
    comparePrice: 2899.9,
    image: IMG.burgundyCoat,
    isNew: true,
    description:
      "Astarlı, yün karışımlı kumaştan uzun kaban.\nİki adet yan cep, gizli düğme kapama.\n%40 yün %60 polyester",
  },
  {
    name: "Çiçek Desenli Midi Elbise - Ekru",
    code: "EL-3039",
    categories: ["elbise", "yeni-gelenler"],
    price: 1299.9,
    image: IMG.floralDress,
    isNew: true,
    description:
      "Akışkan viskon kumaştan çiçek desenli midi boy elbise.\nAstarlıdır.\nOrtalama boy uzunluğu: 120 cm",
  },
  {
    name: "Çizgili Bol Paça Pantolon - Siyah",
    code: "PN-1177",
    categories: ["pantolon", "buyuk-indirim"],
    price: 899.9,
    comparePrice: 1199.9,
    image: IMG.stripedPants,
    isTrend: true,
    description:
      "Yüksek bel, bol paça çizgili pantolon.\nBeli arkadan lastiklidir.\n%95 polyester %5 elastan",
  },
  {
    name: "Kareli Oversize Blazer Ceket - Lacivert",
    code: "CK-7068",
    categories: ["ceket", "yeni-gelenler"],
    price: 1649.9,
    image: IMG.plaidBlazer,
    isNew: true,
    description:
      "Omuz vatkalı, astarlı oversize blazer ceket.\nTek düğme kapama, iki adet kapaklı cep.",
  },
  {
    name: "Kuşaklı Uzun Trençkot - Buz Mavisi",
    code: "TR-5120",
    categories: ["trenckot", "sezon-indirimi"],
    price: 2199.9,
    comparePrice: 2749.9,
    image: IMG.blueTrench,
    isNew: true,
    isTrend: true,
    description:
      "Su itici gabardin kumaştan kuşaklı uzun trençkot.\nÇift sıra düğme, apoletli omuz detayı.",
  },
  {
    name: "Balon Kollu Puantiyeli Elbise - Pembe",
    code: "EL-4113",
    categories: ["elbise", "yeni-gelenler"],
    price: 1459.9,
    image: IMG.pinkDress,
    isNew: true,
    description:
      "Balon kollu, kare yaka puantiyeli şifon elbise.\nAstarlıdır, beli lastiklidir.",
  },
  {
    name: "Baskılı Oversize Tişört - Kırmızı",
    code: "TS-2614",
    categories: ["tshirt", "buyuk-indirim"],
    price: 549.9,
    comparePrice: 749.9,
    image: IMG.redTee,
    isTrend: true,
    description: "%100 pamuk, oversize kalıp baskılı tişört.",
  },
  {
    name: "Püsküllü Örgü Panço - Krem",
    code: "PC-8927",
    categories: ["panco", "yeni-gelenler"],
    price: 789.9,
    image: IMG.poncho,
    isNew: true,
    stock: [6, 0, 0],
    description:
      "El örgüsü görünümlü, uçları püsküllü panço.\nStandart bedendir.",
  },
  {
    name: "Dantelli Bustiyer - Yeşil",
    code: "BS-4137",
    categories: ["bustiyer", "buyuk-indirim"],
    price: 459.9,
    comparePrice: 699.9,
    image: IMG.laceBustier,
    isTrend: true,
    description: "Dantel detaylı, ayarlanabilir askılı bustiyer.",
  },
  {
    name: "Baskılı Basic Tişört - Siyah",
    code: "TS-4197",
    categories: ["tshirt", "yeni-gelenler"],
    price: 399.9,
    image: IMG.blackTee,
    isNew: true,
    description: "%100 pamuk, rahat kalıp baskılı tişört.",
  },
  {
    name: "Derin V Yaka Saten Tulum - Petrol",
    code: "TL-8678",
    categories: ["tulum", "sezon-indirimi"],
    price: 1349.9,
    comparePrice: 1799.9,
    image: IMG.jumpsuit,
    isTrend: true,
    description:
      "Saten kumaştan derin V yaka, bol paça tulum.\nArkadan gizli fermuarlıdır.",
  },
  {
    name: "Baskılı Oversize Tişört - Beyaz",
    code: "TS-4189",
    categories: ["tshirt", "yeni-gelenler"],
    price: 449.9,
    image: IMG.whiteTee,
    isNew: true,
    description: "%100 pamuk, oversize kalıp baskılı tişört.",
  },
  {
    name: "Melanj Basic Tişört - Mavi",
    code: "TS-4191",
    categories: ["tshirt", "buyuk-indirim"],
    price: 349.9,
    comparePrice: 599.9,
    image: IMG.blueTee,
    isTrend: true,
    description: "Yumuşak melanj kumaştan basic tişört.",
  },
  {
    name: "Kemerli Çiçekli Kloş Elbise - Kırmızı",
    code: "EL-3310",
    categories: ["elbise", "yeni-gelenler"],
    price: 1199.9,
    image: IMG.redDress,
    isNew: true,
    description:
      "Kruvaze yaka, kemerli çiçekli kloş elbise.\nKemer dahildir.",
  },
  {
    name: "Düğmeli Kısa Kol Denim Elbise",
    code: "EL-2750",
    categories: ["elbise", "sezon-indirimi"],
    price: 999.9,
    comparePrice: 1399.9,
    image: IMG.denimDress,
    isTrend: true,
    description: "Önden düğmeli, kısa kollu denim elbise.\n%100 pamuk",
  },
  {
    name: "Cepli Jogger Pantolon - Pudra",
    code: "PN-6041",
    categories: ["pantolon", "yeni-gelenler"],
    price: 749.9,
    image: IMG.pinkPants,
    isNew: true,
    description: "Beli lastikli, paçası büzgülü cepli jogger pantolon.",
  },
  {
    name: "Fırfırlı Kayık Yaka Mini Elbise - Beyaz",
    code: "EL-1508",
    categories: ["elbise", "sezon-indirimi"],
    price: 899.9,
    comparePrice: 1099.9,
    image: IMG.whiteMini,
    isNew: true,
    isTrend: true,
    description: "Kayık yaka, fırfır detaylı mini elbise.\nAstarlıdır.",
  },
  {
    name: "Kayık Yaka Maxi Abiye Elbise - Mor",
    code: "EL-9002",
    categories: ["elbise", "yeni-gelenler"],
    price: 1899.9,
    image: IMG.purpleGown,
    isNew: true,
    stock: [3, 4, 0],
    description: "Esnek krep kumaştan kayık yaka maxi abiye elbise.",
  },
];

const PAGE_SEED = [
  { slug: "hakkimizda", title: "Hakkımızda", footerGroup: "kurumsal" },
  { slug: "iletisim", title: "İletişim", footerGroup: "kurumsal" },
  { slug: "degisim-ve-iade", title: "Değişim & İade Koşulları", footerGroup: "kurumsal" },
  { slug: "cerez-politikasi", title: "Çerez Politikası", footerGroup: "kurumsal" },
  { slug: "mesafeli-satis-sozlesmesi", title: "Mesafeli Satış Sözleşmesi", footerGroup: "kurumsal" },
  { slug: "gizlilik-sozlesmesi", title: "Gizlilik Sözleşmesi", footerGroup: "kurumsal" },
  { slug: "sss", title: "Sıkça Sorulan Sorular", footerGroup: "musteri" },
] as const;

const kurus = (tl: number) => Math.round(tl * 100);

async function seedAdmin() {
  const [existing] = await db
    .select({ id: t.users.id })
    .from(t.users)
    .where(eq(t.users.role, "admin"))
    .limit(1);
  if (existing) return;
  const email = process.env.ADMIN_EMAIL ?? "admin@example.com";
  const password = process.env.ADMIN_PASSWORD ?? "admin123";
  await db.insert(t.users).values({
    email,
    name: "Yönetici",
    role: "admin",
    passwordHash: await hashPassword(password),
  });
  console.log(`✔ Yönetici oluşturuldu: ${email} / ${password}`);
}

async function seedCatalog() {
  const slugToId = new Map<string, number>();
  for (const [i, c] of CATEGORY_SEED.entries()) {
    const slug = c.slug ?? slugify(c.name);
    const [row] = await db
      .insert(t.categories)
      .values({ name: c.name, slug, sortOrder: i, highlight: !!c.highlight })
      .returning({ id: t.categories.id });
    slugToId.set(slug, row.id);
    for (const [j, child] of (c.children ?? []).entries()) {
      const childSlug = slugify(child);
      const [childRow] = await db
        .insert(t.categories)
        .values({ name: child, slug: childSlug, parentId: row.id, sortOrder: j })
        .returning({ id: t.categories.id });
      slugToId.set(childSlug, childRow.id);
    }
  }

  const now = Date.now();
  const productIds: number[] = [];
  for (const [i, p] of PRODUCT_SEED.entries()) {
    const categoryIds = p.categories.map((slug) => {
      const id = slugToId.get(slug);
      if (!id) throw new Error(`Kategori bulunamadı: ${slug}`);
      return id;
    });
    const [row] = await db
      .insert(t.products)
      .values({
        name: p.name,
        slug: slugify(`${p.name}-${p.code}`),
        code: p.code,
        description: p.description,
        price: kurus(p.price),
        comparePrice: p.comparePrice ? kurus(p.comparePrice) : null,
        categoryId: categoryIds[0],
        isNew: !!p.isNew,
        isTrend: !!p.isTrend,
        createdAt: new Date(now - i * 3_600_000),
        updatedAt: new Date(now - i * 3_600_000),
      })
      .returning({ id: t.products.id });
    productIds.push(row.id);
    await db
      .insert(t.productCategories)
      .values(categoryIds.map((categoryId) => ({ productId: row.id, categoryId })));
    await db.insert(t.productImages).values([
      { productId: row.id, url: productShot(p.image), sortOrder: 0 },
      { productId: row.id, url: detailShot(p.image), sortOrder: 1 },
    ]);
    const standardOnly = p.stock && p.stock[1] === 0 && p.stock[2] === 0;
    const stock = p.stock ?? [8, 12, 5];
    await db.insert(t.productVariants).values(
      standardOnly
        ? [{ productId: row.id, size: "STD", stock: stock[0], sortOrder: 0 }]
        : ["S", "M", "L"].map((size, idx) => ({
            productId: row.id,
            size,
            stock: stock[idx],
            sortOrder: idx,
          })),
    );
  }

  await db.insert(t.banners).values([
    {
      placement: "hero",
      title: "YENİ SEZON",
      subtitle: "SONBAHAR · KIŞ KOLEKSİYONU",
      link: "/kategori/yeni-gelenler",
      imageUrl: wideShot(IMG.blueTrench),
      mobileImageUrl: mobileShot(IMG.blueTrench),
      sortOrder: 0,
    },
    {
      placement: "hero",
      title: "ELBİSE MODELLERİ",
      subtitle: "GÜNDEN GECEYE ŞIKLIK",
      link: "/kategori/elbise",
      imageUrl: wideShot(IMG.floralDress),
      mobileImageUrl: mobileShot(IMG.floralDress),
      sortOrder: 1,
    },
    {
      placement: "wide",
      title: "SEZON İNDİRİMİ",
      subtitle: "Stilini Tamamla, İndirimleri Kaçırma",
      buttonText: "Hemen Keşfet",
      link: "/kategori/sezon-indirimi",
      imageUrl: wideShot(IMG.rack),
      mobileImageUrl: mobileShot(IMG.rack),
      sortOrder: 0,
    },
    {
      placement: "category",
      title: "Elbise",
      subtitle: "modelleri",
      buttonText: "Hemen Keşfet",
      link: "/kategori/elbise",
      imageUrl: tallShot(IMG.redDress),
      sortOrder: 0,
    },
    {
      placement: "category",
      title: "Üst Giyim",
      subtitle: "modelleri",
      buttonText: "Hemen Keşfet",
      link: "/kategori/ust-giyim",
      imageUrl: tallShot(IMG.redTee),
      sortOrder: 1,
    },
    {
      placement: "category",
      title: "Takım",
      subtitle: "modelleri",
      buttonText: "Hemen Keşfet",
      link: "/kategori/takim",
      imageUrl: tallShot(IMG.yellowTracksuit),
      sortOrder: 2,
    },
  ]);

  // Tasarımı göstermek için ÖRNEK yorumlar — yayına almadan önce panelden silin.
  const sampleReviews = [
    "Kumaşı çok kaliteli, tam beden oldu. (Örnek yorum)",
    "Kargo çok hızlı geldi, paketleme özenliydi. (Örnek yorum)",
    "Rengi fotoğraftakiyle birebir aynı, çok beğendim. (Örnek yorum)",
    "Kalıbı çok güzel, rahatlıkla bir beden küçük alınabilir. (Örnek yorum)",
    "Fiyatına göre kalitesi çok iyi, tekrar alışveriş yapacağım. (Örnek yorum)",
  ];
  await db.insert(t.reviews).values(
    sampleReviews.map((comment, i) => ({
      productId: productIds[i % productIds.length],
      name: "Örnek Müşteri",
      rating: 5,
      comment,
      isApproved: true,
    })),
  );

  await db.insert(t.pages).values(
    PAGE_SEED.map((p, i) => ({
      ...p,
      sortOrder: i,
      content: `${p.title} içeriğini yönetim panelinden (Sayfalar menüsü) düzenleyebilirsiniz.\n\nBu metin örnek amaçlıdır. Yasal metinlerinizi (mesafeli satış sözleşmesi, KVKK/gizlilik, iade koşulları) bir hukuk danışmanıyla hazırlayıp buraya ekleyin.`,
    })),
  );

  console.log(
    `✔ ${CATEGORY_SEED.length} ana kategori, ${PRODUCT_SEED.length} ürün, bannerlar ve sayfalar eklendi.`,
  );
}

async function main() {
  if (reset) {
    // Kullanıcılar, aboneler ve ayarlar korunur; id ve sipariş numaraları baştan başlar.
    await db.execute(
      sql`truncate table order_items, orders, reviews, product_categories, product_images, product_variants, products, categories, banners, pages restart identity cascade`,
    );
    console.log("✔ Katalog ve sipariş tabloları temizlendi.");
  }

  await seedAdmin();

  const [{ n }] = await db.select({ n: count() }).from(t.products);
  if (n > 0) {
    console.log("ℹ Ürünler zaten mevcut, örnek katalog atlandı (sıfırlamak için: bun run db:reset).");
    return;
  }
  await seedCatalog();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
