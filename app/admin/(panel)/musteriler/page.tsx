import { desc, eq, sql } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState, PageHeader, Table } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { formatDate, formatPrice } from "@/lib/format";

export const metadata: Metadata = { title: "Müşteriler" };

export default async function CustomersPage() {
  await requireAdmin();
  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      phone: users.phone,
      createdAt: users.createdAt,
      orderCount: sql<number>`(select count(*) from orders o where (o.user_id = ${users.id} or o.email = ${users.email}) and o.status not in ('cancelled', 'awaiting_payment'))`.mapWith(Number),
      spent: sql<number>`(select coalesce(sum(o.total), 0) from orders o where (o.user_id = ${users.id} or o.email = ${users.email}) and o.status not in ('cancelled', 'awaiting_payment'))`.mapWith(Number),
    })
    .from(users)
    .where(eq(users.role, "customer"))
    .orderBy(desc(users.createdAt))
    .limit(500);

  return (
    <>
      <PageHeader title="Müşteriler" description={`${rows.length} üye müşteri (misafir siparişler Siparişler sayfasındadır)`} />
      {rows.length === 0 ? (
        <EmptyState title="Henüz üye müşteri yok." />
      ) : (
        <Table>
          <thead>
            <tr>
              <th>Müşteri</th>
              <th>Telefon</th>
              <th>Sipariş</th>
              <th>Toplam harcama</th>
              <th>Üyelik</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => (
              <tr key={u.id}>
                <td>
                  <Link href={`/admin/musteriler/${u.id}`} className="font-medium hover:underline">
                    {u.name || u.email}
                  </Link>
                  <p className="text-xs text-zinc-500">{u.email}</p>
                </td>
                <td className="text-zinc-600">{u.phone ?? "—"}</td>
                <td className="tabular-nums">{u.orderCount}</td>
                <td className="tabular-nums">{formatPrice(u.spent)}</td>
                <td className="text-zinc-500">{formatDate(u.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </>
  );
}
