"use server";

import { eq, inArray, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { z } from "zod";
import { checkbox, idFrom, parseJson, refreshStore, str, uniqueSlug } from "@/lib/admin-utils";
import { createSession, destroySession, requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  BANNER_PLACEMENTS,
  BANNER_STYLES,
  banners,
  categories,
  ORDER_STATUSES,
  orderItems,
  orders,
  PAGE_GROUPS,
  PAYMENT_STATUSES,
  pages,
  productCategories,
  productImages,
  products,
  productVariants,
  reviews,
  settings,
  users,
} from "@/lib/db/schema";
import { parsePrice, slugify } from "@/lib/format";
import { type FormState, fieldErrors } from "@/lib/form-utils";
import { notifyOrderUpdated } from "@/lib/notifications";
import { releaseCoupon, restoreStock } from "@/lib/orders";
import { hashPassword, verifyPassword } from "@/lib/password";
import { getEnabledProviders } from "@/lib/payments";
import {
  BODY_FONTS,
  BOOLEAN_KEYS,
  COLOR_KEYS,
  DEFAULT_SETTINGS,
  enabledBuiltinMethods,
  getSettings,
  HEX_COLOR,
  HOME_SECTIONS,
  INFO_ICONS,
  LOGO_FONTS,
  MONEY_KEYS,
  SECRET_KEYS,
  type SettingKey,
} from "@/lib/settings";

/* ---------------- Giriş ---------------- */

export async function adminLogin(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = str(formData, "email").toLowerCase();
  const password = String(formData.get("password") ?? "");
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  const valid = user && (await verifyPassword(password, user.passwordHash));
  if (!valid || user.role !== "admin") {
    await new Promise((r) => setTimeout(r, 600)); // kaba kuvvet denemelerini yavaşlatır
    return { ok: false, message: "E-posta veya şifre hatalı.", values: { email } };
  }
  await createSession(user.id);
  redirect("/admin");
}

export async function adminLogout() {
  await destroySession();
  redirect("/admin/giris");
}

const passwordSchema = z
  .object({
    current: z.string().min(1, "Mevcut şifrenizi girin."),
    next: z.string().min(8, "Yeni şifre en az 8 karakter olmalı."),
    confirm: z.string(),
  })
  .refine((d) => d.next === d.confirm, { message: "Şifreler eşleşmiyor.", path: ["confirm"] });

export async function changePassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const parsed = passwordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
  const [user] = await db.select().from(users).where(eq(users.id, admin.id)).limit(1);
  if (!user || !(await verifyPassword(parsed.data.current, user.passwordHash))) {
    return { ok: false, errors: { current: "Mevcut şifre hatalı." } };
  }
  await db
    .update(users)
    .set({ passwordHash: await hashPassword(parsed.data.next) })
    .where(eq(users.id, admin.id));
  return { ok: true, message: "Şifreniz güncellendi." };
}

/* ---------------- Ürünler ---------------- */

