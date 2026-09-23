"use client";

import { useState } from "react";
import { changePassword, saveBanner, saveCategory, savePage, updateOrder } from "@/lib/actions/admin";
import type { FlatCategory } from "@/lib/category-utils";
import {
  BANNER_PLACEMENT_LABELS,
  BANNER_STYLE_LABELS,
  CARGO_COMPANIES,
  ORDER_STATUS_LABELS,
  PAGE_GROUP_LABELS,
  PAYMENT_STATUS_LABELS,
} from "@/lib/constants";
import {
  BANNER_PLACEMENTS,
  BANNER_STYLES,
  type BannerPlacement,
  type BannerStyle,
  ORDER_STATUSES,
  type OrderStatus,
  PAGE_GROUPS,
  type PageGroup,
  PAYMENT_STATUSES,
  type PaymentStatus,
} from "@/lib/db/schema";
import { FormMessage, SubmitButton, useAdminAction } from "./form-client";
import { ImageUploader } from "./image-uploader";
import { Card, Field, inputCls, textareaCls, Toggle } from "./ui";

/* ---------------- Kategori ---------------- */

export function CategoryForm({
  category,
  categories,
}: {
  category: {
    id: number;
    name: string;
    slug: string;
    parentId: number | null;
    sortOrder: number;
    showInMenu: boolean;
    highlight: boolean;
    description: string;
    imageUrl: string;
    metaTitle: string;
  } | null;
  categories: FlatCategory[];
}) {
  const { state, onSubmit, pending } = useAdminAction(saveCategory);
  const e = state.errors ?? {};
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {category && <input type="hidden" name="id" value={category.id} />}
      <Field label="Kategori adı" error={e.name}>
        <input name="name" defaultValue={category?.name} className={inputCls} />
      </Field>
      <Field label="Üst kategori" error={e.parentId}>
        <select name="parentId" defaultValue={category?.parentId ?? ""} className={inputCls}>
          <option value="">— Ana kategori (menüde üst seviye) —</option>
          {categories
            .filter((c) => c.id !== category?.id)
            .map((c) => (
              <option key={c.id} value={c.id}>
                {"— ".repeat(c.depth)}
                {c.name}
              </option>
            ))}
        </select>
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="URL" hint="Boşsa addan üretilir." error={e.slug}>
          <input name="slug" defaultValue={category?.slug} className={inputCls} />
        </Field>
        <Field label="Sıra" hint="Küçük sayı önce gelir.">
          <input name="sortOrder" type="number" defaultValue={category?.sortOrder ?? 0} className={inputCls} />
        </Field>
      </div>
      <Field label="Kategori görseli (isteğe bağlı)" hint="Kategori sayfasının üstünde gösterilir. Önerilen 1920×500.">
        <ImageUploader name="imageUrl" initial={category?.imageUrl ? [category.imageUrl] : []} multiple={false} aspect="aspect-[1920/500]" />
      </Field>
      <Field label="SEO başlığı" hint="Boşsa kategori adı kullanılır.">
        <input name="metaTitle" defaultValue={category?.metaTitle} className={inputCls} />
      </Field>
      <Field label="SEO açıklaması">
        <textarea name="description" rows={2} defaultValue={category?.description} className={textareaCls} />
      </Field>
      <Toggle name="showInMenu" label="Menüde göster" defaultChecked={category?.showInMenu ?? true} />
      <Toggle name="highlight" label="Vurgulu (renkli, yanıp sönen)" description="Kampanya kategorileri için." defaultChecked={category?.highlight} />
      <FormMessage state={state} />
      <SubmitButton pending={pending}>{category ? "Kaydet" : "Kategori ekle"}</SubmitButton>
    </form>
  );
}

/* ---------------- Banner ---------------- */

