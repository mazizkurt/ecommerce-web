"use client";

import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import {
  createManualOrder,
  refundOrderPayment,
  updateOrderInfo,
  updateOrderItems,
} from "@/lib/actions/admin-orders";
import { CITIES } from "@/lib/constants";
import { formatPrice, kurusToInput } from "@/lib/format";
import { FormMessage, SubmitButton, useAdminAction } from "./form-client";
import { btnDanger, btnSecondary, Card, Field, inputBase, inputCls, textareaCls, Toggle } from "./ui";

export type VariantOption = {
  variantId: number;
  productName: string;
  size: string;
  stock: number;
  price: number;
};

type Contact = {
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  city: string;
  district: string;
  address: string;
  note: string;
};

function ContactFields({ values, errors }: { values?: Partial<Contact>; errors: Record<string, string> }) {
  const cities = values?.city && !CITIES.includes(values.city) ? [values.city, ...CITIES] : CITIES;
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Ad" error={errors.firstName}>
        <input name="firstName" defaultValue={values?.firstName} className={inputCls} />
      </Field>
      <Field label="Soyad" error={errors.lastName}>
        <input name="lastName" defaultValue={values?.lastName} className={inputCls} />
      </Field>
      <Field label="E-posta" error={errors.email}>
        <input name="email" type="email" defaultValue={values?.email} className={inputCls} />
      </Field>
      <Field label="Telefon" error={errors.phone}>
        <input name="phone" type="tel" defaultValue={values?.phone} className={inputCls} />
      </Field>
      <Field label="İl" error={errors.city}>
        <select name="city" defaultValue={values?.city ?? ""} className={inputCls}>
          <option value="">İl seçiniz</option>
          {cities.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </Field>
      <Field label="İlçe" error={errors.district}>
        <input name="district" defaultValue={values?.district} className={inputCls} />
      </Field>
      <Field label="Açık adres" error={errors.address} className="sm:col-span-2">
        <textarea name="address" rows={2} defaultValue={values?.address} className={textareaCls} />
      </Field>
      <Field label="Müşteri notu" className="sm:col-span-2">
        <input name="note" defaultValue={values?.note} className={inputCls} />
      </Field>
    </div>
  );
}

export function OrderInfoForm({ orderId, values }: { orderId: number; values: Contact }) {
  const { state, onSubmit, pending } = useAdminAction(updateOrderInfo);
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <input type="hidden" name="id" value={orderId} />
      <ContactFields values={values} errors={state.errors ?? {}} />
      <div className="flex flex-wrap items-center gap-4">
        <SubmitButton pending={pending}>Bilgileri kaydet</SubmitButton>
        <FormMessage state={state} />
      </div>
    </form>
  );
}

function VariantPicker({ options, onPick }: { options: VariantOption[]; onPick: (variantId: number) => void }) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState("");
  const q = query.toLocaleLowerCase("tr-TR");
  const filtered = options
    .filter((o) => `${o.productName} ${o.size}`.toLocaleLowerCase("tr-TR").includes(q))
    .slice(0, 300);
  return (
    <div className="flex flex-wrap gap-2">
      <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Ürün ara..." className={`${inputBase} w-full sm:w-52`} />
      <select value={selected} onChange={(e) => setSelected(e.target.value)} className={`${inputBase} min-w-0 flex-1`}>
        <option value="">Ürün ve beden seçin ({filtered.length})</option>
        {filtered.map((o) => (
          <option key={o.variantId} value={o.variantId} disabled={o.stock <= 0}>
            {o.productName} — {o.size} · {formatPrice(o.price)} · {o.stock <= 0 ? "stok yok" : `${o.stock} stok`}
          </option>
        ))}
      </select>
      <button
        type="button"
        disabled={!selected}
        onClick={() => {
          onPick(Number(selected));
          setSelected("");
        }}
        className={btnSecondary}
      >
        <Plus className="size-4" /> Ekle
      </button>
    </div>
  );
}

type AddedLine = { variantId: number; quantity: number };

