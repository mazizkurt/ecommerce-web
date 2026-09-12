import type { Metadata } from "next";
import { CheckoutForm } from "@/components/shop/checkout-form";
import { getCurrentUser } from "@/lib/auth";
import { enabledPaymentMethods, getSettings } from "@/lib/settings";

export const metadata: Metadata = { title: "Ödeme", robots: { index: false } };

export default async function CheckoutPage() {
  const [settings, user] = await Promise.all([getSettings(), getCurrentUser()]);
  const [firstName = "", ...rest] = (user?.name ?? "").split(" ");

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-8 lg:px-8">
      <h1 className="mb-6 text-2xl">Ödeme</h1>
      <CheckoutForm
        methods={enabledPaymentMethods(settings)}
        defaults={{
          email: user?.email ?? "",
          phone: user?.phone ?? "",
          firstName,
          lastName: rest.join(" "),
        }}
      />
    </div>
  );
}
