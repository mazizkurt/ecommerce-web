import { desc } from "drizzle-orm";
import { Download } from "lucide-react";
import type { Metadata } from "next";
import { btnSecondary, EmptyState, PageHeader, Table } from "@/components/admin/ui";
import { db } from "@/lib/db";
import { subscribers } from "@/lib/db/schema";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Bülten Aboneleri" };

export default async function SubscribersPage() {
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
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => (
              <tr key={s.id}>
                <td>{s.email}</td>
                <td className="text-zinc-500">{formatDate(s.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </>
  );
}