function AddedLines({
  lines,
  options,
  onChange,
}: {
  lines: AddedLine[];
  options: VariantOption[];
  onChange: (lines: AddedLine[]) => void;
}) {
  return (
    <>
      {lines.map((line) => {
        const o = options.find((x) => x.variantId === line.variantId);
        if (!o) return null;
        return (
          <tr key={`n${line.variantId}`} className="bg-emerald-50/40">
            <td>
              {o.productName} <span className="text-zinc-500">({o.size})</span>
              <span className="ml-2 rounded bg-emerald-100 px-1.5 text-[11px] text-emerald-800">yeni</span>
            </td>
            <td className="tabular-nums">{formatPrice(o.price)}</td>
            <td>
              <input
                type="number"
                min={1}
                max={o.stock}
                value={line.quantity}
                onChange={(e) =>
                  onChange(
                    lines.map((l) =>
                      l.variantId === line.variantId ? { ...l, quantity: Math.max(1, Number(e.target.value) || 1) } : l,
                    ),
                  )
                }
                className={`${inputBase} w-20`}
              />
            </td>
            <td className="text-right tabular-nums">{formatPrice(o.price * line.quantity)}</td>
            <td className="w-10">
              <button type="button" onClick={() => onChange(lines.filter((l) => l.variantId !== line.variantId))} aria-label="Kaldır" className="p-1 text-zinc-400 hover:text-red-600">
                <Trash2 className="size-4" />
              </button>
            </td>
          </tr>
        );
      })}
    </>
  );
}

const tableCls =
  "w-full text-left text-sm [&_td]:py-2 [&_td]:pr-3 [&_th]:py-2 [&_th]:pr-3 [&_th]:text-xs [&_th]:font-medium [&_th]:text-zinc-500 [&_tbody_tr]:border-t [&_tbody_tr]:border-zinc-100";

const addLine = (lines: AddedLine[], variantId: number) =>
  lines.some((l) => l.variantId === variantId)
    ? lines.map((l) => (l.variantId === variantId ? { ...l, quantity: l.quantity + 1 } : l))
    : [...lines, { variantId, quantity: 1 }];

export function OrderItemsEditor({
  orderId,
  items,
  shippingFee,
  options,
}: {
  orderId: number;
  items: { id: number; name: string; size: string; unitPrice: number; quantity: number }[];
  shippingFee: number;
  options: VariantOption[];
}) {
  const { state, onSubmit, pending } = useAdminAction(updateOrderItems);
  const [rows, setRows] = useState(items);
  const [added, setAdded] = useState<AddedLine[]>([]);
  const payload = [...rows.map((r) => ({ itemId: r.id, quantity: r.quantity })), ...added];
  const listTotal =
    rows.reduce((s, r) => s + r.unitPrice * r.quantity, 0) +
    added.reduce((s, a) => s + (options.find((o) => o.variantId === a.variantId)?.price ?? 0) * a.quantity, 0);

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <input type="hidden" name="id" value={orderId} />
      <input type="hidden" name="items" value={JSON.stringify(payload)} />
      <div className="overflow-x-auto">
        <table className={tableCls}>
          <thead>
            <tr>
              <th>Ürün</th>
              <th>Birim</th>
              <th>Adet</th>
              <th className="text-right">Tutar</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className={r.quantity === 0 ? "opacity-40" : undefined}>
                <td>
                  {r.name} <span className="text-zinc-500">({r.size})</span>
                </td>
                <td className="tabular-nums">{formatPrice(r.unitPrice)}</td>
                <td>
                  <input
                    type="number"
                    min={0}
                    value={r.quantity}
                    onChange={(e) =>
                      setRows((prev) => prev.map((x) => (x.id === r.id ? { ...x, quantity: Math.max(0, Number(e.target.value) || 0) } : x)))
                    }
                    className={`${inputBase} w-20`}
                  />
                </td>
                <td className="text-right tabular-nums">{formatPrice(r.unitPrice * r.quantity)}</td>
                <td className="w-10">
                  <button
                    type="button"
                    onClick={() => setRows((prev) => prev.map((x) => (x.id === r.id ? { ...x, quantity: 0 } : x)))}
                    aria-label="Kaldır"
                    className="p-1 text-zinc-400 hover:text-red-600"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </td>
              </tr>
            ))}
            <AddedLines lines={added} options={options} onChange={setAdded} />
          </tbody>
        </table>
      </div>
      <VariantPicker options={options} onPick={(id) => setAdded((prev) => addLine(prev, id))} />
      <div className="flex flex-wrap items-end justify-between gap-4 border-t border-zinc-100 pt-4">
        <Field label="Kargo ücreti (TL)" className="w-40">
          <input name="shippingFee" defaultValue={kurusToInput(shippingFee)} inputMode="decimal" className={inputCls} />
        </Field>
        <p className="text-sm text-zinc-500">
          Liste fiyatıyla ara toplam: <b className="text-zinc-900">{formatPrice(listTotal)}</b>
          <br />
          <span className="text-xs">Sepet indirimi ve kupon kaydedince yeniden hesaplanır.</span>
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <SubmitButton pending={pending}>Ürünleri ve tutarı kaydet</SubmitButton>
        <FormMessage state={state} />
      </div>
    </form>
  );
}

