import type { Metadata } from "next";
import Link from "next/link";
import { ResetPasswordForm } from "@/components/shop/account-forms";

export const metadata: Metadata = { title: "Yeni Şifre Belirle", robots: { index: false } };

export default async function ResetPasswordPage({ searchParams }: PageProps<"/sifre-sifirla">) {
  const sp = await searchParams;
  const token = typeof sp.token === "string" ? sp.token : "";

  return (
    <div className="mx-auto max-w-md px-4 py-14">
      <h1 className="mb-8 text-center text-2xl">Yeni Şifre Belirle</h1>
      {token ? (
        <ResetPasswordForm token={token} />
      ) : (
        <p className="text-center text-sm text-zinc-600">
          Bağlantı eksik veya hatalı.{" "}
          <Link href="/sifremi-unuttum" className="underline">
            Yeniden şifre sıfırlama isteyin
          </Link>
          .
        </p>
      )}
    </div>
  );
}
