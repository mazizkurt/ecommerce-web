import { desc, eq } from "drizzle-orm";
import { Star } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { ConfirmForm, SubmitButton } from "@/components/admin/form-client";
import { btnSecondary, EmptyState, PageHeader } from "@/components/admin/ui";
import { deleteReview, setReviewApproval } from "@/lib/actions/admin";
import { cn } from "@/lib/cn";
import { db } from "@/lib/db";
import { products, reviews } from "@/lib/db/schema";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Yorumlar" };

export default async function ReviewsPage({ searchParams }: PageProps<"/admin/yorumlar">) {
  const sp = await searchParams;
  const approved = sp.durum === "onayli";
  const rows = await db
    .select({
      id: reviews.id,
      name: reviews.name,
      rating: reviews.rating,
      comment: reviews.comment,
      createdAt: reviews.createdAt,
      productName: products.name,
      productSlug: products.slug,
    })
    .from(reviews)
    .leftJoin(products, eq(products.id, reviews.productId))
    .where(eq(reviews.isApproved, approved))
    .orderBy(desc(reviews.createdAt))
    .limit(200);

  const tab = (active: boolean) =>
    cn(
      "rounded-full border px-3 py-1.5 text-[13px]",
      active ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-300 bg-white hover:border-zinc-500",
    );

  return (
    <>
      <PageHeader title="Yorumlar" description="Onaylanan yorumlar ürün sayfasında ve anasayfada gösterilir." />
      <div className="mb-4 flex gap-1.5">
        <Link href="/admin/yorumlar" className={tab(!approved)}>
          Onay bekleyenler
        </Link>
        <Link href="/admin/yorumlar?durum=onayli" className={tab(approved)}>
          Onaylananlar
        </Link>
      </div>

      {rows.length === 0 ? (
        <EmptyState title={approved ? "Onaylanmış yorum yok." : "Onay bekleyen yorum yok."} />
      ) : (
        <ul className="space-y-3">
          {rows.map((r) => (
            <li key={r.id} className="rounded-lg border border-zinc-200 bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="flex text-amber-500" aria-label={`${r.rating} yıldız`}>
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star key={i} className="size-3.5" fill={i < r.rating ? "currentColor" : "none"} />
                      ))}
                    </span>
                    <span className="font-medium">{r.name}</span>
                    <span className="text-xs text-zinc-400">{formatDate(r.createdAt)}</span>
                  </div>
                  <p className="mt-2 text-sm text-zinc-800">{r.comment}</p>
                  {r.productName && (
                    <Link href={`/urun/${r.productSlug}`} target="_blank" className="mt-2 inline-block text-xs text-zinc-500 hover:underline">
                      {r.productName}
                    </Link>
                  )}
                </div>
                <div className="flex gap-2">
                  <form action={setReviewApproval}>
                    <input type="hidden" name="id" value={r.id} />
                    <input type="hidden" name="approve" value={approved ? "0" : "1"} />
                    <SubmitButton className={btnSecondary}>{approved ? "Yayından kaldır" : "Onayla"}</SubmitButton>
                  </form>
                  <ConfirmForm action={deleteReview} id={r.id} message="Yorum silinsin mi?">
                    Sil
                  </ConfirmForm>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
