import { desc } from "drizzle-orm";
import { Download } from "lucide-react";
import type { Metadata } from "next";
import { ConfirmForm } from "@/components/admin/form-client";
import { btnSecondary, EmptyState, PageHeader, Table } from "@/components/admin/ui";
import { deleteSubscriber } from "@/lib/actions/admin-marketing";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { subscribers } from "@/lib/db/schema";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Bülten Aboneleri" };

export default async function SubscribersPage() {
  await requireAdmin();
  const rows = await db.select().from(subscribers).orderBy(desc(subscribers.createdAt));
  return (
    <>
      <PageHeader
        title="Bülten Aboneleri"
        description={`${rows.length} abone`}
        actions={
          rows.length > 0 && (
            <a href="/api/admin/subscribers" className={btnSecondary}>
              <Download className="size-4" /> CSV indir
            </a>
          )
        }
      />
      {rows.length === 0 ? (
        <EmptyState title="Henüz bülten abonesi yok." />
      ) : (
        <Table>
          <thead>
            <tr>
              <th>E-posta</th>
              <th>Kayıt tarihi</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => (
              <tr key={s.id}>
                <td>{s.email}</td>
                <td className="text-zinc-500">{formatDate(s.createdAt)}</td>
                <td className="text-right">
                  <ConfirmForm
                    action={deleteSubscriber}
                    id={s.id}
                    message={`${s.email} bülten listesinden silinsin mi?`}
                    className="text-xs text-red-600 hover:underline"
                  >
                    Sil
                  </ConfirmForm>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </>
  );
}
