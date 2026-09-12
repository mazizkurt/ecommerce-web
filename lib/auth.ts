import { createHash, randomBytes } from "node:crypto";
import { eq, lt } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { db } from "./db";
import { sessions, users } from "./db/schema";

export const SESSION_COOKIE = "sid";
const SESSION_DAYS = 30;

const hashToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");

export type CurrentUser = {
  id: number;
  email: string;
  name: string;
  phone: string | null;
  role: "admin" | "customer";
};

export async function createSession(userId: number) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await db.delete(sessions).where(lt(sessions.expiresAt, new Date()));
  await db.insert(sessions).values({ id: hashToken(token), userId, expiresAt });
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) await db.delete(sessions).where(eq(sessions.id, hashToken(token)));
  store.delete(SESSION_COOKIE);
}

export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const [row] = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      phone: users.phone,
      role: users.role,
      expiresAt: sessions.expiresAt,
    })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(eq(sessions.id, hashToken(token)))
    .limit(1);
  if (!row || row.expiresAt < new Date()) return null;
  return { id: row.id, email: row.email, name: row.name, phone: row.phone, role: row.role };
});

/** Her yönetim sayfasında ve Server Action'da çağrılmalıdır. */
export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") redirect("/admin/giris");
  return user;
}

export async function requireUser(next = "/hesabim") {
  const user = await getCurrentUser();
  if (!user) redirect(`/giris?next=${encodeURIComponent(next)}`);
  return user;
}