export function BannerForm({
  banner,
}: {
  banner: {
    id: number;
    placement: BannerPlacement;
    style: BannerStyle;
    title: string;
    subtitle: string;
    buttonText: string;
    link: string;
    imageUrl: string;
    mobileImageUrl: string;
    videoUrl: string;
    sortOrder: number;
    isActive: boolean;
  } | null;
}) {
  const { state, onSubmit, pending } = useAdminAction(saveBanner);
  const [placement, setPlacement] = useState<BannerPlacement>(banner?.placement ?? "hero");
  const e = state.errors ?? {};
  const desktopHint = placement === "category" ? "Önerilen: 800×1200 (dikey 2:3)" : "Önerilen: 1920×896 (yatay)";

  return (
    <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
      {banner && <input type="hidden" name="id" value={banner.id} />}
      <div className="space-y-6">
        <Card title="Görseller">
          <div className="space-y-5">
            <Field label="Masaüstü görseli" hint={desktopHint} error={e.imageUrl}>
              <ImageUploader
                name="imageUrl"
                initial={banner?.imageUrl ? [banner.imageUrl] : []}
                multiple={false}
                aspect={placement === "category" ? "aspect-[2/3]" : "aspect-[1920/896]"}
              />
            </Field>
            {placement !== "category" && (
              <Field label="Mobil görseli (isteğe bağlı)" hint="Önerilen: 900×1100. Boşsa masaüstü görseli kullanılır.">
                <ImageUploader name="mobileImageUrl" initial={banner?.mobileImageUrl ? [banner.mobileImageUrl] : []} multiple={false} aspect="aspect-[9/11]" />
              </Field>
            )}
            {placement === "hero" && (
              <Field label="Video (isteğe bağlı, MP4)" hint="Video eklenirse görsel yerine sessiz ve otomatik oynatılır; görsel kapak olarak kullanılır. iPhone uyumu için MP4 (H.264), 8 MB altı ve web için optimize edilmiş (faststart) olmalı.">
                <ImageUploader
                  name="videoUrl"
                  initial={banner?.videoUrl ? [banner.videoUrl] : []}
                  multiple={false}
                  accept="video/mp4,video/webm"
                  aspect="aspect-video"
                  label="Video yükle"
                />
              </Field>
            )}
          </div>
        </Card>
        <Card title="Yazılar ve bağlantı">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Başlık" hint="Görselde yazı varsa boş bırakın veya stili 'Sadece görsel' yapın.">
              <input name="title" defaultValue={banner?.title} className={inputCls} />
            </Field>
            <Field label="Alt başlık">
              <input name="subtitle" defaultValue={banner?.subtitle} className={inputCls} />
            </Field>
            <Field label="Buton yazısı">
              <input name="buttonText" defaultValue={banner?.buttonText} placeholder="Hemen Keşfet" className={inputCls} />
            </Field>
            <Field label="Bağlantı" hint="Örn. /kategori/elbise">
              <input name="link" defaultValue={banner?.link} className={inputCls} />
            </Field>
          </div>
        </Card>
      </div>
      <div className="space-y-6">
        <Card title="Yerleşim">
          <div className="space-y-4">
            <Field label="Konum">
              <select name="placement" value={placement} onChange={(ev) => setPlacement(ev.target.value as BannerPlacement)} className={inputCls}>
                {BANNER_PLACEMENTS.map((p) => (
                  <option key={p} value={p}>
                    {BANNER_PLACEMENT_LABELS[p]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Yazı stili">
              <select name="style" defaultValue={banner?.style ?? "auto"} className={inputCls}>
                {BANNER_STYLES.map((s) => (
                  <option key={s} value={s}>
                    {BANNER_STYLE_LABELS[s]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Sıra">
              <input name="sortOrder" type="number" defaultValue={banner?.sortOrder ?? 0} className={inputCls} />
            </Field>
            <Toggle name="isActive" label="Yayında" defaultChecked={banner?.isActive ?? true} />
          </div>
        </Card>
        <FormMessage state={state} />
        <SubmitButton pending={pending}>Kaydet</SubmitButton>
      </div>
    </form>
  );
}

/* ---------------- Sayfa ---------------- */

export function PageForm({
  page,
}: {
  page: { id: number; title: string; slug: string; content: string; footerGroup: PageGroup; sortOrder: number } | null;
}) {
  const { state, onSubmit, pending } = useAdminAction(savePage);
  const e = state.errors ?? {};
  return (
    <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
      {page && <input type="hidden" name="id" value={page.id} />}
      <Card>
        <div className="space-y-4">
          <Field label="Başlık" error={e.title}>
            <input name="title" defaultValue={page?.title} className={inputCls} />
          </Field>
          <Field label="İçerik" hint='Paragrafları boş bir satırla ayırın. "## " ile başlayan satır ara başlık olur.'>
            <textarea name="content" rows={20} defaultValue={page?.content} className={`${textareaCls} font-mono text-[13px]`} />
          </Field>
        </div>
      </Card>
      <div className="space-y-6">
        <Card title="Ayarlar">
          <div className="space-y-4">
            <Field label="URL" hint="Boşsa başlıktan üretilir." error={e.slug}>
              <input name="slug" defaultValue={page?.slug} className={inputCls} />
            </Field>
            <Field label="Footer konumu">
              <select name="footerGroup" defaultValue={page?.footerGroup ?? "kurumsal"} className={inputCls}>
                {PAGE_GROUPS.map((g) => (
                  <option key={g} value={g}>
                    {PAGE_GROUP_LABELS[g]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Sıra">
              <input name="sortOrder" type="number" defaultValue={page?.sortOrder ?? 0} className={inputCls} />
            </Field>
          </div>
        </Card>
        <FormMessage state={state} />
        <SubmitButton pending={pending}>Kaydet</SubmitButton>
      </div>
    </form>
  );
}

/* ---------------- Sipariş durumu ---------------- */

export function OrderUpdateForm({
  order,
}: {
  order: {
    id: number;
    status: OrderStatus;
    paymentStatus: PaymentStatus;
    cargoCompany: string;
    trackingNo: string;
    adminNote: string;
  };
}) {
  const { state, onSubmit, pending } = useAdminAction(updateOrder);
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <input type="hidden" name="id" value={order.id} />
      <Field label="Sipariş durumu">
        <select name="status" defaultValue={order.status} className={inputCls}>
          {ORDER_STATUSES.filter((s) => s !== "awaiting_payment" || order.status === "awaiting_payment").map((s) => (
            <option key={s} value={s}>
              {ORDER_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Ödeme durumu">
        <select name="paymentStatus" defaultValue={order.paymentStatus} className={inputCls}>
          {PAYMENT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {PAYMENT_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Kargo firması">
        <input name="cargoCompany" list="cargo-companies" defaultValue={order.cargoCompany} className={inputCls} />
        <datalist id="cargo-companies">
          {CARGO_COMPANIES.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </Field>
      <Field label="Kargo takip no">
        <input name="trackingNo" defaultValue={order.trackingNo} className={inputCls} />
      </Field>
      <Field label="Yönetici notu" hint="Müşteri görmez.">
        <textarea name="adminNote" rows={4} defaultValue={order.adminNote} className={textareaCls} />
      </Field>
      <FormMessage state={state} />
      <SubmitButton pending={pending}>Güncelle</SubmitButton>
    </form>
  );
}

/* ---------------- Şifre ---------------- */

export function PasswordForm() {
  const { state, onSubmit, pending } = useAdminAction(changePassword);
  const e = state.errors ?? {};
  return (
    <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-3">
      <Field label="Mevcut şifre" error={e.current}>
        <input name="current" type="password" autoComplete="current-password" className={inputCls} />
      </Field>
      <Field label="Yeni şifre" error={e.next}>
        <input name="next" type="password" autoComplete="new-password" className={inputCls} />
      </Field>
      <Field label="Yeni şifre (tekrar)" error={e.confirm}>
        <input name="confirm" type="password" autoComplete="new-password" className={inputCls} />
      </Field>
      <div className="flex items-center gap-4 sm:col-span-3">
        <SubmitButton pending={pending}>Şifreyi değiştir</SubmitButton>
        <FormMessage state={state} />
      </div>
    </form>
  );
}
