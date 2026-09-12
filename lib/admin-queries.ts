import { asc, eq } from "drizzle-orm";
import { db } from "./db";
import { products, productVariants } from "./db/schema";

/** Sipariş düzenleme/oluşturma ekranındaki ürün-beden seçici için. */
export async function getVariantOptions() {
  const rows = await db
    .select({
      variantId: productVariants.id,
      productName: products.name,
      code: products.code,
      size: productVariants.size,
      stock: productVariants.stock,
      price: products.price,
    })
    .from(productVariants)
    .innerJoin(products, eq(products.id, productVariants.productId))
    .orderBy(asc(products.name), asc(productVariants.sortOrder));
  return rows.map((r) => ({
    variantId: r.variantId,
    productName: r.code ? `${r.productName} (${r.code})` : r.productName,
    size: r.size,
    stock: r.stock,
    price: r.price,
  }));
}
