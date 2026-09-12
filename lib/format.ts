const priceFormatter = new Intl.NumberFormat("tr-TR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Kuruş cinsinden tutarı "1.599,21 TL" biçiminde gösterir. */
export function formatPrice(kurus: number) {
  return `${priceFormatter.format(kurus / 100)} TL`;
}

/** Kuruşu form alanlarında gösterilecek "1599,21" biçimine çevirir. */
export function kurusToInput(kurus: number | null | undefined) {
  if (kurus == null) return "";
  return (kurus / 100).toFixed(2).replace(".", ",");
}

/** "1.599,21", "1599.21" veya "1599" girdilerini kuruşa çevirir. */
export function parsePrice(input: FormDataEntryValue | null | undefined) {
  if (typeof input !== "string") return null;
  let s = input.trim().replace(/\s|TL|₺/gi, "");
  if (!s) return null;
  if (s.includes(",")) s = s.replace(/\./g, "").replace(",", ".");
  const value = Number(s);
  if (!Number.isFinite(value) || value < 0) return null;
  return Math.round(value * 100);
}

const trMap: Record<string, string> = {
  ç: "c",
  ğ: "g",
  ı: "i",
  i: "i",
  ö: "o",
  ş: "s",
  ü: "u",
};

export function slugify(input: string) {
  return input
    .toLocaleLowerCase("tr-TR")
    .replace(/[çğıöşü]/g, (ch) => trMap[ch] ?? ch)
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

const dateFormatter = new Intl.DateTimeFormat("tr-TR", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Europe/Istanbul",
});

export function formatDate(date: Date) {
  return dateFormatter.format(date);
}

/** Yorumlarda isimleri "A** K**" biçiminde maskeler. */
export function maskName(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .map((part) => `${part.charAt(0).toLocaleUpperCase("tr-TR")}**`)
    .join(" ");
}
