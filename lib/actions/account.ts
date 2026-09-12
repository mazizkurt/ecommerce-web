"use server";

import { createHash, randomBytes } from "node:crypto";
import { and, eq, gt, isNull } from "drizzle-orm";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { z } from "zod";
import { createSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { passwordResets, sessions, users } from "@/lib/db/schema";
import { emailConfigured } from "@/lib/email";
import { type FormState, fieldErrors } from "@/lib/form-utils";
import { sendPasswordReset } from "@/lib/notifications";
import { hashPassword } from "@/lib/password";
import { siteOrigin } from "@/lib/request";
import { getSettings } from "@/lib/settings";

const sha256 = (v: string) => createHash("sha256").update(v).digest("hex");

export async function requestPasswordReset(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!z.email().safeParse(email).success) {
    return { ok: false, message: "Geçerli bir e-posta adresi girin.", values: { email } };
  }
  const settings = await getSettings();
  if (!emailConfigured(settings)) {
    return {
      ok: false,
      message: `Şu anda şifre sıfırlama e-postası gönderilemiyor. Lütfen bizimle iletişime geçin${settings.phone ? `: ${settings.phone}` : "."}`,
    };
  }

  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (user) {
    const token = randomBytes(32).toString("base64url");
    await db.insert(passwordResets).values({
      id: sha256(token),
      userId: user.id,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    });
    const link = `${await siteOrigin(settings)}/sifre-sifirla?token=${token}`;
    after(() => sendPasswordReset({ email: user.email, name: user.name }, link));
  }
  // Hesabın var olup olmadığını belli etmemek için her durumda aynı mesaj.
  return {
    ok: true,
    message: "Bu e-posta ile kayıtlı bir hesap varsa şifre sıfırlama bağlantısı gönderildi. Gelen kutunuzu (ve istenmeyen klasörünü) kontrol edin.",
  };
}

const resetSchema = z
  .object({
    token: z.string().min(10),
    password: z.string().min(8, "Şifre en az 8 karakter olmalı.").max(100),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, { message: "Şifreler eşleşmiyor.", path: ["confirm"] });

export async function resetPassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = resetSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };

  const [reset] = await db
    .select()
    .from(passwordResets)
    .where(
      and(
        eq(passwordResets.id, sha256(parsed.data.token)),
        isNull(passwordResets.usedAt),
        gt(passwordResets.expiresAt, new Date()),
      ),
    )
    .limit(1);
  if (!reset) {
    return { ok: false, message: "Bağlantı geçersiz veya süresi dolmuş. Lütfen yeniden şifre sıfırlama isteyin." };
  }

  await db.transaction(async (tx) => {
    await tx
      .update(users)
      .set({ passwordHash: await hashPassword(parsed.data.password) })
      .where(eq(users.id, reset.userId));
    await tx.update(passwordResets).set({ usedAt: new Date() }).where(eq(passwordResets.id, reset.id));
    // Diğer cihazlardaki oturumları kapat.
    await tx.delete(sessions).where(eq(sessions.userId, reset.userId));
  });
  await createSession(reset.userId);
  redirect("/hesabim");
}
