import { and, count, desc, eq, ilike, or, type SQL } from "drizzle-orm";
import { Plus, Search } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Badge, btnPrimary, btnSecondary, EmptyState, inputCls, PageHeader, Table } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth";
import { expireStalePayments } from "@/lib/orders";
import { cn } from "@/lib/cn";
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_STYLES,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
} from "@/lib/constants";
import { db } from "@/lib/db";
import { ORDER_STATUSES, type OrderStatus, orders } from "@/lib/db/schema";
import { formatDate, formatPrice } from "@/lib/format";

export const metadata: Metadata = { title: "Siparişler" };

const PER_PAGE = 30;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default async function OrdersPage({ searchParams }: PageProps<"/admin/siparisler">) {
  await requireAdmin();
  await expireStalePayments();
  const sp = await searchParams;
  const status = ORDER_STATUSES.includes(one(sp.durum) as OrderStatus) ? (one(sp.durum) as OrderStatus) : null;
  const q = one(sp.q).trim();
  const page = Math.max(1, Number(one(sp.sayfa)) || 1);

  const conds: SQL[] = [];
  if (status) conds.push(eq(orders.status, status));
  if (q) {
    const term = `%${q}%`;
    const digits = q.replace(/\D/g, "");
    conds.push(
      or(
        ilike(orders.firstName, term),
        ilike(orders.lastName, term),
        ilike(orders.email, term),
        ilike(orders.phone, term),
        ...(digits && digits.length <= 9 ? [eq(orders.orderNo, Number(digits))] : []),
      )!,
    );
  }
  const where = conds.length ? and(...conds) : undefined;

  const [rows, [{ total }], statusCounts] = await Promise.all([
    db
      .select()
      .from(orders)
      .where(where)
      .orderBy(desc(orders.createdAt))
      .limit(PER_PAGE)
      .offset((page - 1) * PER_PAGE),
    db.select({ total: count() }).from(orders).where(where),
    db.select({ status: orders.status, n: count() }).from(orders).groupBy(orders.status),
  ]);
  const all = statusCounts.reduce((s, r) => s + r.n, 0);
  const pageCount = Math.max(1, Math.ceil(total / PER_PAGE));
  const href = (patch: { durum?: string | null; sayfa?: number }) => {
    const params = new URLSearchParams();
    const d = patch.durum === undefined ? status : patch.durum;
    if (d) params.set("durum", d);
    if (q) params.set("q", q);
    if (patch.sayfa && patch.sayfa > 1) params.set("sayfa", String(patch.sayfa));
    return `/admin/siparisler?${params}`;
  };

  return (
    <>
      <PageHeader
        title="Siparişler"
        description={`${all} sipariş`}
        actions={
          <Link href="/admin/siparisler/yeni" className={btnPrimary}>
            <Plus className="size-4" /> Yeni Sipariş
          </Link>
        }
      />

      <div className="mb-4 flex flex-wrap gap-1.5">
        {[{ key: null, label: "Tümü", n: all }, ...ORDER_STATUSES.map((s) => ({
          key: s,
          label: ORDER_STATUS_LABELS[s],
          n: statusCounts.find((r) => r.status === s)?.n ?? 0,
        }))].map((tab) => (
          <Link
            key={tab.key ?? "all"}
            href={href({ durum: tab.key })}
            className={cn(
              "rounded-full border px-3 py-1.5 text-[13px] transition",
              status === tab.key ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-300 bg-white hover:border-zinc-500",
            )}
          >
            {tab.label} <span className="opacity-60">{tab.n}</span>
          </Link>
        ))}
      </div>

      <form className="mb-4 flex gap-2">
        {status && <input type="hidden" name="durum" value={status} />}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
          <input name="q" defaultValue={q} placeholder="Sipariş no, müşteri adı, e-posta veya telefon" className={`${inputCls} pl-9`} />
        </div>
        <button type="submit" className={btnSecondary}>
          Ara
        </button>
      </form>

      {rows.length === 0 ? (
        <EmptyState title="Sipariş bulunamadı." />
      ) : (
        <Table>
          <thead>
            <tr>
              <th>Sipariş</th>
              <th>Müşteri</th>
              <th>Ödeme</th>
              <th>Tutar</th>
              <th>Durum</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((o) => (
              <tr key={o.id} className="hover:bg-zinc-50">
                <td>
                  <Link href={`/admin/siparisler/${o.id}`} className="font-medium hover:underline">
                    #{o.orderNo}
                  </Link>
                  <p className="text-xs text-zinc-500">{formatDate(o.createdAt)}</p>
                </td>
                <td>
                  {o.firstName} {o.lastName}
                  <p className="text-xs text-zinc-500">
                    {o.city} · {o.phone}
                  </p>
                </td>
                <td>
                  {PAYMENT_METHOD_LABELS[o.paymentMethod]}
                  <p className={cn("text-xs", o.paymentStatus === "paid" ? "text-emerald-700" : "text-zinc-500")}>
                    {PAYMENT_STATUS_LABELS[o.paymentStatus]}
                  </p>
                </td>
                <td className="tabular-nums">{formatPrice(o.total)}</td>
                <td>
                  <Badge className={ORDER_STATUS_STYLES[o.status]}>{ORDER_STATUS_LABELS[o.status]}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      {pageCount > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-zinc-500">
            Sayfa {page} / {pageCount}
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link href={href({ sayfa: page - 1 })} className={btnSecondary}>
                ← Önceki
              </Link>
            )}
            {page < pageCount && (
              <Link href={href({ sayfa: page + 1 })} className={btnSecondary}>
                Sonraki →
              </Link>
            )}
          </div>
        </div>
      )}
    </>
  );
}
