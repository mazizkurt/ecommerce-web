"use client";

import { Star } from "lucide-react";
import { useState } from "react";
import { saveCoupon, saveReview } from "@/lib/actions/admin-marketing";
import { COUPON_TYPE_LABELS } from "@/lib/constants";
import { COUPON_TYPES, type CouponType } from "@/lib/db/schema";
import { kurusToInput } from "@/lib/format";
import { FormMessage, SubmitButton, useAdminAction } from "./form-client";
import { Card, Field, inputCls, textareaCls, Toggle } from "./ui";

export type CouponFormData = {
  id: number;
  code: string;
  description: string;
  type: CouponType;
  value: number;
  minSubtotal: number;
  maxUses: number | null;
  usedCount: number;
  startsAt: string; // datetime-local
  endsAt: string;
  isActive: boolean;
};

export function CouponForm({ coupon }: { coupon: CouponFormData | null }) {
  const { state, onSubmit, pending } = useAdminAction(saveCoupon);
  const [type, setType] = useState<CouponType>(coupon?.type ?? "percent");
  const e = state.errors ?? {};
  const valueDefault =
    coupon == null ? "" : coupon.type === "fixed" ? kurusToInput(coupon.value) : coupon.type === "percent" ? String(coupon.value) : "";

  return (
    <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
      {coupon && <input type="hidden" name="id" value={coupon.id} />}
      <Card title="Kupon">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Kupon kodu" hint="Müşterinin gireceği kod. Büyük harfe çevrilir." error={e.code}>
            <input name="code" defaultValue={coupon?.code} placeholder="HOSGELDIN10" className={`${inputCls} font-mono uppercase`} />
          </Field>
          <Field label="Kupon türü" error={e.type}>
            <select name="type" value={type} onChange={(ev) => setType(ev.target.value as CouponType)} className={inputCls}>
              {COUPON_TYPES.map((t) => (
                <option key={t} value={t}>
                  {COUPON_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </Field>
          {type !== "free_shipping" && (
            <Field label={type === "percent" ? "İndirim oranı (%)" : "İndirim tutarı (TL)"} error={e.value}>
              <input name="value" defaultValue={valueDefault} inputMode="decimal" className={inputCls} />
            </Field>
          )}
          <Field label="En az sepet tutarı (TL)" hint="Sepet indirimi sonrası tutar. 0 = şartsız." error={e.minSubtotal}>
            <input name="minSubtotal" defaultValue={kurusToInput(coupon?.minSubtotal ?? 0)} inputMode="decimal" className={inputCls} />
          </Field>
          <Field label="Açıklama (yalnızca panelde)" className="sm:col-span-2">
            <input name="description" defaultValue={coupon?.description} placeholder="Instagram kampanyası" className={inputCls} />
          </Field>
        </div>
      </Card>
      <div className="space-y-6">
        <Card title="Kullanım ve süre">
          <div className="space-y-4">
            <Field
              label="Toplam kullanım limiti"
              hint={coupon ? `Şu ana kadar ${coupon.usedCount} kez kullanıldı. Boş = sınırsız.` : "Boş = sınırsız."}
              error={e.maxUses}
            >
              <input name="maxUses" type="number" min={1} defaultValue={coupon?.maxUses ?? ""} className={inputCls} />
            </Field>
            <Field label="Başlangıç" error={e.startsAt}>
              <input name="startsAt" type="datetime-local" defaultValue={coupon?.startsAt} className={inputCls} />
            </Field>
            <Field label="Bitiş" error={e.endsAt}>
              <input name="endsAt" type="datetime-local" defaultValue={coupon?.endsAt} className={inputCls} />
            </Field>
            <Toggle name="isActive" label="Aktif" defaultChecked={coupon?.isActive ?? true} />
          </div>
        </Card>
        <FormMessage state={state} />
        <SubmitButton pending={pending}>Kaydet</SubmitButton>
      </div>
    </form>
  );
}

export function AdminReviewForm({
  review,
  products,
}: {
  review: { id: number; productId: number | null; name: string; rating: number; comment: string; isApproved: boolean } | null;
  products: { id: number; name: string }[];
}) {
  const { state, onSubmit, pending } = useAdminAction(saveReview);
  const [rating, setRating] = useState(review?.rating ?? 5);
  const e = state.errors ?? {};
  return (
    <form onSubmit={onSubmit} className="max-w-2xl space-y-4">
      {review && <input type="hidden" name="id" value={review.id} />}
      <input type="hidden" name="rating" value={rating} />
      <Card>
        <div className="space-y-4">
          <Field label="Ürün" hint="Boş bırakılırsa yalnızca anasayfa yorumlarında görünür.">
            <select name="productId" defaultValue={review?.productId ?? ""} className={inputCls}>
              <option value="">— Ürün seçilmedi —</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Müşteri adı" hint="Mağazada baş harfleri gösterilir (Ö** M**)." error={e.name}>
            <input name="name" defaultValue={review?.name} className={inputCls} />
          </Field>
          <div>
            <p className="mb-1.5 text-[13px] font-medium text-zinc-700">Puan</p>
            <div className="flex gap-1 text-amber-500">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" onClick={() => setRating(n)} aria-label={`${n} yıldız`}>
                  <Star className="size-6" fill={n <= rating ? "currentColor" : "none"} />
                </button>
              ))}
            </div>
          </div>
          <Field label="Yorum" error={e.comment}>
            <textarea name="comment" rows={4} defaultValue={review?.comment} className={textareaCls} />
          </Field>
          <Toggle name="isApproved" label="Onaylı (yayında)" defaultChecked={review?.isApproved ?? true} />
        </div>
      </Card>
      <FormMessage state={state} />
      <SubmitButton pending={pending}>Kaydet</SubmitButton>
    </form>
  );
}
