import { asc } from "drizzle-orm";
import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { btnPrimary, PageHeader, Table } from "@/components/admin/ui";
import { PAGE_GROUP_LABELS } from "@/lib/constants";
import { db } from "@/lib/db";
import { pages } from "@/lib/db/schema";

export const metadata: Metadata = { title: "Sayfalar" };

export default async function PagesPage() {
  const rows = await db.select().from(pages).orderBy(asc(pages.sortOrder), asc(pages.id));
  return (
    <>
      <PageHeader
        title="Sayfalar"
        description="Hakkımızda, iade koşulları, sözleşmeler gibi içerik sayfaları."
        actions={
          <Link href="/admin/sayfalar/yeni" className={btnPrimary}>
            <Plus className="size-4" /> Yeni Sayfa
          </Link>
        }
      />
      <Table>
        <thead>
          <tr>
            <th>Başlık</th>
            <th>Adres</th>
            <th>Konum</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => (
            <tr key={p.id} className="hover:bg-zinc-50">
              <td>
                <Link href={`/admin/sayfalar/${p.id}`} className="font-medium hover:underline">
                  {p.title}
                </Link>
              </td>
              <td className="text-zinc-500">/sayfa/{p.slug}</td>
              <td className="text-zinc-500">{PAGE_GROUP_LABELS[p.footerGroup]}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </>
  );
}
