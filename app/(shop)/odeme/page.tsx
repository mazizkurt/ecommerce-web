import type { Metadata } from "next";
import { type CheckoutMethod, CheckoutForm } from "@/components/shop/checkout-form";
import { getCurrentUser } from "@/lib/auth";
import { getEnabledProviders } from "@/lib/payments";
import { enabledBuiltinMethods, getSettings, pricingFrom } from "@/lib/settings";

export const metadata: Metadata = { title: "Ödeme", robots: { index: false } };

export default async function CheckoutPage({ searchParams }: PageProps<"/odeme">) {
  const [settings, user, providers, sp] = await Promise.all([
    getSettings(),
    getCurrentUser(),
    getEnabledProviders(),
    searchParams,
  ]);
  const [firstName = "", ...rest] = (user?.name ?? "").split(" ");
  const builtins = enabledBuiltinMethods(settings);
  const { codFee } = pricingFrom(settings);

  const methods: CheckoutMethod[] = [
    ...providers.map((p) => ({ value: `card:${p.id}`, label: p.title, description: p.description, kind: "card" as const })),
    ...(builtins.includes("bank_transfer")
      ? [{ value: "bank_transfer", label: "Havale / EFT", description: settings.bankTransferText, kind: "bank" as const }]
      : []),
    ...(builtins.includes("cash_on_delivery")
      ? [{ value: "cash_on_delivery", label: "Kapıda Ödeme", description: settings.codText, kind: "cod" as const, fee: codFee }]
      : []),
  ];

  const paymentError =
    sp.odeme === "basarisiz"
      ? `Ödemeniz tamamlanamadı${typeof sp.mesaj === "string" && sp.mesaj ? `: ${sp.mesaj}` : "."} Sepetiniz korunuyor, tekrar deneyebilir veya başka bir ödeme yöntemi seçebilirsiniz.`
      : null;

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-8 lg:px-8">
      <h1 className="mb-6 text-2xl">Ödeme</h1>
      <CheckoutForm
        methods={methods}
        paymentError={paymentError}
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
