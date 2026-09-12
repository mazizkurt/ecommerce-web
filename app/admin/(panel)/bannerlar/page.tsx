import { asc } from "drizzle-orm";
import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Badge, btnPrimary, Card, PageHeader } from "@/components/admin/ui";
import { BANNER_PLACEMENT_LABELS } from "@/lib/constants";
import { db } from "@/lib/db";
import { BANNER_PLACEMENTS, banners } from "@/lib/db/schema";

export const metadata: Metadata = { title: "Bannerlar" };

export default async function BannersPage() {
  const rows = await db.select().from(banners).orderBy(asc(banners.sortOrder), asc(banners.id));

  return (
    <>
      <PageHeader
        title="Bannerlar"
        description="Anasayfadaki slider, kampanya ve kategori görselleri."
        actions={
          <Link href="/admin/bannerlar/yeni" className={btnPrimary}>
            <Plus className="size-4" /> Yeni Banner
          </Link>
        }
      />
      <div className="space-y-6">
        {BANNER_PLACEMENTS.map((placement) => {
          const list = rows.filter((b) => b.placement === placement);
          return (
            <Card key={placement} title={BANNER_PLACEMENT_LABELS[placement]}>
              {list.length === 0 ? (
                <p className="text-sm text-zinc-500">Bu alanda banner yok.</p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {list.map((b) => (
                    <Link
                      key={b.id}
                      href={`/admin/bannerlar/${b.id}`}
                      className="group overflow-hidden rounded-md border border-zinc-200 transition hover:border-zinc-400"
                    >
                      <div className={placement === "category" ? "aspect-[2/3] bg-zinc-100" : "aspect-[1920/896] bg-zinc-100"}>
                        {b.imageUrl && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={b.imageUrl} alt="" className="size-full object-cover" />
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-2 p-3 text-sm">
                        <div className="min-w-0">
                          <p className="truncate font-medium">{b.title || "(başlıksız)"}</p>
                          <p className="truncate text-xs text-zinc-500">{b.link || "bağlantı yok"}</p>
                        </div>
                        {b.isActive ? <Badge>Yayında</Badge> : <span className="text-xs text-zinc-400">Pasif</span>}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </>
  );
}
