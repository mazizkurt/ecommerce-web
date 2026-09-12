"use server";

import { and, count, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { idFrom, str } from "@/lib/admin-utils";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { sessions, users } from "@/lib/db/schema";
import { type FormState, fieldErrors } from "@/lib/form-utils";
import { hashPassword } from "@/lib/password";

const profileSchema = z.object({
  name: z.string().trim().min(2, "Ad soyad girin.").max(80),
  email: z.email("Geçerli bir e-posta girin."),
  phone: z.string().trim().max(20),
});

async function emailTaken(email: string, exceptId: number) {
  const [u] = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.email, email), ne(users.id, exceptId)))
    .limit(1);
  return !!u;
}

const profileFrom = (fd: FormData) => ({
  name: str(fd, "name"),
  email: str(fd, "email").toLowerCase(),
  phone: str(fd, "phone"),
});

export async function updateCustomer(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const id = idFrom(fd);
  if (!id) return { ok: false, message: "Müşteri bulunamadı." };
  const parsed = profileSchema.safeParse(profileFrom(fd));
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
  if (await emailTaken(parsed.data.email, id)) return { ok: false, errors: { email: "Bu e-posta başka bir hesapta kayıtlı." } };
  await db
    .update(users)
    .set({ ...parsed.data, phone: parsed.data.phone || null })
    .where(eq(users.id, id));
  revalidatePath(`/admin/musteriler/${id}`);
  return { ok: true, message: "Müşteri bilgileri güncellendi." };
}

export async function setUserPassword(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const id = idFrom(fd);
  const password = String(fd.get("password") ?? "");
  if (!id) return { ok: false, message: "Kullanıcı bulunamadı." };
  if (password.length < 8) return { ok: false, errors: { password: "Şifre en az 8 karakter olmalı." } };
  await db.update(users).set({ passwordHash: await hashPassword(password) }).where(eq(users.id, id));
  await db.delete(sessions).where(eq(sessions.userId, id));
  return { ok: true, message: "Şifre güncellendi; kullanıcının açık oturumları kapatıldı." };
}

export async function deleteCustomer(fd: FormData) {
  await requireAdmin();
  const id = idFrom(fd);
  if (!id) return;
  // Siparişler silinmez, yalnızca üyelik bağlantısı kalkar.
  await db.delete(users).where(and(eq(users.id, id), eq(users.role, "customer")));
  redirect("/admin/musteriler");
}

const adminSchema = z.object({
  name: z.string().trim().min(2, "Ad soyad girin.").max(80),
  email: z.email("Geçerli bir e-posta girin."),
  password: z.string().min(8, "Şifre en az 8 karakter olmalı."),
});

export async function createAdmin(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = adminSchema.safeParse({ ...profileFrom(fd), password: String(fd.get("password") ?? "") });
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, parsed.data.email)).limit(1);
  if (existing) return { ok: false, errors: { email: "Bu e-posta ile kayıtlı bir kullanıcı var." } };
  await db.insert(users).values({
    name: parsed.data.name,
    email: parsed.data.email,
    passwordHash: await hashPassword(parsed.data.password),
    role: "admin",
  });
  revalidatePath("/admin/ayarlar/yoneticiler");
  return { ok: true, message: `${parsed.data.email} yönetici olarak eklendi.` };
}

export async function deleteAdmin(fd: FormData) {
  const me = await requireAdmin();
  const id = idFrom(fd);
  if (!id || id === me.id) return;
  const [{ n }] = await db.select({ n: count() }).from(users).where(eq(users.role, "admin"));
  if (n <= 1) return;
  await db.delete(users).where(and(eq(users.id, id), eq(users.role, "admin")));
  revalidatePath("/admin/ayarlar/yoneticiler");
}

export async function updateOwnAccount(_prev: FormState, fd: FormData): Promise<FormState> {
  const me = await requireAdmin();
  const parsed = profileSchema.safeParse(profileFrom(fd));
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
  if (await emailTaken(parsed.data.email, me.id)) {
    return { ok: false, errors: { email: "Bu e-posta başka bir hesapta kayıtlı." } };
  }
  await db
    .update(users)
    .set({ ...parsed.data, phone: parsed.data.phone || null })
    .where(eq(users.id, me.id));
  revalidatePath("/admin", "layout");
  return { ok: true, message: "Hesap bilgileriniz güncellendi." };
}
