"use client";

import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { saveSettings } from "@/lib/actions/admin";
import { saveProviderSettings, sendTestEmail } from "@/lib/actions/admin-payments";
import { kurusToInput } from "@/lib/format";
import type { ProviderField } from "@/lib/payments/types";
import {
  BODY_FONTS,
  DEFAULT_SETTINGS,
  HOME_SECTIONS,
  INFO_ICONS,
  type InfoIcon,
  type InfoItem,
  LOGO_FONTS,
  parseHomeSections,
  parseInfoBar,
  type SettingKey,
  type Settings,
} from "@/lib/settings-shared";
import { ColorField } from "./color-field";
import { FormMessage, SubmitButton, useAdminAction } from "./form-client";
import { ImageUploader } from "./image-uploader";
import { btnSecondary, Card, Field, inputBase, inputCls, textareaCls, Toggle } from "./ui";

type Errors = Record<string, string>;
type SecretsSet = Partial<Record<SettingKey, boolean>>;

/** Ayar formu kabuğu: kaydedilecek anahtarları bildirir, alt çubukta kaydet düğmesi gösterir. */
function SettingsForm({
  keys,
  children,
}: {
  keys: SettingKey[];
  children: (errors: Errors) => React.ReactNode;
}) {
  const { state, onSubmit, pending } = useAdminAction(saveSettings);
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <input type="hidden" name="__keys" value={keys.join(",")} />
      {children(state.errors ?? {})}
      <div className="sticky bottom-0 z-10 -mx-4 flex flex-wrap items-center justify-end gap-4 border-t border-zinc-200 bg-zinc-50/95 px-4 py-3 backdrop-blur lg:-mx-8 lg:px-8">
        <FormMessage state={state} />
        <SubmitButton pending={pending}>Kaydet</SubmitButton>
      </div>
    </form>
  );
}

function Text({
  s,
  name,
  label,
  hint,
  errors,
  placeholder,
  rows,
  className,
}: {
  s: Settings;
  name: SettingKey;
  label: string;
  hint?: React.ReactNode;
  errors: Errors;
  placeholder?: string;
  rows?: number;
  className?: string;
}) {
  return (
    <Field label={label} hint={hint} error={errors[name]} className={className}>
      {rows ? (
        <textarea name={name} rows={rows} defaultValue={s[name]} placeholder={placeholder} className={textareaCls} />
      ) : (
        <input name={name} defaultValue={s[name]} placeholder={placeholder} className={inputCls} />
      )}
    </Field>
  );
}

function Money({ s, name, label, hint, errors }: { s: Settings; name: SettingKey; label: string; hint?: string; errors: Errors }) {
  return (
    <Field label={label} hint={hint} error={errors[name]}>
      <input name={name} defaultValue={kurusToInput(Number(s[name]))} inputMode="decimal" className={inputCls} />
    </Field>
  );
}

function Secret({
  name,
  label,
  isSet,
  hint,
}: {
  name: string;
  label: string;
  isSet?: boolean;
  hint?: string;
}) {
  return (
    <Field label={label} hint={hint}>
      <input
        name={name}
        type="password"
        autoComplete="new-password"
        placeholder={isSet ? "•••••••• kayıtlı — değiştirmek için yeni değer girin" : ""}
        className={inputCls}
      />
      {isSet && (
        <label className="mt-1.5 flex items-center gap-2 text-xs text-zinc-500">
          <input type="checkbox" name={name.startsWith("config.") ? name.replace("config.", "clear.") : `${name}__clear`} />
          Kayıtlı değeri sil
        </label>
      )}
    </Field>
  );
}

/* ---------------- Genel ---------------- */

