import { createHash, randomBytes } from "node:crypto";
import { cache } from "react";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { sql, dbConfigured } from "@/lib/db/pool";

/* The app's own login sessions.

   A random token lives in an httpOnly cookie; the database only stores its
   sha256 (auth.sessions.id), so a database leak can't be replayed as a login.
   Sessions slide: each use within the last half of the window pushes the
   expiry out again, so active users stay signed in like before. */

export const SESSION_COOKIE = "gcs_session";
const SESSION_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function newToken(): string {
  return randomBytes(32).toString("base64url");
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string | null | undefined): Promise<boolean> {
  if (!hash) return false;
  try {
    return await bcrypt.compare(password, hash);
  } catch {
    return false;
  }
}

/** Start a session for `userId` and set the cookie. Only callable from a
    Server Action or Route Handler (cookies can't be set while rendering). */
export async function createSession(userId: string): Promise<void> {
  const token = newToken();
  const expires = new Date(Date.now() + SESSION_DAYS * DAY_MS);
  await sql()`insert into auth.sessions (id, user_id, expires_at) values (${hashToken(token)}, ${userId}, ${expires})`;
  await sql()`update auth.users set last_sign_in_at = now() where id = ${userId}`;
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    // The database expiry is the real limit; the cookie just outlives it.
    maxAge: 400 * 24 * 60 * 60,
  });
}

/** End the current session (and clear the cookie). */
export async function destroySession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token && dbConfigured()) {
    await sql()`delete from auth.sessions where id = ${hashToken(token)}`;
  }
  jar.delete(SESSION_COOKIE);
}

/** End every session a user has (after a password change, other devices). */
export async function destroyAllSessions(userId: string, exceptCurrent = true): Promise<void> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  const keep = exceptCurrent && token ? hashToken(token) : "";
  await sql()`delete from auth.sessions where user_id = ${userId} and id <> ${keep}`;
}

export type AuthUser = { id: string; email: string };

/** The logged-in user for this request, or null. Cached per request. */
export const currentUser = cache(async (): Promise<AuthUser | null> => {
  if (!dbConfigured()) return null;
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const id = hashToken(token);
  const rows = await sql()<{ user_id: string; email: string; expires_at: Date }[]>`
    select s.user_id, u.email, s.expires_at
    from auth.sessions s join auth.users u on u.id = s.user_id
    where s.id = ${id} and s.expires_at > now()`;
  const row = rows[0];
  if (!row) return null;
  if (row.expires_at.getTime() - Date.now() < (SESSION_DAYS / 2) * DAY_MS) {
    const expires = new Date(Date.now() + SESSION_DAYS * DAY_MS);
    await sql()`update auth.sessions set expires_at = ${expires} where id = ${id}`;
  }
  return { id: row.user_id, email: row.email };
});

export async function currentUserId(): Promise<string | null> {
  return (await currentUser())?.id ?? null;
}
