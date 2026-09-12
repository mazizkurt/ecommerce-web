"use client";

import { Mail } from "lucide-react";
import { useActionState } from "react";
import { type FormState, subscribeNewsletter } from "@/lib/actions/shop";

export function Newsletter() {
  const [state, action, pending] = useActionState<FormState, FormData>(
    subscribeNewsletter,
    {},
  );
  return (
    <section className="flex flex-col items-center justify-center bg-soft px-6 py-16 text-center md:px-12 md:py-[100px]">
      <h2 className="mb-5 text-xl font-semibold text-[#222]">E-BÜLTEN ABONELİĞİ</h2>
      <p className="mb-4 text-sm">
        Kampanya, duyuru, bilgilendirmelerden e-posta ile haberdar olmak istiyorum.
      </p>
      <form action={action} className="relative w-full max-w-[500px]">
        <input
          type="email"
          name="email"
          required
          placeholder="E-Posta adresinizi yazınız"
          aria-label="E-posta adresi"
          className="h-[45px] w-full bg-white pl-3 pr-24 text-[13px] outline-none"
        />
        <button
          type="submit"
          disabled={pending}
          className="absolute right-0 top-0 flex h-[45px] items-center gap-1.5 px-3 text-[13px] font-medium disabled:opacity-50"
        >
          <Mail className="size-4" /> Gönder
        </button>
      </form>
      {state.message && (
        <p
          role="status"
          className={`mt-3 text-sm ${state.ok ? "text-emerald-700" : "text-red-600"}`}
        >
          {state.message}
        </p>
      )}
    </section>
  );
}
