"use client";

import { Star } from "lucide-react";
import { useActionState, useState } from "react";
import { type FormState, submitReview } from "@/lib/actions/shop";
import { cn } from "@/lib/cn";

export function ReviewForm({ productId }: { productId: number }) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [state, action, pending] = useActionState<FormState, FormData>(submitReview, {});

  if (state.ok) {
    return <p className="py-4 text-center text-sm text-emerald-700">{state.message}</p>;
  }

  if (!open) {
    return (
      <div className="flex justify-center">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-[3px] border border-zinc-400 px-3 py-1.5 text-sm hover:border-black"
        >
          Yorum Yap
        </button>
      </div>
    );
  }

  return (
    <form action={action} className="mx-auto max-w-lg space-y-3">
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="rating" value={rating} />
      <div className="flex justify-center gap-1 text-star">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            aria-label={`${n} yıldız`}
          >
            <Star className="size-6" fill={n <= rating ? "currentColor" : "none"} strokeWidth={1.5} />
          </button>
        ))}
      </div>
      <input
        name="name"
        placeholder="Adınız Soyadınız"
        defaultValue={state.values?.name}
        className={cn(
          "h-11 w-full border px-3 text-sm outline-none focus:border-black",
          state.errors?.name ? "border-red-500" : "border-zinc-300",
        )}
      />
      <textarea
        name="comment"
        rows={4}
        placeholder="Ürün hakkındaki düşünceleriniz"
        defaultValue={state.values?.comment}
        className={cn(
          "w-full border p-3 text-sm outline-none focus:border-black",
          state.errors?.comment ? "border-red-500" : "border-zinc-300",
        )}
      />
      {(state.errors?.name || state.errors?.comment || state.message) && (
        <p className="text-[13px] text-red-600">
          {state.errors?.name ?? state.errors?.comment ?? state.message}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="h-11 w-full bg-black text-sm font-medium text-white disabled:opacity-60"
      >
        {pending ? "Gönderiliyor..." : "YORUMU GÖNDER"}
      </button>
    </form>
  );
}
