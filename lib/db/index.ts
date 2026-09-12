import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error(
    "DATABASE_URL tanımlı değil. .env dosyasına örn. postgres://kullanici:sifre@localhost:5432/ecommerce_web ekleyin.",
  );
}

// Geliştirmede her hot-reload'da yeni bağlantı havuzu açılmasın.
const globalForDb = globalThis as unknown as { pgPool?: Pool };

const pool = globalForDb.pgPool ?? new Pool({ connectionString, max: 10 });
if (process.env.NODE_ENV !== "production") globalForDb.pgPool = pool;

export const db = drizzle({ client: pool, schema });
export type DB = typeof db;
