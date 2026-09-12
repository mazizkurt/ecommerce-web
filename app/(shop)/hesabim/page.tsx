import { desc, eq, or } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { logout } from "@/lib/actions/shop";
import { requireUser } from "@/lib/auth";
import { ORDER_STATUS_LABELS } from "@/lib/constants";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { formatDate, formatPrice } from "@/lib/format";

export const metadata: Metadata = { title: "Hesabım", robots: { index: false } };

export default async function AccountPage() {
  const user = await requireUser();
  const myOrders = await db
    .select({
      orderNo: orders.orderNo,
      token: orders.token,
      status: orders.status,
      total: orders.total,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .where(or(eq(orders.userId, user.id), eq(orders.email, user.email)))
    .orderBy(desc(orders.createdAt));

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl">Hesabım</h1>
          <p className="mt-1 text-sm text-zinc-600">
            {user.name} · {user.email}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {user.role === "admin" && (
            <Link href="/admin" className="border border-black px-4 py-2 text-[13px] font-medium">
              Yönetim Paneli
            </Link>
          )}
          <form action={logout}>
            <button type="submit" className="bg-black px-4 py-2 text-[13px] font-medium text-white">
              Çıkış Yap
            </button>
          </form>
        </div>
      </div>

      <h2 className="mb-3 mt-10 text-base font-medium">Siparişlerim</h2>
      {myOrders.length === 0 ? (
        <p className="border border-line px-4 py-8 text-center text-sm text-zinc-500">
          Henüz siparişiniz bulunmuyor.
        </p>
      ) : (
        <ul className="divide-y divide-line border-y border-line">
          {myOrders.map((o) => (
            <li key={o.token}>
              <Link
                href={`/siparis/${o.token}`}
                className="flex flex-wrap items-center justify-between gap-2 py-4 text-sm hover:bg-soft"
              >
                <span className="font-medium">#{o.orderNo}</span>
                <span className="text-zinc-500">{formatDate(o.createdAt)}</span>
                <span>{ORDER_STATUS_LABELS[o.status]}</span>
                <span className="font-medium">{formatPrice(o.total)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
