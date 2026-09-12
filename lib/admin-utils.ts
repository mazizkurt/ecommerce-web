import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "./db";
import type { categories, pages, products } from "./db/schema";

/** Mağaza sayfaları statik önbelleklenir; her değişiklikten sonra tazelenir. */
export function refreshStore() {
  revalidatePath("/", "layout");
}

export const str = (formData: FormData, key: string) => String(formData.get(key) ?? "").trim();
export const checkbox = (formData: FormData, key: string) => formData.get(key) === "on";
export const idFrom = (formData: FormData) => Number(formData.get("id")) || null;

export function parseJson(value: FormDataEntryValue | null): unknown {
  try {
    return JSON.parse(String(value ?? "[]"));
  } catch {
    return [];
  }
}

/** "2026-09-12T14:30" (datetime-local, İstanbul saati) → Date. */
export function parseLocalDateTime(value: string) {
  if (!value) return null;
  const date = new Date(`${value.length === 16 ? `${value}:00` : value}+03:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Date → datetime-local girişi için İstanbul saatinde "YYYY-MM-DDTHH:mm". */
export function toLocalDateTime(date: Date | null) {
  if (!date) return "";
  return new Date(date.getTime() + 3 * 3_600_000).toISOString().slice(0, 16);
}

export async function uniqueSlug(
  anyTable: typeof products | typeof categories | typeof pages,
  base: string,
  excludeId: number | null,
) {
  // Üç tablo da aynı id/slug sütunlarına sahip; sorgu kurucunun tek tip görmesi için daraltılır.
  const table = anyTable as typeof products;
  const root = base || "icerik";
  for (let i = 1; i < 500; i++) {
    const candidate = i === 1 ? root : `${root}-${i}`;
    const [clash] = await db
      .select({ id: table.id })
      .from(table)
      .where(excludeId ? and(eq(table.slug, candidate), ne(table.id, excludeId)) : eq(table.slug, candidate))
      .limit(1);
    if (!clash) return candidate;
  }
  return `${root}-${Date.now()}`;
}
