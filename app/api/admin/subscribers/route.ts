import { desc } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { subscribers } from "@/lib/db/schema";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return new Response("Yetkisiz", { status: 401 });
  }
  const rows = await db.select().from(subscribers).orderBy(desc(subscribers.createdAt));
  const csv = [
    "email,kayit_tarihi",
    ...rows.map((r) => `${r.email.replace(/[",\n]/g, "")},${r.createdAt.toISOString()}`),
  ].join("\n");
  return new Response(`﻿${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="bulten-aboneleri.csv"`,
    },
  });
}
