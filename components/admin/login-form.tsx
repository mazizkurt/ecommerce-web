"use client";

import { useActionState } from "react";
import { adminLogin } from "@/lib/actions/admin";
import type { FormState } from "@/lib/form-utils";
import { btnPrimary, inputCls } from "./ui";

export function AdminLoginForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(adminLogin, {});
  return (
    <form action={action} className="mt-8 space-y-4">
      <label className="block">
        <span className="mb-1.5 block text-[13px] font-medium text-zinc-700">E-posta</span>
        <input name="email" type="email" required autoComplete="username" defaultValue={state.values?.email} className={inputCls} />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-[13px] font-medium text-zinc-700">Şifre</span>
        <input name="password" type="password" required autoComplete="current-password" className={inputCls} />
      </label>
      {state.message && <p className="text-sm text-red-600">{state.message}</p>}
      <button type="submit" disabled={pending} className={`${btnPrimary} w-full`}>
        {pending ? "Giriş yapılıyor..." : "Giriş Yap"}
      </button>
    </form>
  );
}
