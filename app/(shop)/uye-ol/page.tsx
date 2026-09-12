import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/shop/account-forms";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Üye Ol" };

export default async function RegisterPage({ searchParams }: PageProps<"/uye-ol">) {
  const sp = await searchParams;
  const next = typeof sp.next === "string" ? sp.next : undefined;
  if (await getCurrentUser()) redirect("/hesabim");

  return (
    <div className="mx-auto max-w-md px-4 py-14">
      <h1 className="mb-8 text-center text-2xl">Üye Ol</h1>
      <RegisterForm next={next} />
      <p className="mt-6 text-center text-sm text-zinc-600">
        Zaten üye misiniz?{" "}
        <Link href="/giris" className="font-medium text-black underline">
          Giriş yapın
        </Link>
      </p>
    </div>
  );
}
