"use client";

import { CheckCircle2, CircleAlert } from "lucide-react";
import { startTransition, useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { FormState } from "@/lib/form-utils";
import { btnDanger, btnPrimary } from "./ui";

/**
 * useActionState + onSubmit: React'in form action sonrası alanları sıfırlamasını
 * engeller, böylece doğrulama hatasında yazılanlar kaybolmaz.
 */
export function useAdminAction(
  action: (prev: FormState, formData: FormData) => Promise<FormState>,
) {
  const [state, formAction, pending] = useActionState(action, {});
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(() => formAction(formData));
  };
  return { state, onSubmit, pending };
}

export function FormMessage({ state }: { state: FormState }) {
  if (!state.message) return null;
  return (
    <p
      role="status"
      className={
        state.ok
          ? "flex items-center gap-2 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800"
          : "flex items-center gap-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700"
      }
    >
      {state.ok ? <CheckCircle2 className="size-4" /> : <CircleAlert className="size-4" />}
      {state.message}
    </p>
  );
}

export function SubmitButton({
  children,
  pending: pendingProp,
  className = btnPrimary,
}: {
  children: React.ReactNode;
  pending?: boolean;
  className?: string;
}) {
  const status = useFormStatus();
  const pending = pendingProp ?? status.pending;
  return (
    <button type="submit" disabled={pending} className={className}>
      {pending ? "Kaydediliyor..." : children}
    </button>
  );
}

/** Silme gibi geri alınamaz işlemler için onay isteyen form. */
export function ConfirmForm({
  action,
  id,
  message,
  children,
  className = btnDanger,
  extra,
}: {
  action: (formData: FormData) => Promise<void>;
  id: number;
  message: string;
  children: React.ReactNode;
  className?: string;
  extra?: Record<string, string>;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm(message)) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      {extra &&
        Object.entries(extra).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
      <SubmitButton className={className}>{children}</SubmitButton>
    </form>
  );
}
