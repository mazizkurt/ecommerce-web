import { defineConfig } from "drizzle-kit";

try {
  process.loadEnvFile();
} catch {
  // .env yoksa ortam değişkenleri kullanılır
}

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
