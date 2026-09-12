import { buildCategoryTree, type Category, type CategoryNode } from "./queries";

export type FlatCategory = Category & { depth: number };

/** Kategori ağacını girintili seçim listeleri için düz listeye çevirir. */
export function flattenCategories(list: Category[]): FlatCategory[] {
  const out: FlatCategory[] = [];
  const walk = (nodes: CategoryNode[], depth: number) => {
    for (const { children, ...rest } of nodes) {
      out.push({ ...rest, depth });
      walk(children, depth + 1);
    }
  };
  walk(buildCategoryTree(list), 0);
  return out;
}

/** 0532... / 532... / +90532... biçimlerini wa.me için 90532... biçimine çevirir. */
export function toWhatsAppNumber(phone: string) {
  const d = phone.replace(/\D/g, "");
  if (d.startsWith("90") && d.length === 12) return d;
  if (d.startsWith("0") && d.length === 11) return `9${d}`;
  if (d.length === 10) return `90${d}`;
  return d;
}