export function RefundForm({ orderId, total, providerName }: { orderId: number; total: number; providerName: string }) {
  const { state, onSubmit, pending } = useAdminAction(refundOrderPayment);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (confirm(`${providerName} üzerinden iade yapılacak. Bu işlem geri alınamaz. Devam edilsin mi?`)) onSubmit(e);
      }}
      className="space-y-3"
    >
      <input type="hidden" name="id" value={orderId} />
      <Field label="İade tutarı (TL)" hint="Kısmi iade için tutarı düşürün.">
        <input name="amount" defaultValue={kurusToInput(total)} inputMode="decimal" className={inputCls} />
      </Field>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="cancelOrder" defaultChecked className="accent-zinc-900" />
        Siparişi de iptal et (stoklar geri eklenir)
      </label>
      <SubmitButton pending={pending} className={btnDanger}>
        Ödemeyi iade et
      </SubmitButton>
      <FormMessage state={state} />
    </form>
  );
}

export function ManualOrderForm({ options }: { options: VariantOption[] }) {
  const { state, onSubmit, pending } = useAdminAction(createManualOrder);
  const [added, setAdded] = useState<AddedLine[]>([]);
  const e = state.errors ?? {};
  return (
    <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <input type="hidden" name="items" value={JSON.stringify(added)} />
      <div className="space-y-6">
        <Card title="Ürünler">
          {added.length > 0 && (
            <table className={`${tableCls} mb-4`}>
              <thead>
                <tr>
                  <th>Ürün</th>
                  <th>Birim</th>
                  <th>Adet</th>
                  <th className="text-right">Tutar</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                <AddedLines lines={added} options={options} onChange={setAdded} />
              </tbody>
            </table>
          )}
          <VariantPicker options={options} onPick={(id) => setAdded((prev) => addLine(prev, id))} />
        </Card>
        <Card title="Müşteri ve teslimat">
          <ContactFields errors={e} />
        </Card>
      </div>
      <div className="space-y-6">
        <Card title="Ödeme">
          <div className="space-y-4">
            <Field label="Ödeme yöntemi">
              <select name="paymentMethod" defaultValue="bank_transfer" className={inputCls}>
                <option value="bank_transfer">Havale / EFT</option>
                <option value="cash_on_delivery">Kapıda Ödeme</option>
                <option value="manual">Diğer / Elden</option>
              </select>
            </Field>
            <Field label="Ödeme durumu">
              <select name="paymentStatus" defaultValue="pending" className={inputCls}>
                <option value="pending">Ödeme Bekleniyor</option>
                <option value="paid">Ödendi</option>
              </select>
            </Field>
            <Field label="Kargo ücreti (TL)">
              <input name="shippingFee" defaultValue="0" inputMode="decimal" className={inputCls} />
            </Field>
            <Field label="İndirim (TL)">
              <input name="discount" defaultValue="0" inputMode="decimal" className={inputCls} />
            </Field>
            <Toggle name="notifyCustomer" label="Müşteriye sipariş e-postası gönder" defaultChecked />
          </div>
        </Card>
        <FormMessage state={state} />
        <SubmitButton pending={pending}>Siparişi oluştur</SubmitButton>
      </div>
    </form>
  );
}
