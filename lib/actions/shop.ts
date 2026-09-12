"use server";

import { randomBytes } from "node:crypto";
import { and, asc, eq, gte, inArray, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createSession, destroySession, getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  orderItems,
  orders,
  PAYMENT_METHODS,
  productImages,
  products,
  productVariants,
  reviews,
  subscribers,
  users,
} from "@/lib/db/schema";
import { type FormState, fieldErrors, textValues } from "@/lib/form-utils";
import { hashPassword, verifyPassword } from "@/lib/password";
import { calcTotals } from "@/lib/pricing";
import {
  enabledPaymentMethods,
  getSettings,
  pricingFrom,
} from "@/lib/settings";

export type { FormState };

/* ---------------- Bülten ---------------- */

export async function subscribeNewsletter(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = z
    .email()
    .safeParse(String(formData.get("email") ?? "").trim().toLowerCase());
  if (!parsed.success) {
    return { ok: false, message: "Geçerli bir e-posta adresi girin." };
  }
  await db
    .insert(subscribers)
    .values({ email: parsed.data })
    .onConflictDoNothing();
  return { ok: true, message: "Bültenimize kaydoldunuz, teşekkürler!" };
}

/* ---------------- Ürün yorumu ---------------- */

const reviewSchema = z.object({
  productId: z.coerce.number().int().positive(),
  name: z.string().trim().min(2, "Adınızı girin.").max(60),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z
    .string()
    .trim()
    .min(5, "Yorum en az 5 karakter olmalı.")
    .max(1000),
});

export async function submitReview(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = reviewSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, errors: fieldErrors(parsed.error), values: textValues(formData) };
  }
  const [product] = await db
    .select({ id: products.id })
    .from(products)
    .where(eq(products.id, parsed.data.productId))
    .limit(1);
  if (!product) return { ok: false, message: "Ürün bulunamadı." };
  await db.insert(reviews).values({ ...parsed.data, isApproved: false });
  return {
    ok: true,
    message: "Yorumunuz alındı, onaylandıktan sonra yayınlanacaktır. Teşekkürler!",
  };
}

/* ---------------- Sipariş takip ---------------- */

const digits = (s: string) => s.replace(/\D/g, "");

export async function trackOrder(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const orderNo = Number(digits(String(formData.get("orderNo") ?? "")));
  const contact = String(formData.get("contact") ?? "").trim().toLowerCase();
  const values = textValues(formData);
  if (!orderNo || orderNo > 2_147_483_647 || !contact) {
    return { ok: false, message: "Sipariş numarası ve e-posta/telefon girin.", values };
  }
  const [order] = await db
    .select({ token: orders.token, email: orders.email, phone: orders.phone })
    .from(orders)
    .where(eq(orders.orderNo, orderNo))
    .limit(1);
  const phoneMatch =
    digits(contact).length >= 10 &&
    order &&
    digits(order.phone).slice(-10) === digits(contact).slice(-10);
  if (!order || (order.email !== contact && !phoneMatch)) {
    return { ok: false, message: "Sipariş bulunamadı. Bilgileri kontrol edin.", values };
  }
  redirect(`/siparis/${order.token}`);
}

/* ---------------- Üyelik ---------------- */

function safeNext(next: FormDataEntryValue | null) {
  return typeof next === "string" && next.startsWith("/") && !next.startsWith("//")
    ? next
    : "/hesabim";
}

const registerSchema = z.object({
  name: z.string().trim().min(3, "Adınızı ve soyadınızı girin.").max(80),
  email: z.email("Geçerli bir e-posta adresi girin."),
  phone: z.string().trim().max(20).optional(),
  password: z.string().min(8, "Şifre en az 8 karakter olmalı.").max(100),
});

export async function registerCustomer(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const values = textValues(formData);
  const parsed = registerSchema.safeParse({
    ...values,
    email: values.email?.trim().toLowerCase(),
    password: formData.get("password"),
  });
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error), values };

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, parsed.data.email))
    .limit(1);
  if (existing) {
    return {
      ok: false,
      errors: { email: "Bu e-posta ile kayıtlı bir hesap var, giriş yapın." },
      values,
    };
  }
  const [user] = await db
    .insert(users)
    .values({
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone || null,
      passwordHash: await hashPassword(parsed.data.password),
      role: "customer",
    })
    .returning({ id: users.id });
  await createSession(user.id);
  redirect(safeNext(formData.get("next")));
}

export async function loginCustomer(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return { ok: false, message: "E-posta veya şifre hatalı.", values: { email } };
  }
  await createSession(user.id);
  redirect(safeNext(formData.get("next")));
}

export async function logout() {
  await destroySession();
  redirect("/");
}

/* ---------------- Sepet / Ödeme ---------------- */

export type SyncedVariant = {
  variantId: number;
  productId: number;
  slug: string;
  name: string;
  size: string;
  price: number;
  comparePrice: number | null;
  stock: number;
  isActive: boolean;
};

/** Sepetteki ürünlerin güncel fiyat ve stok bilgisini döner. */
export async function syncCart(variantIds: number[]): Promise<SyncedVariant[]> {
  const ids = variantIds.filter((id) => Number.isInteger(id)).slice(0, 50);
  if (ids.length === 0) return [];
  return db
    .select({
      variantId: productVariants.id,
      productId: products.id,
      slug: products.slug,
      name: products.name,
      size: productVariants.size,
      price: products.price,
      comparePrice: products.comparePrice,
      stock: productVariants.stock,
      isActive: products.isActive,
    })
    .from(productVariants)
    .innerJoin(products, eq(products.id, productVariants.productId))
    .where(inArray(productVariants.id, ids));
}

