"use server";

import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { checkbox, idFrom, parseLocalDateTime, refreshStore, str } from "@/lib/admin-utils";
import { requireAdmin } from "@/lib/auth";
import { normalizeCouponCode } from "@/lib/coupons";
import { db } from "@/lib/db";
import { COUPON_TYPES, coupons, reviews, subscribers } from "@/lib/db/schema";
import { parsePrice } from "@/lib/format";
import { type FormState, fieldErrors } from "@/lib/form-utils";

/* ---------------- Kuponlar ---------------- */

const couponSchema = z.object({
  code: z.string().min(3, "Kod en az 3 karakter olmalı (harf, rakam, - veya _).").max(40),
  description: z.string().trim().max(200),
  type: z.enum(COUPON_TYPES, "Kupon türü seçin."),
  value: z.number("Geçerli bir indirim değeri girin.").int().min(0),
  minSubtotal: z.number().int().min(0),
  maxUses: z.number().int().positive("Kullanım limiti pozitif olmalı.").nullable(),
  startsAt: z.date().nullable(),
  endsAt: z.date().nullable(),
  isActive: z.boolean(),
});

export async function saveCoupon(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const id = idFrom(fd);
  const type = str(fd, "type");
  const rawValue = str(fd, "value");
  const value =
    type === "percent" ? Number.parseInt(rawValue, 10) : type === "fixed" ? parsePrice(rawValue) : 0;
  const maxUses = str(fd, "maxUses");

  const parsed = couponSchema.safeParse({
    code: normalizeCouponCode(str(fd, "code")),
    description: str(fd, "description"),
    type,
    value: value ?? Number.NaN,
    minSubtotal: parsePrice(fd.get("minSubtotal")) ?? 0,
    maxUses: maxUses ? Number(maxUses) : null,
    startsAt: parseLocalDateTime(str(fd, "startsAt")),
    endsAt: parseLocalDateTime(str(fd, "endsAt")),
    isActive: checkbox(fd, "isActive"),
  });
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
  const d = parsed.data;
  if (d.type === "percent" && (d.value < 1 || d.value > 100)) {
    return { ok: false, errors: { value: "Yüzde 1 ile 100 arasında olmalı." } };
  }
  if (d.type === "fixed" && d.value <= 0) return { ok: false, errors: { value: "İndirim tutarı girin." } };
  if (d.startsAt && d.endsAt && d.endsAt <= d.startsAt) {
    return { ok: false, errors: { endsAt: "Bitiş tarihi başlangıçtan sonra olmalı." } };
  }
  const [clash] = await db
    .select({ id: coupons.id })
    .from(coupons)
    .where(id ? and(eq(coupons.code, d.code), ne(coupons.id, id)) : eq(coupons.code, d.code))
    .limit(1);
  if (clash) return { ok: false, errors: { code: "Bu kod zaten kullanılıyor." } };

  if (id) await db.update(coupons).set(d).where(eq(coupons.id, id));
  else await db.insert(coupons).values(d);
  revalidatePath("/admin/kuponlar");
  if (!id) redirect("/admin/kuponlar");
  return { ok: true, message: "Kupon kaydedildi." };
}

export async function deleteCoupon(fd: FormData) {
  await requireAdmin();
  const id = idFrom(fd);
  if (id) await db.delete(coupons).where(eq(coupons.id, id));
  redirect("/admin/kuponlar");
}

/* ---------------- Yorumlar ---------------- */

const reviewSchema = z.object({
  productId: z.number().int().positive().nullable(),
  name: z.string().trim().min(2, "Ad girin.").max(60),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().min(2, "Yorum girin.").max(2000),
  isApproved: z.boolean(),
});

export async function saveReview(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const id = idFrom(fd);
  const parsed = reviewSchema.safeParse({
    productId: Number(fd.get("productId")) || null,
    name: str(fd, "name"),
    rating: Number(fd.get("rating")) || 5,
    comment: str(fd, "comment"),
    isApproved: checkbox(fd, "isApproved"),
  });
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
  if (id) await db.update(reviews).set(parsed.data).where(eq(reviews.id, id));
  else await db.insert(reviews).values(parsed.data);
  refreshStore();
  redirect(`/admin/yorumlar${parsed.data.isApproved ? "?durum=onayli" : ""}`);
}

/* ---------------- Bülten aboneleri ---------------- */

export async function deleteSubscriber(fd: FormData) {
  await requireAdmin();
  const id = idFrom(fd);
  if (id) await db.delete(subscribers).where(eq(subscribers.id, id));
  revalidatePath("/admin/aboneler");
}