const productSchema = z.object({
  name: z.string().trim().min(2, "Ürün adı girin.").max(200),
  slug: z.string().trim().max(160),
  code: z.string().trim().max(50),
  description: z.string().max(10000),
  price: z.number("Geçerli bir satış fiyatı girin.").int().positive("Geçerli bir satış fiyatı girin."),
  comparePrice: z.number().int().positive().nullable(),
  categoryId: z.number().int().positive().nullable(),
  extraCategoryIds: z.array(z.number().int().positive()),
  isActive: z.boolean(),
  isNew: z.boolean(),
  isTrend: z.boolean(),
  colorName: z.string().trim().max(40),
  colorHex: z.string().trim().regex(/^(#[0-9a-fA-F]{6})?$/, "Renk kodu #RRGGBB biçiminde olmalı."),
  groupCode: z.string().trim().max(60),
  metaTitle: z.string().trim().max(120),
  metaDescription: z.string().trim().max(320),
  images: z.array(z.string().startsWith("/").or(z.url())).max(20),
  variants: z
    .array(
      z.object({
        id: z.number().int().positive().optional(),
        size: z.string().trim().min(1, "Beden adı boş olamaz.").max(20),
        stock: z.number().int().min(0).max(1_000_000),
      }),
    )
    .min(1, "En az bir beden/varyant ekleyin."),
});

export async function saveProduct(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const id = idFrom(formData);
  const parsed = productSchema.safeParse({
    name: str(formData, "name"),
    slug: str(formData, "slug"),
    code: str(formData, "code"),
    description: String(formData.get("description") ?? ""),
    price: parsePrice(formData.get("price")) ?? undefined,
    comparePrice: parsePrice(formData.get("comparePrice")),
    categoryId: Number(formData.get("categoryId")) || null,
    extraCategoryIds: formData.getAll("extraCategoryIds").map(Number).filter(Boolean),
    isActive: checkbox(formData, "isActive"),
    isNew: checkbox(formData, "isNew"),
    isTrend: checkbox(formData, "isTrend"),
    colorName: str(formData, "colorName"),
    colorHex: str(formData, "colorHex"),
    groupCode: str(formData, "groupCode"),
    metaTitle: str(formData, "metaTitle"),
    metaDescription: str(formData, "metaDescription"),
    images: parseJson(formData.get("images")),
    variants: parseJson(formData.get("variants")),
  });
  if (!parsed.success) {
    return { ok: false, errors: fieldErrors(parsed.error), message: "Lütfen işaretli alanları kontrol edin." };
  }
  const d = parsed.data;
  if (d.comparePrice != null && d.comparePrice <= d.price) {
    return { ok: false, errors: { comparePrice: "Eski fiyat, satış fiyatından yüksek olmalı." } };
  }
  const sizes = d.variants.map((v) => v.size.toLocaleUpperCase("tr-TR"));
  if (new Set(sizes).size !== sizes.length) {
    return { ok: false, errors: { variants: "Aynı beden birden fazla kez eklenmiş." } };
  }

  const slug = await uniqueSlug(products, slugify(d.slug || d.name), id);
  const categoryIds = [...new Set([d.categoryId, ...d.extraCategoryIds].filter((c): c is number => !!c))];
  const values = {
    name: d.name,
    slug,
    code: d.code,
    description: d.description,
    price: d.price,
    comparePrice: d.comparePrice,
    categoryId: d.categoryId,
    isActive: d.isActive,
    isNew: d.isNew,
    isTrend: d.isTrend,
    colorName: d.colorName,
    colorHex: d.colorHex,
    groupCode: d.groupCode,
    metaTitle: d.metaTitle,
    metaDescription: d.metaDescription,
    updatedAt: new Date(),
  };

  const productId = await db.transaction(async (tx) => {
    let pid = id;
    if (pid) {
      await tx.update(products).set(values).where(eq(products.id, pid));
    } else {
      const [row] = await tx.insert(products).values(values).returning({ id: products.id });
      pid = row.id;
    }

    await tx.delete(productCategories).where(eq(productCategories.productId, pid));
    if (categoryIds.length) {
      await tx.insert(productCategories).values(categoryIds.map((categoryId) => ({ productId: pid, categoryId })));
    }

    await tx.delete(productImages).where(eq(productImages.productId, pid));
    if (d.images.length) {
      await tx.insert(productImages).values(d.images.map((url, i) => ({ productId: pid, url, sortOrder: i })));
    }

    // Varyant id'lerini koru: sepetler ve sipariş kalemleri bu id'lere bağlı.
    const existing = await tx
      .select({ id: productVariants.id })
      .from(productVariants)
      .where(eq(productVariants.productId, pid));
    const existingIds = new Set(existing.map((e) => e.id));
    const keep = new Set(d.variants.map((v) => v.id).filter((v): v is number => !!v && existingIds.has(v)));
    const removed = [...existingIds].filter((vid) => !keep.has(vid));
    if (removed.length) {
      await tx.update(orderItems).set({ variantId: null }).where(inArray(orderItems.variantId, removed));
      await tx.delete(productVariants).where(inArray(productVariants.id, removed));
    }
    for (const [i, v] of d.variants.entries()) {
      if (v.id && keep.has(v.id)) {
        await tx
          .update(productVariants)
          .set({ size: v.size, stock: v.stock, sortOrder: i })
          .where(eq(productVariants.id, v.id));
      } else {
        await tx.insert(productVariants).values({ productId: pid, size: v.size, stock: v.stock, sortOrder: i });
      }
    }
    return pid;
  });

  refreshStore();
  if (!id) redirect(`/admin/urunler/${productId}?kaydedildi=1`);
  return { ok: true, message: "Ürün kaydedildi." };
}

/** Ürünü (ör. yeni bir renk için) kopyalar; kopya satış dışı ve stoksuz başlar. */
export async function duplicateProduct(formData: FormData) {
  await requireAdmin();
  const id = idFrom(formData);
  if (!id) return;
  const source = await db.query.products.findFirst({
    where: eq(products.id, id),
    with: { images: true, variants: true, categoryLinks: true },
  });
  if (!source) return;
  const slug = await uniqueSlug(products, `${source.slug}-kopya`, null);

  const newId = await db.transaction(async (tx) => {
    const [row] = await tx
      .insert(products)
      .values({
        name: `${source.name} (Kopya)`,
        slug,
        code: source.code,
        description: source.description,
        price: source.price,
        comparePrice: source.comparePrice,
        categoryId: source.categoryId,
        isActive: false,
        isNew: source.isNew,
        isTrend: source.isTrend,
        groupCode: source.groupCode,
      })
      .returning({ id: products.id });
    if (source.images.length) {
      await tx
        .insert(productImages)
        .values(source.images.map((i) => ({ productId: row.id, url: i.url, sortOrder: i.sortOrder })));
    }
    if (source.variants.length) {
      await tx
        .insert(productVariants)
        .values(source.variants.map((v) => ({ productId: row.id, size: v.size, stock: 0, sortOrder: v.sortOrder })));
    }
    if (source.categoryLinks.length) {
      await tx
        .insert(productCategories)
        .values(source.categoryLinks.map((c) => ({ productId: row.id, categoryId: c.categoryId })));
    }
    return row.id;
  });
  redirect(`/admin/urunler/${newId}?kopyalandi=1`);
}

export async function deleteProduct(formData: FormData) {
  await requireAdmin();
  const id = idFrom(formData);
  if (!id) return;
  await db.transaction(async (tx) => {
    await tx.update(orderItems).set({ productId: null }).where(eq(orderItems.productId, id));
    const variantIds = (
      await tx.select({ id: productVariants.id }).from(productVariants).where(eq(productVariants.productId, id))
    ).map((v) => v.id);
    if (variantIds.length) {
      await tx.update(orderItems).set({ variantId: null }).where(inArray(orderItems.variantId, variantIds));
    }
    await tx.delete(products).where(eq(products.id, id));
  });
  refreshStore();
  redirect("/admin/urunler");
}

export async function toggleProductActive(formData: FormData) {
  await requireAdmin();
  const id = idFrom(formData);
  if (!id) return;
  await db
    .update(products)
    .set({ isActive: sql`not ${products.isActive}`, updatedAt: new Date() })
    .where(eq(products.id, id));
  refreshStore();
  revalidatePath("/admin/urunler");
}

/* ---------------- Kategoriler ---------------- */

const categorySchema = z.object({
  name: z.string().trim().min(1, "Kategori adı girin.").max(80),
  slug: z.string().trim().max(100),
  parentId: z.number().int().positive().nullable(),
  sortOrder: z.number().int(),
  showInMenu: z.boolean(),
  highlight: z.boolean(),
  description: z.string().trim().max(1000),
  imageUrl: z.string().trim().max(500),
  metaTitle: z.string().trim().max(120),
});

export async function saveCategory(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const id = idFrom(formData);
  const parsed = categorySchema.safeParse({
    name: str(formData, "name"),
    slug: str(formData, "slug"),
    parentId: Number(formData.get("parentId")) || null,
    sortOrder: Number(formData.get("sortOrder")) || 0,
    showInMenu: checkbox(formData, "showInMenu"),
    highlight: checkbox(formData, "highlight"),
    description: str(formData, "description"),
    imageUrl: str(formData, "imageUrl"),
    metaTitle: str(formData, "metaTitle"),
  });
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
  const d = parsed.data;

  if (id && d.parentId) {
    // Döngü oluşmasını engelle: seçilen üst kategori bu kategorinin altında olmamalı.
    const all = await db.select({ id: categories.id, parentId: categories.parentId }).from(categories);
    let cursor: number | null = d.parentId;
    while (cursor) {
      if (cursor === id) return { ok: false, errors: { parentId: "Kategori kendi alt kategorisine taşınamaz." } };
      cursor = all.find((c) => c.id === cursor)?.parentId ?? null;
    }
  }

  const slug = await uniqueSlug(categories, slugify(d.slug || d.name), id);
  if (id) await db.update(categories).set({ ...d, slug }).where(eq(categories.id, id));
  else await db.insert(categories).values({ ...d, slug });

  refreshStore();
  if (!id) redirect("/admin/kategoriler?kaydedildi=1");
  return { ok: true, message: "Kategori kaydedildi." };
}

export async function deleteCategory(formData: FormData) {
  await requireAdmin();
  const id = idFrom(formData);
  if (!id) return;
  const [category] = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
  if (!category) return;
  await db.transaction(async (tx) => {
    await tx.update(categories).set({ parentId: category.parentId }).where(eq(categories.parentId, id));
    await tx.update(products).set({ categoryId: null }).where(eq(products.categoryId, id));
    await tx.delete(productCategories).where(eq(productCategories.categoryId, id));
    await tx.delete(categories).where(eq(categories.id, id));
  });
  refreshStore();
  redirect("/admin/kategoriler");
}

/* ---------------- Bannerlar ---------------- */

const bannerSchema = z.object({
  placement: z.enum(BANNER_PLACEMENTS),
  style: z.enum(BANNER_STYLES),
  title: z.string().trim().max(120),
  subtitle: z.string().trim().max(200),
  buttonText: z.string().trim().max(40),
  link: z.string().trim().max(300),
  imageUrl: z.string().trim().max(500),
  mobileImageUrl: z.string().trim().max(500),
  videoUrl: z.string().trim().max(500),
  sortOrder: z.number().int(),
  isActive: z.boolean(),
});

export async function saveBanner(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const id = idFrom(formData);
  const parsed = bannerSchema.safeParse({
    placement: str(formData, "placement"),
    style: str(formData, "style") || "auto",
    title: str(formData, "title"),
    subtitle: str(formData, "subtitle"),
    buttonText: str(formData, "buttonText"),
    link: str(formData, "link"),
    imageUrl: str(formData, "imageUrl"),
    mobileImageUrl: str(formData, "mobileImageUrl"),
    videoUrl: str(formData, "videoUrl"),
    sortOrder: Number(formData.get("sortOrder")) || 0,
    isActive: checkbox(formData, "isActive"),
  });
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
  if (!parsed.data.imageUrl && !parsed.data.videoUrl) {
    return { ok: false, errors: { imageUrl: "Bir görsel yükleyin." } };
  }
  if (id) await db.update(banners).set(parsed.data).where(eq(banners.id, id));
  else await db.insert(banners).values(parsed.data);
  refreshStore();
  redirect("/admin/bannerlar");
}

export async function deleteBanner(formData: FormData) {
  await requireAdmin();
  const id = idFrom(formData);
  if (id) await db.delete(banners).where(eq(banners.id, id));
  refreshStore();
  redirect("/admin/bannerlar");
}

/* ---------------- Sayfalar ---------------- */

const pageSchema = z.object({
  title: z.string().trim().min(1, "Başlık girin.").max(120),
  slug: z.string().trim().max(120),
  content: z.string().max(100_000),
  footerGroup: z.enum(PAGE_GROUPS),
  sortOrder: z.number().int(),
});

export async function savePage(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const id = idFrom(formData);
  const parsed = pageSchema.safeParse({
    title: str(formData, "title"),
    slug: str(formData, "slug"),
    content: String(formData.get("content") ?? ""),
    footerGroup: str(formData, "footerGroup"),
    sortOrder: Number(formData.get("sortOrder")) || 0,
  });
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
  const slug = await uniqueSlug(pages, slugify(parsed.data.slug || parsed.data.title), id);
  if (id) await db.update(pages).set({ ...parsed.data, slug }).where(eq(pages.id, id));
  else await db.insert(pages).values({ ...parsed.data, slug });
  refreshStore();
  if (!id) redirect("/admin/sayfalar");
  return { ok: true, message: "Sayfa kaydedildi." };
}

export async function deletePage(formData: FormData) {
  await requireAdmin();
  const id = idFrom(formData);
  if (id) await db.delete(pages).where(eq(pages.id, id));
  refreshStore();
  redirect("/admin/sayfalar");
}

/* ---------------- Yorumlar ---------------- */

export async function setReviewApproval(formData: FormData) {
  await requireAdmin();
  const id = idFrom(formData);
  if (!id) return;
  await db.update(reviews).set({ isApproved: formData.get("approve") === "1" }).where(eq(reviews.id, id));
  refreshStore();
  revalidatePath("/admin/yorumlar");
}

export async function deleteReview(formData: FormData) {
  await requireAdmin();
  const id = idFrom(formData);
  if (id) await db.delete(reviews).where(eq(reviews.id, id));
  refreshStore();
  revalidatePath("/admin/yorumlar");
}

/* ---------------- Sipariş durumu ---------------- */

const orderUpdateSchema = z.object({
  status: z.enum(ORDER_STATUSES),
  paymentStatus: z.enum(PAYMENT_STATUSES),
  cargoCompany: z.string().trim().max(60),
  trackingNo: z.string().trim().max(80),
  adminNote: z.string().trim().max(5000),
});

export async function updateOrder(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const id = idFrom(formData);
  const [order] = id ? await db.select().from(orders).where(eq(orders.id, id)).limit(1) : [];
  if (!order) return { ok: false, message: "Sipariş bulunamadı." };

  const parsed = orderUpdateSchema.safeParse({
    status: str(formData, "status"),
    paymentStatus: str(formData, "paymentStatus"),
    cargoCompany: str(formData, "cargoCompany"),
    trackingNo: str(formData, "trackingNo"),
    adminNote: str(formData, "adminNote"),
  });
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
  const d = parsed.data;

  if (order.status === "cancelled" && d.status !== "cancelled") {
    return { ok: false, message: "İptal edilmiş bir sipariş yeniden açılamaz; yeni sipariş oluşturun." };
  }
  if (d.status === "awaiting_payment" && order.status !== "awaiting_payment") {
    return { ok: false, message: "Sipariş 'Ödeme Bekleniyor' durumuna geri alınamaz." };
  }

  const cancelling = d.status === "cancelled" && !order.stockRestored;
  await db.transaction(async (tx) => {
    if (cancelling) {
      await restoreStock(tx, order.id);
      await releaseCoupon(tx, order.couponCode);
    }
    await tx
      .update(orders)
      .set({
        ...d,
        stockRestored: order.stockRestored || d.status === "cancelled",
        paidAt: d.paymentStatus === "paid" && !order.paidAt ? new Date() : order.paidAt,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, order.id));
  });

  after(() => notifyOrderUpdated(order.id, { status: order.status, paymentStatus: order.paymentStatus }));
  refreshStore();
  return {
    ok: true,
    message: cancelling ? "Sipariş iptal edildi, ürün stokları geri eklendi." : "Sipariş güncellendi.",
  };
}

/* ---------------- Ayarlar ---------------- */

const INT_RANGES: Partial<Record<SettingKey, [number, number]>> = {
  cartDiscountPercent: [0, 90],
  logoHeight: [16, 160],
  heroInterval: [2, 60],
  newCount: [1, 48],
  trendCount: [1, 48],
  smtpPort: [1, 65535],
};
const CHOICES: Partial<Record<SettingKey, readonly string[]>> = {
  emailProvider: ["none", "resend", "smtp"],
  fontBody: Object.keys(BODY_FONTS),
  fontLogo: Object.keys(LOGO_FONTS),
};
const EMAIL_KEYS: SettingKey[] = ["emailFromAddress", "adminNotifyEmail"];
const URL_KEYS: SettingKey[] = ["siteUrl", "instagram", "facebook", "tiktok", "youtube", "twitter", "pinterest"];

function validateSetting(key: SettingKey, raw: string): { value: string } | { error: string } {
  let value = raw;
  if (MONEY_KEYS.includes(key)) {
    const kurus = parsePrice(value || "0");
    return kurus == null ? { error: "Geçerli bir tutar girin." } : { value: String(kurus) };
  }
  if (COLOR_KEYS.includes(key)) {
    return HEX_COLOR.test(value) ? { value: value.toLowerCase() } : { error: "Renk #RRGGBB biçiminde olmalı." };
  }
  const range = INT_RANGES[key];
  if (range) {
    const n = Number(value || "0");
    if (!Number.isInteger(n) || n < range[0] || n > range[1]) {
      return { error: `${range[0]} ile ${range[1]} arasında bir tam sayı girin.` };
    }
    return { value: String(n) };
  }
  const choices = CHOICES[key];
  if (choices && !choices.includes(value)) return { error: "Geçersiz seçim." };
  if (EMAIL_KEYS.includes(key) && value && !z.email().safeParse(value).success) {
    return { error: "Geçerli bir e-posta adresi girin." };
  }
  if (URL_KEYS.includes(key) && value) {
    if (!/^https?:\/\/\S+$/i.test(value)) return { error: "Adres http:// veya https:// ile başlamalı." };
    if (key === "siteUrl") value = value.replace(/\/+$/, "");
  }
  if (key === "whatsapp") value = value.replace(/\D/g, "");
  if (key === "iban") value = value.toUpperCase().replace(/\s+/g, " ");
  if (key === "googleAnalyticsId" && value && !/^G-[A-Z0-9]{4,20}$/i.test(value)) {
    return { error: "Ölçüm kimliği G-XXXXXXX biçiminde olmalı." };
  }
  if (key === "metaPixelId" && value && !/^\d{6,20}$/.test(value)) return { error: "Pixel ID yalnızca rakamlardan oluşur." };
  if (key === "homeSections") {
    try {
      const list = JSON.parse(value) as { key: string; enabled: boolean }[];
      if (!Array.isArray(list) || list.some((s) => !(s.key in HOME_SECTIONS))) throw new Error();
      value = JSON.stringify(list.map((s) => ({ key: s.key, enabled: !!s.enabled })));
    } catch {
      return { error: "Bölüm listesi okunamadı." };
    }
  }
  if (key === "infoBar") {
    try {
      const list = JSON.parse(value) as { icon: string; text: string }[];
      if (!Array.isArray(list) || list.length > 6) throw new Error();
      value = JSON.stringify(
        list
          .filter((i) => typeof i.text === "string" && i.text.trim())
          .map((i) => ({ icon: i.icon in INFO_ICONS ? i.icon : "shield", text: i.text.trim().slice(0, 60) })),
      );
    } catch {
      return { error: "Bilgi şeridi okunamadı (en fazla 6 öğe)." };
    }
  }
  return { value };
}

/** Her ayar formu, kaydettiği anahtarları gizli "__keys" alanında listeler. */
export async function saveSettings(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const keys = str(formData, "__keys")
    .split(",")
    .filter((k): k is SettingKey => k in DEFAULT_SETTINGS);
  const rows: { key: string; value: string }[] = [];
  const errors: Record<string, string> = {};

  for (const key of keys) {
    if (BOOLEAN_KEYS.includes(key)) {
      rows.push({ key, value: checkbox(formData, key) ? "1" : "0" });
      continue;
    }
    if (!formData.has(key)) continue;
    const raw = String(formData.get(key) ?? "").trim();
    if (SECRET_KEYS.includes(key)) {
      // Boş bırakılan gizli alan mevcut değeri korur; "temizle" işaretliyse silinir.
      if (checkbox(formData, `${key}__clear`)) rows.push({ key, value: "" });
      else if (raw) rows.push({ key, value: raw });
      continue;
    }
    const result = validateSetting(key, raw);
    if ("error" in result) errors[key] = result.error;
    else rows.push({ key, value: result.value });
  }

  if (Object.keys(errors).length) return { ok: false, errors, message: "Lütfen işaretli alanları kontrol edin." };

  if (keys.includes("paymentBankTransfer") || keys.includes("paymentCashOnDelivery")) {
    const current = await getSettings();
    const next = { ...current, ...Object.fromEntries(rows.map((r) => [r.key, r.value])) };
    if (enabledBuiltinMethods(next).length === 0 && (await getEnabledProviders()).length === 0) {
      return { ok: false, message: "En az bir ödeme yöntemi aktif olmalı." };
    }
  }

  if (rows.length) {
    await db
      .insert(settings)
      .values(rows)
      .onConflictDoUpdate({ target: settings.key, set: { value: sql`excluded.value` } });
  }
  refreshStore();
  return { ok: true, message: "Ayarlar kaydedildi." };
}