const checkoutSchema = z.object({
  email: z.email("Geçerli bir e-posta adresi girin."),
  phone: z
    .string()
    .trim()
    .refine((v) => digits(v).length >= 10 && digits(v).length <= 13, {
      message: "Geçerli bir telefon numarası girin.",
    }),
  firstName: z.string().trim().min(2, "Adınızı girin.").max(50),
  lastName: z.string().trim().min(2, "Soyadınızı girin.").max(50),
  city: z.string().trim().min(2, "İl seçin."),
  district: z.string().trim().min(2, "İlçe girin.").max(60),
  address: z.string().trim().min(10, "Açık adresinizi girin.").max(500),
  note: z.string().trim().max(500).default(""),
  paymentMethod: z.enum(PAYMENT_METHODS, "Ödeme yöntemi seçin."),
  agreement: z.literal("on", "Sözleşmeleri onaylamanız gerekiyor."),
});

const itemsSchema = z
  .array(
    z.object({
      variantId: z.number().int().positive(),
      quantity: z.number().int().min(1).max(50),
    }),
  )
  .min(1)
  .max(50);

export type CheckoutState = FormState & { token?: string };

class StockError extends Error {}

export async function placeOrder(
  _prev: CheckoutState,
  formData: FormData,
): Promise<CheckoutState> {
  const values = textValues(formData);
  delete values.items;

  let items: z.infer<typeof itemsSchema>;
  try {
    items = itemsSchema.parse(JSON.parse(String(formData.get("items") ?? "[]")));
  } catch {
    return { ok: false, message: "Sepetiniz boş.", values };
  }

  const parsed = checkoutSchema.safeParse({
    ...values,
    email: values.email?.trim().toLowerCase(),
  });
  if (!parsed.success) {
    return {
      ok: false,
      errors: fieldErrors(parsed.error),
      message: "Lütfen işaretli alanları kontrol edin.",
      values,
    };
  }
  const data = parsed.data;
  const settings = await getSettings();
  if (!enabledPaymentMethods(settings).includes(data.paymentMethod)) {
    return { ok: false, message: "Seçilen ödeme yöntemi kullanılamıyor.", values };
  }

  const quantities = new Map<number, number>();
  for (const i of items) {
    quantities.set(i.variantId, (quantities.get(i.variantId) ?? 0) + i.quantity);
  }
  const variantIds = [...quantities.keys()];
  const rows = await db
    .select({
      variantId: productVariants.id,
      productId: products.id,
      name: products.name,
      code: products.code,
      size: productVariants.size,
      price: products.price,
      stock: productVariants.stock,
      isActive: products.isActive,
    })
    .from(productVariants)
    .innerJoin(products, eq(products.id, productVariants.productId))
    .where(inArray(productVariants.id, variantIds));

  const problems: string[] = [];
  for (const id of variantIds) {
    const row = rows.find((r) => r.variantId === id);
    const qty = quantities.get(id)!;
    if (!row || !row.isActive) problems.push("Sepetinizdeki bir ürün artık satışta değil.");
    else if (row.stock < qty)
      problems.push(`${row.name} (${row.size}) için yeterli stok yok (kalan: ${row.stock}).`);
  }
  if (problems.length > 0) {
    return { ok: false, message: problems.join(" "), values };
  }

  const images = await db
    .select({ productId: productImages.productId, url: productImages.url })
    .from(productImages)
    .where(inArray(productImages.productId, rows.map((r) => r.productId)))
    .orderBy(asc(productImages.sortOrder), asc(productImages.id));

  const lines = rows.map((r) => ({
    ...r,
    quantity: quantities.get(r.variantId)!,
    image: images.find((i) => i.productId === r.productId)?.url ?? "",
  }));
  const totals = calcTotals(lines, pricingFrom(settings), data.paymentMethod);
  const user = await getCurrentUser();
  const token = randomBytes(16).toString("hex");

  try {
    await db.transaction(async (tx) => {
      // Varyantları sabit sırayla kilitle: eşzamanlı siparişlerde deadlock oluşmaz.
      for (const l of [...lines].sort((a, b) => a.variantId - b.variantId)) {
        const updated = await tx
          .update(productVariants)
          .set({ stock: sql`${productVariants.stock} - ${l.quantity}` })
          .where(
            and(
              eq(productVariants.id, l.variantId),
              gte(productVariants.stock, l.quantity),
            ),
          )
          .returning({ id: productVariants.id });
        if (updated.length !== 1) {
          throw new StockError(`${l.name} (${l.size}) stokta kalmadı.`);
        }
      }
      const [order] = await tx
        .insert(orders)
        .values({
          token,
          userId: user?.id ?? null,
          email: data.email,
          phone: data.phone,
          firstName: data.firstName,
          lastName: data.lastName,
          city: data.city,
          district: data.district,
          address: data.address,
          note: data.note,
          paymentMethod: data.paymentMethod,
          subtotal: totals.subtotal,
          discount: totals.discount,
          shippingFee: totals.shippingFee,
          paymentFee: totals.paymentFee,
          total: totals.total,
        })
        .returning({ id: orders.id });
      await tx.insert(orderItems).values(
        lines.map((l) => ({
          orderId: order.id,
          productId: l.productId,
          variantId: l.variantId,
          name: l.name,
          code: l.code,
          size: l.size,
          imageUrl: l.image,
          unitPrice: l.price,
          quantity: l.quantity,
        })),
      );
    });
  } catch (error) {
    if (error instanceof StockError) return { ok: false, message: error.message, values };
    throw error;
  }

  // Stoklar değiştiği için mağaza sayfalarını yenile.
  revalidatePath("/", "layout");
  return { ok: true, token };
}
