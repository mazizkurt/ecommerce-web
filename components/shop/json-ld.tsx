/** Arama motorları için yapısal veri (schema.org JSON-LD). */
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

/** Sayfa yolunu (ör. /urun/x veya tam URL) mutlak adrese çevirir. */
export function absoluteUrl(base: string, url: string) {
  return /^https?:\/\//.test(url) ? url : `${base}${url.startsWith("/") ? "" : "/"}${url}`;
}

/** Görünen "Ana Sayfa > Kategori > ..." yolunun yapısal veri karşılığı. */
export function breadcrumbLd(base: string, items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(base, item.path),
    })),
  };
}

/** Meta açıklaması için metni tek satıra indirip kısaltır. */
export function excerpt(text: string, max = 160) {
  const clean = text.replace(/^##\s+/gm, "").replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  return `${cut.slice(0, cut.lastIndexOf(" ") > 80 ? cut.lastIndexOf(" ") : cut.length)}…`;
}
