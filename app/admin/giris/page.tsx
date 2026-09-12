import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminLoginForm } from "@/components/admin/login-form";
import { getCurrentUser } from "@/lib/auth";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Yönetici Girişi",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage() {
  const [user, settings] = await Promise.all([getCurrentUser(), getSettings()]);
  if (user?.role === "admin") redirect("/admin");

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-8 shadow-sm">
        <p className="text-center font-logo text-3xl tracking-[0.16em]">{settings.logoText}</p>
        <h1 className="mt-2 text-center text-sm text-zinc-500">Yönetim Paneli Girişi</h1>
        <AdminLoginForm />
      </div>
    </div>
  );
}
