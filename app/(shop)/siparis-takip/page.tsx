import type { Metadata } from "next";
import { TrackOrderForm } from "@/components/shop/account-forms";

export const metadata: Metadata = { title: "Sipariş Takip" };

export default function TrackOrderPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-14">
      <h1 className="mb-2 text-center text-2xl">Sipariş Takip</h1>
      <p className="mb-8 text-center text-sm text-zinc-600">
        Sipariş numaranızı ve siparişte kullandığınız e-posta ya da telefonu girin.
      </p>
      <TrackOrderForm />
    </div>
  );
}
