"use client";

import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { saveProduct } from "@/lib/actions/admin";
import type { FlatCategory } from "@/lib/category-utils";
import { COMMON_SIZES } from "@/lib/constants";
import { formatPrice, kurusToInput, parsePrice } from "@/lib/format";
import { cartPrice } from "@/lib/pricing";
import { ColorField } from "./color-field";
import { FormMessage, SubmitButton, useAdminAction } from "./form-client";
import { ImageUploader } from "./image-uploader";
import { btnSecondary, Card, Field, inputCls, textareaCls, Toggle } from "./ui";

export type ProductFormData = {
  id: number;
  name: string;
  slug: string;
  code: string;
  description: string;
  price: number;
  comparePrice: number | null;
  categoryId: number | null;
  extraCategoryIds: number[];
  isActive: boolean;
  isNew: boolean;
  isTrend: boolean;
  colorName: string;
  colorHex: string;
  groupCode: string;
  metaTitle: string;
  metaDescription: string;
  images: string[];
  variants: { id: number; size: string; stock: number }[];
};

type VariantRow = { key: string; id?: number; size: string; stock: string };

let rowSeq = 0;
const newRow = (size = "", stock = "0"): VariantRow => ({ key: `n${++rowSeq}`, size, stock });

export function ProductForm({
  product,
  categories,
  cartDiscountPercent,
}: {
  product: ProductFormData | null;
  categories: FlatCategory[];
  cartDiscountPercent: number;
}) {
  const { state, onSubmit, pending } = useAdminAction(saveProduct);
  const e = state.errors ?? {};
  const [price, setPrice] = useState(kurusToInput(product?.price));
  const [variants, setVariants] = useState<VariantRow[]>(
    product?.variants.length
      ? product.variants.map((v) => ({ key: `v${v.id}`, id: v.id, size: v.size, stock: String(v.stock) }))
      : [newRow("S", "10"), newRow("M", "10"), newRow("L", "10")],
  );
  const priceKurus = parsePrice(price);

  const updateRow = (key: string, patch: Partial<VariantRow>) =>
    setVariants((rows) => rows.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  return (
    <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
      {product && <input type="hidden" name="id" value={product.id} />}
      <input
        type="hidden"
        name="variants"
        value={JSON.stringify(
          variants.map((v) => ({ id: v.id, size: v.size.trim(), stock: Math.max(0, Number.parseInt(v.stock, 10) || 0) })),
        )}
      />

      <div className="space-y-6">
        <Card title="Ürün bilgileri">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Ürün adı" error={e.name} className="sm:col-span-2">
              <input name="name" defaultValue={product?.name} placeholder="Örn. Kuşaklı Uzun Trençkot - Bej" className={inputCls} />
            </Field>
            <Field label="Ürün kodu" hint="Ürün sayfasında gösterilir." error={e.code}>
              <input name="code" defaultValue={product?.code} className={inputCls} />
            </Field>
            <Field label="URL (isteğe bağlı)" hint="Boş bırakılırsa ürün adından üretilir." error={e.slug}>
              <input name="slug" defaultValue={product?.slug} className={inputCls} />
            </Field>
            <Field label="Açıklama / Ürün özellikleri" hint="Her satır ürün sayfasında ayrı satırda gösterilir." className="sm:col-span-2">
              <textarea name="description" rows={7} defaultValue={product?.description} className={textareaCls} />
            </Field>
          </div>
        </Card>

        <Card title="Görseller" description="İlk görsel kapak olarak kullanılır, ikincisi üzerine gelince gösterilir. Önerilen oran 2:3 (ör. 1000×1500).">
          <ImageUploader name="images" initial={product?.images ?? []} label="Görsel yükle veya sürükle" />
          {e.images && <p className="mt-2 text-xs text-red-600">{e.images}</p>}
        </Card>

        <Card title="Bedenler ve stok">
          <div className="space-y-2">
            <div className="grid grid-cols-[1fr_120px_40px] gap-2 text-xs font-medium text-zinc-500">
              <span>Beden</span>
              <span>Stok adedi</span>
              <span />
            </div>
            {variants.map((v) => (
              <div key={v.key} className="grid grid-cols-[1fr_120px_40px] gap-2">
                <input
                  value={v.size}
                  list="size-options"
                  onChange={(ev) => updateRow(v.key, { size: ev.target.value })}
                  placeholder="S, M, 38, STD..."
                  className={inputCls}
                />
                <input
                  value={v.stock}
                  inputMode="numeric"
                  onChange={(ev) => updateRow(v.key, { stock: ev.target.value.replace(/\D/g, "") })}
                  className={inputCls}
                />
                <button
                  type="button"
                  onClick={() => setVariants((rows) => rows.filter((r) => r.key !== v.key))}
                  aria-label="Bedeni kaldır"
                  className="flex items-center justify-center rounded-md text-zinc-400 hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}
            <datalist id="size-options">
              {COMMON_SIZES.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </div>
          {e.variants && <p className="mt-2 text-xs text-red-600">{e.variants}</p>}
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={() => setVariants((r) => [...r, newRow()])} className={btnSecondary}>
              <Plus className="size-4" /> Beden ekle
            </button>
            <button
              type="button"
              onClick={() => setVariants([newRow("STD", "10")])}
              className={btnSecondary}
            >
              Standart beden
            </button>
          </div>
        </Card>

        <Card
          title="Renk ve model grubu"
          description="Aynı modelin farklı renkleri ayrı ürün olarak eklenir; aynı grup kodunu verdiğiniz ürünler ürün sayfasında renk seçenekleri olarak birbirine bağlanır."
        >
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Renk adı" error={e.colorName}>
              <input name="colorName" defaultValue={product?.colorName} placeholder="Ekru" className={inputCls} />
            </Field>
            <Field label="Renk kodu" hint="Boşsa ürün görseli gösterilir." error={e.colorHex}>
              <ColorField name="colorHex" defaultValue={product?.colorHex ?? ""} allowEmpty />
            </Field>
            <Field label="Model grup kodu" hint="Örn. SELANI-KAZAK" error={e.groupCode}>
              <input name="groupCode" defaultValue={product?.groupCode} className={inputCls} />
            </Field>
          </div>
        </Card>

        <Card title="Arama motoru (SEO)" description="Boş bırakılırsa ürün adı ve açıklaması kullanılır.">
          <div className="grid gap-4">
            <Field label="SEO başlığı" error={e.metaTitle}>
              <input name="metaTitle" defaultValue={product?.metaTitle} maxLength={120} className={inputCls} />
            </Field>
            <Field label="SEO açıklaması" hint="150-160 karakter idealdir." error={e.metaDescription}>
              <textarea name="metaDescription" rows={2} maxLength={320} defaultValue={product?.metaDescription} className={textareaCls} />
            </Field>
          </div>
        </Card>
      </div>

      <div className="space-y-6 lg:sticky lg:top-6 lg:self-start">
        <Card title="Fiyat">
          <div className="space-y-4">
            <Field label="Satış fiyatı (TL)" error={e.price}>
              <input
                name="price"
                value={price}
                onChange={(ev) => setPrice(ev.target.value)}
                inputMode="decimal"
                placeholder="1599,90"
                className={inputCls}
              />
            </Field>
            <Field label="Eski fiyat (TL, isteğe bağlı)" hint="Üstü çizili gösterilir ve indirim rozeti oluşur." error={e.comparePrice}>
              <input
                name="comparePrice"
                defaultValue={kurusToInput(product?.comparePrice)}
                inputMode="decimal"
                className={inputCls}
              />
            </Field>
            {priceKurus != null && cartDiscountPercent > 0 && (
              <p className="rounded-md bg-zinc-50 px-3 py-2 text-xs text-zinc-600">
                Sepetteki fiyat (%{cartDiscountPercent} sepet indirimi):{" "}
                <b>{formatPrice(cartPrice(priceKurus, cartDiscountPercent))}</b>
              </p>
            )}
          </div>
        </Card>

        <Card title="Kategori">
          <div className="space-y-4">
            <Field label="Ana kategori" hint="Ürün sayfasındaki yol (breadcrumb) için kullanılır.">
              <select name="categoryId" defaultValue={product?.categoryId ?? ""} className={inputCls}>
                <option value="">Seçiniz</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {"— ".repeat(c.depth)}
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
            <div>
              <p className="mb-1.5 text-[13px] font-medium text-zinc-700">Diğer kategoriler</p>
              <div className="max-h-56 space-y-1 overflow-y-auto rounded-md border border-zinc-200 p-2">
                {categories.map((c) => (
                  <label
                    key={c.id}
                    className="flex items-center gap-2 rounded px-1 py-0.5 text-sm hover:bg-zinc-50"
                    style={{ paddingLeft: `${c.depth * 16 + 4}px` }}
                  >
                    <input
                      type="checkbox"
                      name="extraCategoryIds"
                      value={c.id}
                      defaultChecked={product?.extraCategoryIds.includes(c.id)}
                      className="accent-zinc-900"
                    />
                    {c.name}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </Card>

        <Card title="Durum">
          <div className="space-y-4">
            <Toggle name="isActive" label="Satışta" description="Kapalıysa mağazada görünmez." defaultChecked={product?.isActive ?? true} />
            <Toggle name="isNew" label="Yeni ürün" description="Anasayfa 'Yeni Ürünler' bölümünde." defaultChecked={product?.isNew ?? true} />
            <Toggle name="isTrend" label="İndirim trendi" description="Anasayfa 'İndirim Trendleri' bölümünde." defaultChecked={product?.isTrend} />
          </div>
        </Card>

        <div className="space-y-3">
          <FormMessage state={state} />
          <SubmitButton pending={pending}>{product ? "Değişiklikleri kaydet" : "Ürünü oluştur"}</SubmitButton>
        </div>
      </div>
    </form>
  );
}
