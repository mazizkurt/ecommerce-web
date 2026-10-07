import { type AnyColumn, type SQL, sql } from "drizzle-orm";

/**
 * Türkçe harflere duyarsız arama. Veritabanı İngilizce kurallarla büyük/küçük harf
 * çevirdiği için "TAKIM" küçültülünce "takim" olur ve "takım" ile eşleşmez.
 * Hem sütun hem aranan metin aynı şekilde sadeleştirilir: "Takım", "TAKIM", "takım"
 * ve "takim" aynı sonucu verir.
 */
const TR_FROM = "İIıŞşĞğÜüÖöÇç";
const TR_TO = "iiissgguuoocc";
const TR_MAP = new Map([...TR_FROM].map((ch, i) => [ch, TR_TO[i]]));

/** Veritabanındaki lower(translate(...)) ile birebir aynı dönüşüm. */
export function foldTr(text: string) {
  return [...text].map((ch) => TR_MAP.get(ch) ?? ch).join("").toLowerCase();
}

/** LIKE içindeki %, _ ve \ karakterlerini düz metin olarak arar. */
function escapeLike(text: string) {
  return text.replace(/[\\%_]/g, "\\$&");
}

/** Sütun, aranan metni (Türkçe harflere ve büyük/küçük harfe duyarsız) içeriyor mu? */
export function containsTr(column: AnyColumn | SQL, query: string): SQL {
  const term = `%${escapeLike(foldTr(query.trim()))}%`;
  return sql`lower(translate(${column}, ${TR_FROM}, ${TR_TO})) like ${term}`;
}
