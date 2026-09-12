import { headers } from "next/headers";
import { type Settings, siteUrlFrom } from "./settings";

/** Müşterinin IP adresi (ödeme sağlayıcıları zorunlu tutar). */
export async function clientIp() {
  const h = await headers();
  const raw = (h.get("x-forwarded-for")?.split(",")[0] ?? h.get("x-real-ip") ?? "").trim();
  const ip = raw.replace(/^::ffff:/, "");
  if (!ip || ip === "::1") return "127.0.0.1";
  return ip;
}

/**
 * Sitenin dışarıdan erişilen adresi. Ayarlarda "Site adresi" girildiyse o kullanılır,
 * aksi halde gelen isteğin host bilgisinden üretilir.
 */
export async function siteOrigin(s: Settings) {
  if (s.siteUrl) return siteUrlFrom(s);
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (!host) return siteUrlFrom(s);
  const proto =
    h.get("x-forwarded-proto") ??
    (host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https");
  return `${proto}://${host}`;
}
