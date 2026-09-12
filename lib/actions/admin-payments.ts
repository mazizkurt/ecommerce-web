"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { checkbox, refreshStore, str } from "@/lib/admin-utils";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { paymentProviders } from "@/lib/db/schema";
import { sendEmail } from "@/lib/email";
import { testEmail } from "@/lib/email/templates";
import type { FormState } from "@/lib/form-utils";
import { getEnabledProviders, getProvider, getProviderRow, resolveConfig } from "@/lib/payments";
import { enabledBuiltinMethods, getSettings } from "@/lib/settings";

export async function saveProviderSettings(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const provider = getProvider(str(fd, "providerId"));
  if (!provider) return { ok: false, message: "Ödeme sağlayıcısı bulunamadı." };

  const row = await getProviderRow(provider.id);
  const config: Record<string, string> = { ...(row?.config ?? {}) };
  for (const field of provider.fields) {
    const value = str(fd, `config.${field.key}`);
    if (field.type === "secret") {
      // Boş bırakılan gizli alan mevcut değeri korur.
      if (checkbox(fd, `clear.${field.key}`)) config[field.key] = "";
      else if (value) config[field.key] = value;
    } else if (field.type === "select") {
      if (field.options?.some((o) => o.value === value)) config[field.key] = value;
    } else {
      config[field.key] = value;
    }
  }

  const isEnabled = checkbox(fd, "isEnabled");
  if (isEnabled && !provider.isConfigured(resolveConfig(provider, config))) {
    return { ok: false, message: "Sağlayıcıyı açmak için zorunlu alanları (API anahtarları) doldurun." };
  }
  if (!isEnabled && row?.isEnabled) {
    const others = (await getEnabledProviders()).filter((p) => p.id !== provider.id);
    if (enabledBuiltinMethods(await getSettings()).length === 0 && others.length === 0) {
      return { ok: false, message: "En az bir ödeme yöntemi aktif kalmalı." };
    }
  }

  const values = {
    isEnabled,
    title: str(fd, "title"),
    description: str(fd, "description"),
    sortOrder: Number(str(fd, "sortOrder")) || 0,
    config,
    updatedAt: new Date(),
  };
  await db
    .insert(paymentProviders)
    .values({ id: provider.id, ...values })
    .onConflictDoUpdate({ target: paymentProviders.id, set: values });
  refreshStore();
  revalidatePath("/admin/odeme");
  return { ok: true, message: `${provider.name} ayarları kaydedildi.` };
}

export async function sendTestEmail(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const s = await getSettings();
  const to = str(fd, "to") || s.adminNotifyEmail || s.email;
  if (!z.email().safeParse(to).success) return { ok: false, message: "Geçerli bir alıcı e-posta adresi girin." };
  const res = await sendEmail({ to, ...testEmail(s), template: "test" }, s);
  revalidatePath("/admin/ayarlar/e-posta");
  return res.ok
    ? { ok: true, message: `Test e-postası ${to} adresine gönderildi.` }
    : { ok: false, message: `Gönderilemedi: ${res.error}` };
}
