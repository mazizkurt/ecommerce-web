import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/shop/account-forms";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Giriş Yap", robots: { index: false } };

export default async function LoginPage({ searchParams }: PageProps<"/giris">) {
  const sp = await searchParams;
  const next = typeof sp.next === "string" ? sp.next : undefined;
  if (await getCurrentUser()) redirect(next?.startsWith("/") ? next : "/hesabim");

  return (
    <div className="mx-auto max-w-md px-4 py-14">
      <h1 className="mb-8 text-center text-2xl">Üye Girişi</h1>
      <LoginForm next={next} />
      <p className="mt-4 text-right text-[13px]">
        <Link href="/sifremi-unuttum" className="text-zinc-600 underline hover:text-black">
          Şifremi unuttum
        </Link>
      </p>
      <p className="mt-6 text-center text-sm text-zinc-600">
        Hesabınız yok mu?{" "}
        <Link href={`/uye-ol${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-medium text-black underline">
          Hemen üye olun
        </Link>
      </p>
    </div>
  );
}
