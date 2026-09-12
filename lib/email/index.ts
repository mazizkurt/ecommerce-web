import nodemailer from "nodemailer";
import { db } from "@/lib/db";
import { emailLogs } from "@/lib/db/schema";
import { getSettings, type Settings } from "@/lib/settings";

export type EmailMessage = {
  to: string;
  subject: string;
  html: string;
  template: string;
  replyTo?: string;
};

/** Ortam değişkenleri paneldeki gizli değerlerin yerine geçebilir. */
function secrets(s: Settings) {
  return {
    resendApiKey: process.env.RESEND_API_KEY || s.resendApiKey,
    smtpPassword: process.env.SMTP_PASSWORD || s.smtpPassword,
  };
}

export function emailConfigured(s: Settings) {
  if (!s.emailFromAddress) return false;
  if (s.emailProvider === "resend") return !!secrets(s).resendApiKey;
  if (s.emailProvider === "smtp") return !!s.smtpHost;
  return false;
}

async function log(msg: EmailMessage, status: "sent" | "failed" | "skipped", error = "") {
  try {
    await db.insert(emailLogs).values({
      to: msg.to,
      subject: msg.subject,
      template: msg.template,
      status,
      error: error.slice(0, 1000),
    });
  } catch {
    // log yazılamaması e-posta akışını bozmamalı
  }
}

export async function sendEmail(msg: EmailMessage, settingsArg?: Settings) {
  const s = settingsArg ?? (await getSettings());
  if (!emailConfigured(s)) {
    await log(msg, "skipped", "E-posta gönderimi yapılandırılmamış.");
    return { ok: false as const, error: "E-posta gönderimi yapılandırılmamış." };
  }
  const from = s.emailFromName
    ? `"${s.emailFromName.replace(/"/g, "")}" <${s.emailFromAddress}>`
    : s.emailFromAddress;
  const { resendApiKey, smtpPassword } = secrets(s);

  try {
    if (s.emailProvider === "resend") {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${resendApiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from,
          to: [msg.to],
          subject: msg.subject,
          html: msg.html,
          ...(msg.replyTo ? { reply_to: msg.replyTo } : {}),
        }),
        signal: AbortSignal.timeout(15_000),
      });
      if (!res.ok) throw new Error(`Resend ${res.status}: ${(await res.text()).slice(0, 300)}`);
    } else {
      const transporter = nodemailer.createTransport({
        host: s.smtpHost,
        port: Number(s.smtpPort) || 587,
        secure: s.smtpSecure === "1",
        auth: s.smtpUser ? { user: s.smtpUser, pass: smtpPassword } : undefined,
        connectionTimeout: 15_000,
      });
      await transporter.sendMail({
        from,
        to: msg.to,
        subject: msg.subject,
        html: msg.html,
        replyTo: msg.replyTo,
      });
    }
    await log(msg, "sent");
    return { ok: true as const };
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e);
    await log(msg, "failed", error);
    return { ok: false as const, error };
  }
}
