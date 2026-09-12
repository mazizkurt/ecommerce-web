import { and, desc, eq, or } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ConfirmForm } from "@/components/admin/form-client";
import { Badge, Card, PageHeader, Table } from "@/components/admin/ui";
import { CustomerForm, SetPasswordForm } from "@/components/admin/user-forms";
import { deleteCustomer } from "@/lib/actions/admin-users";
import { requireAdmin } from "@/lib/auth";
import { ORDER_STATUS_LABELS, ORDER_STATUS_STYLES } from "@/lib/constants";
import { db } from "@/lib/db";
import { orders, users } from "@/lib/db/schema";
import { formatDate, formatPrice } from "@/lib/format";

export const metadata: Metadata = { title: "Müşteri" };

export default async function CustomerPage({ params }: PageProps<"/admin/musteriler/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const [customer] = await db
    .select()
    .from(users)
    .where(and(eq(users.id, Number(id) || 0), eq(users.role, "customer")))
    .limit(1);
  if (!customer) notFound();
  const customerOrders = await db
    .select()
    .from(orders)
    .where(or(eq(orders.userId, customer.id), eq(orders.email, customer.email)))
    .orderBy(desc(orders.createdAt));
  const spent = customerOrders
    .filter((o) => o.status !== "cancelled" && o.status !== "awaiting_payment")
    .reduce((s, o) => s + o.total, 0);

  return (
    <>
      <PageHeader
        title={customer.name || customer.email}
        description={`Üye: ${formatDate(customer.createdAt)} · ${customerOrders.length} sipariş · ${formatPrice(spent)} harcama`}
        back={{ href: "/admin/musteriler", label: "Müşteriler" }}
        actions={
          <ConfirmForm
            action={deleteCustomer}
            id={customer.id}
            message="Müşteri hesabı silinsin mi? Siparişleri silinmez, yalnızca üyelik kaldırılır."
          >
            Hesabı sil
          </ConfirmForm>
        }
      />
      <div className="space-y-6">
        <Card title="Bilgiler">
          <CustomerForm customer={customer} />
        </Card>
        <Card title="Şifre sıfırla" description="Müşteri şifresini unuttuysa yeni şifre belirleyip kendisine iletebilirsiniz.">
          <SetPasswordForm userId={customer.id} />
        </Card>
        <Card title="Siparişleri" className="[&>div:last-child]:p-0">
          {customerOrders.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-zinc-500">Sipariş yok.</p>
          ) : (
            <div className="[&>div]:rounded-none [&>div]:border-0">
              <Table>
                <thead>
                  <tr>
                    <th>Sipariş</th>
                    <th>Tarih</th>
                    <th>Tutar</th>
                    <th>Durum</th>
                  </tr>
                </thead>
                <tbody>
                  {customerOrders.map((o) => (
                    <tr key={o.id}>
                      <td>
                        <Link href={`/admin/siparisler/${o.id}`} className="font-medium hover:underline">
                          #{o.orderNo}
                        </Link>
                      </td>
                      <td className="text-zinc-500">{formatDate(o.createdAt)}</td>
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
      </div>
    </>
  );
}