export function GeneralSettingsForm({ settings: s }: { settings: Settings }) {
  const keys: SettingKey[] = [
    "storeName", "logoText", "tagline", "metaDescription", "siteUrl",
    "phone", "email", "whatsapp", "workingHours",
    "instagram", "facebook", "tiktok", "youtube", "twitter", "pinterest",
  ];
  return (
    <SettingsForm keys={keys}>
      {(e) => (
        <>
          <Card title="Mağaza">
            <div className="grid gap-4 sm:grid-cols-2">
              <Text s={s} name="storeName" label="Mağaza adı" hint="Sekme başlığı ve e-postalarda görünür." errors={e} />
              <Text s={s} name="logoText" label="Logo yazısı" hint="Görsel logo yüklenmediğinde gösterilir." errors={e} />
              <Text s={s} name="tagline" label="Slogan" errors={e} />
              <Text
                s={s}
                name="siteUrl"
                label="Site adresi"
                placeholder="https://www.magazaniz.com"
                hint="E-posta linkleri, sitemap ve ödeme dönüşleri için. Boşsa istek adresinden bulunur."
                errors={e}
              />
              <Text s={s} name="metaDescription" label="Arama motoru açıklaması" rows={2} errors={e} className="sm:col-span-2" />
            </div>
          </Card>
          <Card title="İletişim">
            <div className="grid gap-4 sm:grid-cols-2">
              <Text s={s} name="whatsapp" label="WhatsApp numarası" hint="Ülke koduyla, örn. 905321234567" errors={e} />
              <Text s={s} name="phone" label="Telefon" errors={e} />
              <Text s={s} name="email" label="E-posta" errors={e} />
              <Text s={s} name="workingHours" label="Çalışma saatleri" rows={2} errors={e} />
            </div>
          </Card>
          <Card title="Sosyal medya" description="Boş bırakılan hesaplar footer'da gösterilmez.">
            <div className="grid gap-4 sm:grid-cols-2">
              <Text s={s} name="instagram" label="Instagram" placeholder="https://instagram.com/..." errors={e} />
              <Text s={s} name="facebook" label="Facebook" placeholder="https://facebook.com/..." errors={e} />
              <Text s={s} name="tiktok" label="TikTok" placeholder="https://tiktok.com/@..." errors={e} />
              <Text s={s} name="youtube" label="YouTube" placeholder="https://youtube.com/@..." errors={e} />
              <Text s={s} name="twitter" label="X (Twitter)" placeholder="https://x.com/..." errors={e} />
              <Text s={s} name="pinterest" label="Pinterest" placeholder="https://pinterest.com/..." errors={e} />
            </div>
          </Card>
        </>
      )}
    </SettingsForm>
  );
}

/* ---------------- Görünüm ---------------- */

const COLOR_FIELDS: { key: SettingKey; label: string; hint: string }[] = [
  { key: "colorPrimary", label: "Ana renk", hint: "Butonlar, rozetler, seçili beden." },
  { key: "colorPrimaryText", label: "Ana renk üzerindeki yazı", hint: "Buton yazıları." },
  { key: "colorHover", label: "Buton üzerine gelince", hint: "Sepete Ekle hover rengi." },
  { key: "colorBadge", label: "Sepet sayacı / kampanya rengi", hint: "Vurgulu menü, kampanya bannerı." },
  { key: "colorAccent", label: "Sepetteki fiyat rengi", hint: "İndirimli fiyat vurgusu." },
  { key: "colorAnnouncementBg", label: "Duyuru bandı zemin", hint: "En üstteki kayan bant." },
  { key: "colorAnnouncementText", label: "Duyuru bandı yazı", hint: "" },
];

