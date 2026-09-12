"use client";

import { createAdmin, setUserPassword, updateCustomer, updateOwnAccount } from "@/lib/actions/admin-users";
import { FormMessage, SubmitButton, useAdminAction } from "./form-client";
import { btnSecondary, Field, inputCls } from "./ui";

type Profile = { id: number; name: string; email: string; phone: string | null };

function ProfileFields({ user, errors }: { user?: Profile; errors: Record<string, string> }) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Field label="Ad soyad" error={errors.name}>
        <input name="name" defaultValue={user?.name} className={inputCls} />
      </Field>
      <Field label="E-posta" error={errors.email}>
        <input name="email" type="email" defaultValue={user?.email} className={inputCls} />
      </Field>
      <Field label="Telefon" error={errors.phone}>
        <input name="phone" type="tel" defaultValue={user?.phone ?? ""} className={inputCls} />
      </Field>
    </div>
  );
}

export function CustomerForm({ customer }: { customer: Profile }) {
  const { state, onSubmit, pending } = useAdminAction(updateCustomer);
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <input type="hidden" name="id" value={customer.id} />
      <ProfileFields user={customer} errors={state.errors ?? {}} />
      <div className="flex flex-wrap items-center gap-4">
        <SubmitButton pending={pending}>Kaydet</SubmitButton>
        <FormMessage state={state} />
      </div>
    </form>
  );
}

export function SetPasswordForm({ userId }: { userId: number }) {
  const { state, onSubmit, pending } = useAdminAction(setUserPassword);
  return (
    <form onSubmit={onSubmit} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="id" value={userId} />
      <Field label="Yeni şifre" hint="En az 8 karakter. Müşteriye iletmeyi unutmayın." error={state.errors?.password} className="min-w-60 flex-1">
        <input name="password" type="text" autoComplete="off" className={inputCls} />
      </Field>
      <SubmitButton pending={pending} className={btnSecondary}>
        Şifreyi belirle
      </SubmitButton>
      <div className="w-full">
        <FormMessage state={state} />
      </div>
    </form>
  );
}

export function CreateAdminForm() {
  const { state, onSubmit, pending } = useAdminAction(createAdmin);
  const e = state.errors ?? {};
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Ad soyad" error={e.name}>
          <input name="name" className={inputCls} />
        </Field>
        <Field label="E-posta" error={e.email}>
          <input name="email" type="email" className={inputCls} />
        </Field>
        <Field label="Şifre (en az 8 karakter)" error={e.password}>
          <input name="password" type="text" autoComplete="off" className={inputCls} />
        </Field>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <SubmitButton pending={pending}>Yönetici ekle</SubmitButton>
        <FormMessage state={state} />
      </div>
    </form>
  );
}

export function OwnAccountForm({ user }: { user: Profile }) {
  const { state, onSubmit, pending } = useAdminAction(updateOwnAccount);
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <ProfileFields user={user} errors={state.errors ?? {}} />
      <div className="flex flex-wrap items-center gap-4">
        <SubmitButton pending={pending}>Hesabımı güncelle</SubmitButton>
        <FormMessage state={state} />
      </div>
    </form>
  );
}
