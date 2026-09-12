"use client";

import { useActionState } from "react";
import { requestPasswordReset, resetPassword } from "@/lib/actions/account";
import {
  type FormState,
  loginCustomer,
  registerCustomer,
  trackOrder,
} from "@/lib/actions/shop";
import { cn } from "@/lib/cn";

const inputCls = (error?: string) =>
  cn(
    "h-11 w-full border bg-white px-3 text-sm outline-none focus:border-black",
    error ? "border-red-500" : "border-zinc-300",
  );

function Input({
  label,
  error,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] text-zinc-700">{label}</span>
      <input {...props} className={inputCls(error)} />
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  );
}

function Submit({ pending, children }: { pending: boolean; children: React.ReactNode }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="h-11 w-full bg-brand text-sm font-medium text-brand-text transition-colors hover:bg-cart-hover disabled:opacity-60"
    >
      {pending ? "Lütfen bekleyin..." : children}
    </button>
  );
}

export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(loginCustomer, {});
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next ?? ""} />
      <Input label="E-posta" name="email" type="email" autoComplete="email" required defaultValue={state.values?.email} />
      <Input label="Şifre" name="password" type="password" autoComplete="current-password" required />
      {state.message && <p className="text-[13px] text-red-600">{state.message}</p>}
      <Submit pending={pending}>GİRİŞ YAP</Submit>
    </form>
  );
}

export function RegisterForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(registerCustomer, {});
  const e = state.errors ?? {};
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next ?? ""} />
      <Input label="Ad Soyad" name="name" autoComplete="name" defaultValue={state.values?.name} error={e.name} />
      <Input label="E-posta" name="email" type="email" autoComplete="email" defaultValue={state.values?.email} error={e.email} />
      <Input label="Cep Telefonu (isteğe bağlı)" name="phone" type="tel" autoComplete="tel" defaultValue={state.values?.phone} error={e.phone} />
      <Input label="Şifre (en az 8 karakter)" name="password" type="password" autoComplete="new-password" error={e.password} />
      <Submit pending={pending}>ÜYE OL</Submit>
    </form>
  );
}

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(requestPasswordReset, {});
  if (state.ok) return <p className="bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{state.message}</p>;
  return (
    <form action={action} className="space-y-4">
      <Input label="E-posta" name="email" type="email" autoComplete="email" required defaultValue={state.values?.email} />
      {state.message && <p className="text-[13px] text-red-600">{state.message}</p>}
      <Submit pending={pending}>SIFIRLAMA BAĞLANTISI GÖNDER</Submit>
    </form>
  );
}

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(resetPassword, {});
  const e = state.errors ?? {};
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      <Input label="Yeni şifre (en az 8 karakter)" name="password" type="password" autoComplete="new-password" error={e.password} />
      <Input label="Yeni şifre (tekrar)" name="confirm" type="password" autoComplete="new-password" error={e.confirm} />
      {state.message && <p className="text-[13px] text-red-600">{state.message}</p>}
      <Submit pending={pending}>ŞİFREMİ GÜNCELLE</Submit>
    </form>
  );
}

export function TrackOrderForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(trackOrder, {});
  return (
    <form action={action} className="space-y-4">
      <Input label="Sipariş Numarası" name="orderNo" inputMode="numeric" placeholder="Örn. 100001" required defaultValue={state.values?.orderNo} />
      <Input label="E-posta veya Telefon" name="contact" required defaultValue={state.values?.contact} />
      {state.message && <p className="text-[13px] text-red-600">{state.message}</p>}
      <Submit pending={pending}>SİPARİŞİMİ SORGULA</Submit>
    </form>
  );
}