export function AppearanceSettingsForm({ settings: s }: { settings: Settings }) {
  const keys: SettingKey[] = [
    "logoUrl", "logoHeight", "faviconUrl", "ogImageUrl", "fontBody", "fontLogo",
    ...COLOR_FIELDS.map((c) => c.key),
  ];
  return (
    <SettingsForm keys={keys}>
      {(e) => (
        <>
          <Card title="Logo ve ikonlar">
            <div className="grid gap-6 md:grid-cols-3">
              <Field label="Logo" hint="Şeffaf PNG önerilir. Yüklenmezse logo yazısı kullanılır.">
                <ImageUploader name="logoUrl" initial={s.logoUrl ? [s.logoUrl] : []} multiple={false} aspect="aspect-[3/1]" fit="contain" accept="image/png,image/webp,image/jpeg" label="Logo yükle" />
              </Field>
              <Field label="Favicon (sekme ikonu)" hint="Kare PNG, en az 192×192. Yüklenmezse baş harften üretilir.">
                <ImageUploader name="faviconUrl" initial={s.faviconUrl ? [s.faviconUrl] : []} multiple={false} aspect="aspect-square" fit="contain" accept="image/png,image/webp" label="İkon yükle" convert={false} />
              </Field>
              <Field label="Paylaşım görseli" hint="Linkler sosyal medyada paylaşıldığında görünür (1200×630).">
                <ImageUploader name="ogImageUrl" initial={s.ogImageUrl ? [s.ogImageUrl] : []} multiple={false} aspect="aspect-[1200/630]" label="Görsel yükle" convert={false} />
              </Field>
            </div>
            <Field label="Logo yüksekliği (px)" hint="Masaüstü header'da en fazla 64px gösterilir." error={e.logoHeight} className="mt-4 max-w-40">
              <input name="logoHeight" type="number" min={16} max={160} defaultValue={s.logoHeight} className={inputCls} />
            </Field>
          </Card>

          <Card title="Renkler">
            <div className="grid gap-5 sm:grid-cols-2">
              {COLOR_FIELDS.map((c) => (
                <Field key={c.key} label={c.label} hint={c.hint || undefined} error={e[c.key]}>
                  <ColorField name={c.key} defaultValue={s[c.key]} resetTo={DEFAULT_SETTINGS[c.key]} />
                </Field>
              ))}
            </div>
          </Card>

          <Card title="Yazı tipleri">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Metin yazı tipi" error={e.fontBody}>
                <select name="fontBody" defaultValue={s.fontBody} className={inputCls}>
                  {Object.entries(BODY_FONTS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Logo yazı tipi" hint="Görsel logo yüklüyse yalnızca banner'larda kullanılır." error={e.fontLogo}>
                <select name="fontLogo" defaultValue={s.fontLogo} className={inputCls}>
                  {Object.entries(LOGO_FONTS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <div className="mt-4 grid gap-3 rounded-md bg-zinc-50 p-4 sm:grid-cols-2">
              {Object.entries(BODY_FONTS).map(([key, label]) => (
                <p key={key} style={{ fontFamily: `var(--font-${key})` }} className="text-sm">
                  {label}: Şık ve rahat modanın adresi
                </p>
              ))}
              {Object.entries(LOGO_FONTS).map(([key, label]) => (
                <p key={key} style={{ fontFamily: `var(--font-${key})` }} className="text-xl tracking-[0.16em]">
                  {label}: {s.logoText}
                </p>
              ))}
            </div>
          </Card>
        </>
      )}
    </SettingsForm>
  );
}

/* ---------------- Anasayfa ---------------- */

function SectionsEditor({ initial }: { initial: Settings["homeSections"] }) {
  const [list, setList] = useState(() => parseHomeSections({ homeSections: initial }));
  const move = (i: number, dir: -1 | 1) =>
    setList((prev) => {
      const next = [...prev];
      const j = i + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  return (
    <div>
      <input type="hidden" name="homeSections" value={JSON.stringify(list)} />
      <ul className="divide-y divide-zinc-100 rounded-md border border-zinc-200">
        {list.map((section, i) => (
          <li key={section.key} className="flex items-center gap-3 px-3 py-2">
            <span className="w-5 text-xs text-zinc-400">{i + 1}</span>
            <label className="flex flex-1 items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={section.enabled}
                onChange={(ev) =>
                  setList((prev) => prev.map((x) => (x.key === section.key ? { ...x, enabled: ev.target.checked } : x)))
                }
                className="accent-zinc-900"
              />
              <span className={section.enabled ? "" : "text-zinc-400 line-through"}>{HOME_SECTIONS[section.key]}</span>
            </label>
            <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Yukarı taşı" className="rounded p-1 hover:bg-zinc-100 disabled:opacity-30">
              <ArrowUp className="size-4" />
            </button>
            <button type="button" onClick={() => move(i, 1)} disabled={i === list.length - 1} aria-label="Aşağı taşı" className="rounded p-1 hover:bg-zinc-100 disabled:opacity-30">
              <ArrowDown className="size-4" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function InfoBarEditor({ initial }: { initial: Settings["infoBar"] }) {
  const [items, setItems] = useState<InfoItem[]>(() => parseInfoBar({ infoBar: initial }));
  const update = (i: number, patch: Partial<InfoItem>) =>
    setItems((prev) => prev.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  return (
    <div className="space-y-2">
      <input type="hidden" name="infoBar" value={JSON.stringify(items)} />
      {items.map((item, i) => (
        <div key={i} className="flex gap-2">
          <select value={item.icon} onChange={(ev) => update(i, { icon: ev.target.value as InfoIcon })} className={`${inputBase} w-44`}>
            {Object.entries(INFO_ICONS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
          <input value={item.text} onChange={(ev) => update(i, { text: ev.target.value })} maxLength={60} className={`${inputBase} min-w-0 flex-1`} />
          <button type="button" onClick={() => setItems((prev) => prev.filter((_, j) => j !== i))} aria-label="Kaldır" className="rounded-md px-2 text-zinc-400 hover:bg-red-50 hover:text-red-600">
            <Trash2 className="size-4" />
          </button>
        </div>
      ))}
      {items.length < 6 && (
        <button type="button" onClick={() => setItems((prev) => [...prev, { icon: "shield", text: "" }])} className={btnSecondary}>
          <Plus className="size-4" /> Öğe ekle
        </button>
      )}
    </div>
  );
}

export function HomeSettingsForm({ settings: s }: { settings: Settings }) {
  const keys: SettingKey[] = [
    "homeSections", "heroInterval", "newTitle", "newCount", "trendTitle", "trendCount",
    "reviewsTitle", "newsletterTitle", "newsletterText", "infoBar",
  ];
  return (
    <SettingsForm keys={keys}>
      {(e) => (
        <>
          <Card title="Bölüm sırası" description="Anasayfada gösterilecek bölümleri seçin ve sıralayın. Banner içerikleri Bannerlar menüsünden yönetilir.">
            <SectionsEditor initial={s.homeSections} />
            {e.homeSections && <p className="mt-2 text-xs text-red-600">{e.homeSections}</p>}
          </Card>
          <Card title="Bölüm ayarları">
            <div className="grid gap-4 sm:grid-cols-2">
              <Text s={s} name="newTitle" label="Yeni ürünler başlığı" errors={e} />
              <Field label="Yeni ürünler adedi" error={e.newCount}>
                <input name="newCount" type="number" min={1} max={48} defaultValue={s.newCount} className={inputCls} />
              </Field>
              <Text s={s} name="trendTitle" label="İndirim trendleri başlığı" errors={e} />
              <Field label="İndirim trendleri adedi" error={e.trendCount}>
                <input name="trendCount" type="number" min={1} max={48} defaultValue={s.trendCount} className={inputCls} />
              </Field>
              <Text s={s} name="reviewsTitle" label="Yorumlar başlığı" hint="Boş bırakılabilir." errors={e} />
              <Field label="Slider geçiş süresi (saniye)" error={e.heroInterval}>
                <input name="heroInterval" type="number" min={2} max={60} defaultValue={s.heroInterval} className={inputCls} />
              </Field>
              <Text s={s} name="newsletterTitle" label="E-bülten başlığı" errors={e} />
              <Text s={s} name="newsletterText" label="E-bülten açıklaması" errors={e} />
            </div>
          </Card>
          <Card title="Bilgi şeridi" description="Footer'ın üstündeki ikonlu kısa bilgiler (en fazla 6).">
            <InfoBarEditor initial={s.infoBar} />
            {e.infoBar && <p className="mt-2 text-xs text-red-600">{e.infoBar}</p>}
          </Card>
        </>
      )}
    </SettingsForm>
  );
}

/* ---------------- Metinler ---------------- */

export function TextsSettingsForm({ settings: s }: { settings: Settings }) {
  const keys: SettingKey[] = [
    "announcement", "announcementLink", "cartPriceLabel", "whatsappMessage",
    "footerCol1Title", "footerCol2Title", "footerCol3Title", "footerCol4Title",
    "orderSuccessTitle", "orderSuccessText", "secureText",
  ];
  return (
    <SettingsForm keys={keys}>
      {(e) => (
        <>
          <Card title="Duyuru bandı" description="Sitenin en üstündeki kayan bant. Metin boşsa bant gizlenir.">
            <div className="grid gap-4 sm:grid-cols-2">
              <Text s={s} name="announcement" label="Duyuru metni" errors={e} />
              <Text s={s} name="announcementLink" label="Bağlantı" placeholder="/kategori/yeni-gelenler" errors={e} />
            </div>
          </Card>
          <Card title="Ürün sayfası">
            <div className="grid gap-4 sm:grid-cols-2">
              <Text s={s} name="cartPriceLabel" label="Sepet indirimi etiketi" hint="Ürün kartlarındaki 'Sepetteki Fiyat' yazısı." errors={e} />
              <Text
                s={s}
                name="whatsappMessage"
                label="WhatsApp sipariş mesajı"
                rows={3}
                hint="Kullanılabilir: {urun} {beden} {kod} {link}"
                errors={e}
              />
            </div>
          </Card>
          <Card title="Footer">
            <div className="grid gap-4 sm:grid-cols-2">
              <Text s={s} name="footerCol1Title" label="1. sütun başlığı" errors={e} />
              <Text s={s} name="footerCol2Title" label="2. sütun başlığı" errors={e} />
              <Text s={s} name="footerCol3Title" label="3. sütun başlığı" errors={e} />
              <Text s={s} name="footerCol4Title" label="4. sütun başlığı" errors={e} />
              <Text s={s} name="secureText" label="Güvenlik metni" errors={e} className="sm:col-span-2" />
            </div>
          </Card>
          <Card title="Sipariş onay sayfası">
            <div className="grid gap-4">
              <Text s={s} name="orderSuccessTitle" label="Başlık" errors={e} />
              <Text s={s} name="orderSuccessText" label="Açıklama" rows={2} errors={e} />
            </div>
          </Card>
        </>
      )}
    </SettingsForm>
  );
}

/* ---------------- Fiyat & kargo ---------------- */

export function ShippingSettingsForm({ settings: s }: { settings: Settings }) {
  const keys: SettingKey[] = ["cartDiscountPercent", "freeShippingThreshold", "shippingFee"];
  return (
    <SettingsForm keys={keys}>
      {(e) => (
        <Card title="Fiyatlandırma ve kargo">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Sepet indirimi (%)" hint="Tüm ürünlerde 'Sepetteki Fiyat' olarak gösterilir. 0 = kapalı." error={e.cartDiscountPercent}>
              <input name="cartDiscountPercent" type="number" min={0} max={90} defaultValue={s.cartDiscountPercent} className={inputCls} />
            </Field>
            <Money s={s} name="freeShippingThreshold" label="Ücretsiz kargo alt limiti (TL)" hint="0 = her zaman ücretsiz." errors={e} />
            <Money s={s} name="shippingFee" label="Kargo ücreti (TL)" errors={e} />
          </div>
        </Card>
      )}
    </SettingsForm>
  );
}

/* ---------------- SEO & Analitik ---------------- */

export function SeoSettingsForm({ settings: s, siteUrl }: { settings: Settings; siteUrl: string }) {
  const keys: SettingKey[] = ["googleAnalyticsId", "metaPixelId", "googleSiteVerification"];
  return (
    <SettingsForm keys={keys}>
      {(e) => (
        <>
          <Card title="Analitik" description="Kodlar yalnızca ziyaretçi çerez bildirimini kabul ederse yüklenir (KVKK).">
            <div className="grid gap-4 sm:grid-cols-2">
              <Text s={s} name="googleAnalyticsId" label="Google Analytics 4 ölçüm kimliği" placeholder="G-XXXXXXXXXX" errors={e} />
              <Text s={s} name="metaPixelId" label="Meta (Facebook/Instagram) Pixel ID" placeholder="1234567890" errors={e} />
            </div>
          </Card>
          <Card title="Google Search Console">
            <Text
              s={s}
              name="googleSiteVerification"
              label="Doğrulama kodu"
              hint='Search Console → HTML etiketi yöntemindeki content="..." değeri.'
              errors={e}
            />
            <p className="mt-4 rounded-md bg-zinc-50 px-3 py-2 text-[13px] text-zinc-600">
              Site haritası: <span className="font-mono">{siteUrl}/sitemap.xml</span> · Robots: <span className="font-mono">{siteUrl}/robots.txt</span>
              <br />
              Ürün ve kategori bazında SEO başlığı/açıklaması ilgili düzenleme sayfalarından girilir.
            </p>
          </Card>
        </>
      )}
    </SettingsForm>
  );
}

/* ---------------- E-posta ---------------- */

export function EmailSettingsForm({ settings: s, secretsSet }: { settings: Settings; secretsSet: SecretsSet }) {
  const [provider, setProvider] = useState(s.emailProvider);
  const keys: SettingKey[] = [
    "emailProvider", "emailFromName", "emailFromAddress", "adminNotifyEmail",
    "resendApiKey", "smtpHost", "smtpPort", "smtpUser", "smtpPassword", "smtpSecure",
    "notifyCustomerOrder", "notifyAdminOrder", "notifyShipped", "notifyDelivered", "notifyCancelled", "notifyPaid",
  ];
  return (
    <SettingsForm keys={keys}>
      {(e) => (
        <>
          <Card title="Gönderim servisi">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Servis" error={e.emailProvider}>
                <select name="emailProvider" value={provider} onChange={(ev) => setProvider(ev.target.value)} className={inputCls}>
                  <option value="none">Kapalı (e-posta gönderilmez)</option>
                  <option value="resend">Resend (önerilir)</option>
                  <option value="smtp">SMTP (Gmail, Yandex, hosting e-postası...)</option>
                </select>
              </Field>
              <Text s={s} name="adminNotifyEmail" label="Yeni sipariş bildirimi alacak e-posta" hint="Boşsa iletişim e-postası kullanılır." errors={e} />
              <Text s={s} name="emailFromName" label="Gönderen adı" placeholder={s.storeName} errors={e} />
              <Text
                s={s}
                name="emailFromAddress"
                label="Gönderen e-posta adresi"
                placeholder="siparis@magazaniz.com"
                hint="Resend'de doğruladığınız alan adında olmalı."
                errors={e}
              />
            </div>
            <div className={provider === "resend" ? "mt-4" : "hidden"}>
              <Secret name="resendApiKey" label="Resend API anahtarı" isSet={secretsSet.resendApiKey} hint="resend.com → API Keys. RESEND_API_KEY ortam değişkeni de kullanılabilir." />
            </div>
            <div className={provider === "smtp" ? "mt-4 grid gap-4 sm:grid-cols-2" : "hidden"}>
              <Text s={s} name="smtpHost" label="SMTP sunucusu" placeholder="smtp.gmail.com" errors={e} />
              <Field label="Port" error={e.smtpPort}>
                <input name="smtpPort" type="number" defaultValue={s.smtpPort} className={inputCls} />
              </Field>
              <Text s={s} name="smtpUser" label="Kullanıcı adı" errors={e} />
              <Secret name="smtpPassword" label="Şifre" isSet={secretsSet.smtpPassword} hint="Gmail için 'Uygulama şifresi' kullanın." />
              <Toggle name="smtpSecure" label="SSL (port 465)" description="587 portu için kapalı bırakın (STARTTLS)." defaultChecked={s.smtpSecure === "1"} />
            </div>
          </Card>
          <Card title="Bildirimler">
            <div className="grid gap-4 sm:grid-cols-2">
              <Toggle name="notifyCustomerOrder" label="Müşteriye: sipariş alındı" defaultChecked={s.notifyCustomerOrder === "1"} />
              <Toggle name="notifyAdminOrder" label="Size: yeni sipariş geldi" defaultChecked={s.notifyAdminOrder === "1"} />
              <Toggle name="notifyPaid" label="Müşteriye: havale ödemesi onaylandı" defaultChecked={s.notifyPaid === "1"} />
              <Toggle name="notifyShipped" label="Müşteriye: kargoya verildi" defaultChecked={s.notifyShipped === "1"} />
              <Toggle name="notifyDelivered" label="Müşteriye: teslim edildi" defaultChecked={s.notifyDelivered === "1"} />
              <Toggle name="notifyCancelled" label="Müşteriye: sipariş iptal edildi" defaultChecked={s.notifyCancelled === "1"} />
            </div>
          </Card>
        </>
      )}
    </SettingsForm>
  );
}

export function TestEmailForm({ defaultTo }: { defaultTo: string }) {
  const { state, onSubmit, pending } = useAdminAction(sendTestEmail);
  return (
    <form onSubmit={onSubmit} className="flex flex-wrap items-end gap-3">
      <Field label="Alıcı" className="min-w-60 flex-1">
        <input name="to" type="email" defaultValue={defaultTo} className={inputCls} />
      </Field>
      <SubmitButton pending={pending} className={btnSecondary}>
        Test e-postası gönder
      </SubmitButton>
      <div className="w-full">
        <FormMessage state={state} />
      </div>
    </form>
  );
}

/* ---------------- Ödeme ---------------- */

export function PaymentBuiltinForm({ settings: s }: { settings: Settings }) {
  const keys: SettingKey[] = [
    "paymentBankTransfer", "bankTransferText", "bankName", "accountHolder", "iban",
    "paymentCashOnDelivery", "codFee", "codText",
  ];
  return (
    <SettingsForm keys={keys}>
      {(e) => (
        <>
          <Card title="Havale / EFT">
            <div className="space-y-4">
              <Toggle name="paymentBankTransfer" label="Havale / EFT ile ödeme açık" defaultChecked={s.paymentBankTransfer === "1"} />
              <div className="grid gap-4 sm:grid-cols-3">
                <Text s={s} name="bankName" label="Banka adı" errors={e} />
                <Text s={s} name="accountHolder" label="Hesap sahibi" errors={e} />
                <Text s={s} name="iban" label="IBAN" placeholder="TR00 0000 0000 0000 0000 0000 00" errors={e} />
              </div>
              <Text s={s} name="bankTransferText" label="Ödeme sayfasındaki açıklama" rows={2} errors={e} />
            </div>
          </Card>
          <Card title="Kapıda ödeme">
            <div className="space-y-4">
              <Toggle name="paymentCashOnDelivery" label="Kapıda ödeme açık" defaultChecked={s.paymentCashOnDelivery === "1"} />
              <div className="grid gap-4 sm:grid-cols-3">
                <Money s={s} name="codFee" label="Hizmet bedeli (TL)" hint="0 = ücretsiz." errors={e} />
                <Text s={s} name="codText" label="Ödeme sayfasındaki açıklama" errors={e} className="sm:col-span-2" />
              </div>
            </div>
          </Card>
        </>
      )}
    </SettingsForm>
  );
}

export type ProviderFormProps = {
  provider: { id: string; name: string; adminHelp: string; fields: ProviderField[] };
  row: {
    isEnabled: boolean;
    title: string;
    description: string;
    sortOrder: number;
    config: Record<string, string>; // gizli alanlar hariç
    secretsSet: Record<string, boolean>;
  };
  defaults: { title: string; description: string };
  callbackUrl: string;
  envKeys: string[];
};

export function ProviderSettingsForm({ provider, row, defaults, callbackUrl, envKeys }: ProviderFormProps) {
  const { state, onSubmit, pending } = useAdminAction(saveProviderSettings);
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <input type="hidden" name="providerId" value={provider.id} />
      <p className="text-[13px] text-zinc-600">{provider.adminHelp}</p>
      <Toggle name="isEnabled" label="Ödeme sayfasında göster" defaultChecked={row.isEnabled} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Ödeme sayfasındaki başlık">
          <input name="title" defaultValue={row.title} placeholder={defaults.title} className={inputCls} />
        </Field>
        <Field label="Sıra">
          <input name="sortOrder" type="number" defaultValue={row.sortOrder} className={inputCls} />
        </Field>
        <Field label="Açıklama" className="sm:col-span-2">
          <input name="description" defaultValue={row.description} placeholder={defaults.description} className={inputCls} />
        </Field>
        {provider.fields.map((field) =>
          field.type === "secret" ? (
            <Secret key={field.key} name={`config.${field.key}`} label={field.label} isSet={row.secretsSet[field.key]} hint={field.hint} />
          ) : field.type === "select" ? (
            <Field key={field.key} label={field.label} hint={field.hint}>
              <select name={`config.${field.key}`} defaultValue={row.config[field.key] || field.defaultValue} className={inputCls}>
                {field.options?.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </Field>
          ) : (
            <Field key={field.key} label={field.label} hint={field.hint}>
              <input
                name={`config.${field.key}`}
                defaultValue={row.config[field.key] ?? field.defaultValue}
                placeholder={field.placeholder}
                className={inputCls}
              />
            </Field>
          ),
        )}
      </div>
      {provider.fields.length > 0 && (
        <p className="rounded-md bg-zinc-50 px-3 py-2 text-xs text-zinc-600">
          Geri dönüş adresi (otomatik gönderilir): <span className="font-mono">{callbackUrl}</span>
          {envKeys.length > 0 && (
            <>
              <br />
              Ortam değişkeninden okunan ve paneldeki değerin yerine geçen: <b>{envKeys.join(", ")}</b>
            </>
          )}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-4">
        <SubmitButton pending={pending}>Kaydet</SubmitButton>
        <FormMessage state={state} />
      </div>
    </form>
  );
}
