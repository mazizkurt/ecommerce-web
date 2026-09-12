import { and, asc, count, desc, eq, gte, lt, lte, ne, sql } from "drizzle-orm";
import Link from "next/link";
import { Badge, Card, PageHeader, Table } from "@/components/admin/ui";
import { cn } from "@/lib/cn";
import { ORDER_STATUS_LABELS, ORDER_STATUS_STYLES } from "@/lib/constants";
import { db } from "@/lib/db";
import { orders, products, productVariants } from "@/lib/db/schema";
import { formatDate, formatPrice } from "@/lib/format";

// Türkiye UTC+3'tür (yaz saati uygulaması yok).
function istanbulDate(offsetDays = 0, day?: number) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(Date.now() + offsetDays * 86_400_000));
  const [y, m, d] = parts.split("-");
  return { y: Number(y), m: Number(m), d: day ?? Number(d) };
}
const at = (y: number, m: number, d: number) =>
  new Date(`${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}T00:00:00+03:00`);

/** Bugün, bu ay ve geçen ayın aynı noktasına kadar olan dönem sınırları. */
function periods() {
  const today = istanbulDate();
  const tomorrow = istanbulDate(1);
  const monthStart = at(today.y, today.m, 1);
  const prevMonthStart = today.m === 1 ? at(today.y - 1, 12, 1) : at(today.y, today.m - 1, 1);
  return {
    dayStart: at(today.y, today.m, today.d),
    dayEnd: at(tomorrow.y, tomorrow.m, tomorrow.d),
    monthStart,
    nextMonthStart: today.m === 12 ? at(today.y + 1, 1, 1) : at(today.y, today.m + 1, 1),
    prevMonthStart,
    prevSamePoint: new Date(prevMonthStart.getTime() + (Date.now() - monthStart.getTime())),
  };
}

async function revenue(from: Date, to: Date) {
  const [row] = await db
    .select({
      total: sql<number>`coalesce(sum(${orders.total}), 0)`.mapWith(Number),
      n: count(),
    })
    .from(orders)
    .where(and(gte(orders.createdAt, from), lt(orders.createdAt, to), ne(orders.status, "cancelled")));
  return row;
}

function StatTile({
  label,
  value,
  delta,
  href,
}: {
  label: string;
  value: string;
  delta?: { text: string; positive: boolean | null };
  href?: string;
}) {
  const body = (
    <>
      <p className="text-[13px] text-zinc-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900">{value}</p>
      {delta && (
        <p
          className={cn(
            "mt-1 text-xs",
            delta.positive === null ? "text-zinc-500" : delta.positive ? "text-emerald-700" : "text-red-600",
          )}
        >
          {delta.text}
        </p>
      )}
    </>
  );
  const cls = "block rounded-lg border border-zinc-200 bg-white p-5";
  return href ? (
    <Link href={href} className={cn(cls, "transition hover:border-zinc-400")}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

export default async function DashboardPage() {
  const { dayStart, dayEnd, monthStart, nextMonthStart, prevMonthStart, prevSamePoint } = periods();

  const [todayRev, monthRev, prevRev, [pending], [activeProducts], lowStock, recent] = await Promise.all([
    revenue(dayStart, dayEnd),
    revenue(monthStart, nextMonthStart),
    revenue(prevMonthStart, prevSamePoint),
    db.select({ n: count() }).from(orders).where(eq(orders.status, "pending")),
    db.select({ n: count() }).from(products).where(eq(products.isActive, true)),
    db
      .select({
        id: products.id,
        name: products.name,
        size: productVariants.size,
        stock: productVariants.stock,
      })
      .from(productVariants)
      .innerJoin(products, eq(products.id, productVariants.productId))
      .where(and(eq(products.isActive, true), lte(productVariants.stock, 3)))
      .orderBy(asc(productVariants.stock))
      .limit(8),
    db.select().from(orders).orderBy(desc(orders.createdAt)).limit(8),
  ]);

  const change = prevRev.total > 0 ? ((monthRev.total - prevRev.total) / prevRev.total) * 100 : null;

  return (
    <>
      <PageHeader title="Genel Bakış" description="Mağazanızın bugünkü durumu" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Bugünkü satış"
          value={formatPrice(todayRev.total)}
          delta={{ text: `${todayRev.n} sipariş`, positive: null }}
        />
        <StatTile
          label="Bu ayki satış"
          value={formatPrice(monthRev.total)}
          delta={
            change === null
              ? { text: `${monthRev.n} sipariş`, positive: null }
              : {
                  text: `${change >= 0 ? "▲ +" : "▼ "}${change.toFixed(0)}% geçen ayın aynı dönemine göre`,
                  positive: change >= 0,
                }
          }
        />
        <StatTile
          label="Onay bekleyen sipariş"
          value={String(pending.n)}
          href="/admin/siparisler?durum=pending"
        />
        <StatTile label="Satıştaki ürün" value={String(activeProducts.n)} href="/admin/urunler" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card
          title="Son siparişler"
          actions={
            <Link href="/admin/siparisler" className="text-[13px] text-zinc-500 hover:text-zinc-900">
              Tümü →
            </Link>
          }
          className="[&>div:last-child]:p-0"
        >
          {recent.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-zinc-500">Henüz sipariş yok.</p>
          ) : (
            <div className="[&>div]:rounded-none [&>div]:border-0">
              <Table>
                <thead>
                  <tr>
                    <th>Sipariş</th>
                    <th>Müşteri</th>
                    <th>Tutar</th>
                    <th>Durum</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((o) => (
                    <tr key={o.id}>
                      <td>
                        <Link href={`/admin/siparisler/${o.id}`} className="font-medium hover:underline">
                          #{o.orderNo}
                        </Link>
                        <p className="text-xs text-zinc-500">{formatDate(o.createdAt)}</p>
                      </td>
                      <td>
                        {o.firstName} {o.lastName}
                      </td>
                      <td className="tabular-nums">{formatPrice(o.total)}</td>
                      <td>
                        <Badge className={ORDER_STATUS_STYLES[o.status]}>{ORDER_STATUS_LABELS[o.status]}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card>

        <Card title="Azalan stoklar" description="3 adet ve altındaki bedenler">
          {lowStock.length === 0 ? (
            <p className="text-sm text-zinc-500">Stoğu azalan ürün yok.</p>
          ) : (
            <ul className="space-y-3">
              {lowStock.map((v, i) => (
                <li key={`${v.id}-${v.size}-${i}`} className="flex items-center justify-between gap-3 text-sm">
                  <Link href={`/admin/urunler/${v.id}`} className="flex min-w-0 gap-1 hover:underline">
                    <span className="truncate">{v.name}</span>
                    <span className="shrink-0 text-zinc-500">({v.size})</span>
                  </Link>
                  <Badge
                    className={
                      v.stock === 0 ? "bg-red-50 text-red-700 ring-red-200" : "bg-amber-50 text-amber-700 ring-amber-200"
                    }
                  >
                    {v.stock === 0 ? "Tükendi" : `${v.stock} adet`}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
