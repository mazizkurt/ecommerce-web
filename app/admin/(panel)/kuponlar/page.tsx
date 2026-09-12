import { desc } from "drizzle-orm";
import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Badge, btnPrimary, EmptyState, PageHeader, Table } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { type Coupon } from "@/lib/coupons";
import { coupons } from "@/lib/db/schema";
import { formatDate, formatPrice } from "@/lib/format";

export const metadata: Metadata = { title: "Kuponlar" };

function valueText(c: Coupon) {
  if (c.type === "percent") return `%${c.value} indirim`;
  if (c.type === "fixed") return `${formatPrice(c.value)} indirim`;
  return "Ücretsiz kargo";
}

function status(c: Coupon, now: Date) {
  if (!c.isActive) return <Badge>Pasif</Badge>;
  if (c.endsAt && c.endsAt < now) return <Badge>Süresi doldu</Badge>;
  if (c.maxUses != null && c.usedCount >= c.maxUses) return <Badge>Limit doldu</Badge>;
  if (c.startsAt && c.startsAt > now) return <Badge className="bg-sky-50 text-sky-700 ring-sky-200">Planlandı</Badge>;
  return <Badge className="bg-emerald-50 text-emerald-700 ring-emerald-200">Aktif</Badge>;
}

export default async function CouponsPage() {
  await requireAdmin();
  const rows = await db.select().from(coupons).orderBy(desc(coupons.createdAt));
  const now = new Date();

  return (
    <>
      <PageHeader
        title="Kuponlar"
        description="Müşterinin ödeme sayfasında gireceği indirim kodları."
        actions={
          <Link href="/admin/kuponlar/yeni" className={btnPrimary}>
            <Plus className="size-4" /> Yeni Kupon
          </Link>
        }
      />
      {rows.length === 0 ? (
        <EmptyState
          title="Henüz kupon yok."
          action={
            <Link href="/admin/kuponlar/yeni" className={btnPrimary}>
              <Plus className="size-4" /> İlk kuponu oluştur
            </Link>
          }
        />
      ) : (
        <Table>
          <thead>
            <tr>
              <th>Kod</th>
              <th>İndirim</th>
              <th>Şart</th>
              <th>Kullanım</th>
              <th>Geçerlilik</th>
              <th>Durum</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id} className="hover:bg-zinc-50">
                <td>
                  <Link href={`/admin/kuponlar/${c.id}`} className="font-mono font-medium hover:underline">
                    {c.code}
                  </Link>
                  {c.description && <p className="text-xs text-zinc-500">{c.description}</p>}
                </td>
                <td>{valueText(c)}</td>
                <td className="text-zinc-600">{c.minSubtotal ? `${formatPrice(c.minSubtotal)} üzeri` : "—"}</td>
                <td className="tabular-nums">
                  {c.usedCount}
                  {c.maxUses != null ? ` / ${c.maxUses}` : ""}
                </td>
                <td className="text-xs text-zinc-500">
                  {c.startsAt ? formatDate(c.startsAt) : "Şimdi"} → {c.endsAt ? formatDate(c.endsAt) : "Süresiz"}
                </td>
                <td>{status(c, now)}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </>
  );
}
