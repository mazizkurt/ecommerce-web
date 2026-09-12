import { and, count, eq } from "drizzle-orm";
import type { Metadata } from "next";
import { AdminSidebar } from "@/components/admin/sidebar";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { orders, reviews } from "@/lib/db/schema";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: { default: "Yönetim Paneli", template: "%s · Yönetim" },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();
  const [settings, [pendingOrders], [pendingReviews]] = await Promise.all([
    getSettings(),
    db.select({ n: count() }).from(orders).where(eq(orders.status, "pending")),
    db.select({ n: count() }).from(reviews).where(and(eq(reviews.isApproved, false))),
  ]);

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 lg:flex">
      <AdminSidebar
        storeName={settings.storeName}
        userName={user.email}
        counts={{ pendingOrders: pendingOrders.n, pendingReviews: pendingReviews.n }}
      />
      <main className="min-w-0 flex-1 px-4 py-6 lg:px-8 lg:py-8">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
