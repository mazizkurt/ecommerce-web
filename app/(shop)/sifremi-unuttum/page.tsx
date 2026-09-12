import type { Metadata } from "next";
import Link from "next/link";
import { ForgotPasswordForm } from "@/components/shop/account-forms";

export const metadata: Metadata = { title: "Şifremi Unuttum", robots: { index: false } };

export default function ForgotPasswordPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-14">
      <h1 className="mb-2 text-center text-2xl">Şifremi Unuttum</h1>
      <p className="mb-8 text-center text-sm text-zinc-600">
        Hesabınıza kayıtlı e-posta adresini girin, şifre sıfırlama bağlantısı gönderelim.
      </p>
      <ForgotPasswordForm />
      <p className="mt-6 text-center text-sm">
        <Link href="/giris" className="underline">
          Girişe dön
        </Link>
      </p>
    </div>
  );
}
