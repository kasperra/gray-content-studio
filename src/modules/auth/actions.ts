"use server";

import { sql, dbConfigured } from "@/lib/db/pool";
import { adminDb } from "@/lib/db";
import {
  createSession,
  currentUser,
  destroyAllSessions,
  destroySession,
  hashPassword,
  hashToken,
  newToken,
  verifyPassword,
} from "@/lib/auth/session";
import { envStr, mailFrom, sendMail } from "@/lib/mail";
import { SITE_URL } from "@/lib/site";

type Result = { ok: true; dest: string } | { ok: false; error: string };

/* Simple brute-force brake: per email, at most 10 failed sign-ins in 15
   minutes. In memory, so it resets on restart; that's fine for one server. */
const failures = new Map<string, { n: number; since: number }>();
const WINDOW_MS = 15 * 60 * 1000;

function throttled(email: string): boolean {
  const f = failures.get(email);
  if (!f) return false;
  if (Date.now() - f.since > WINDOW_MS) {
    failures.delete(email);
    return false;
  }
  return f.n >= 10;
}

function recordFailure(email: string) {
  const f = failures.get(email);
  if (!f || Date.now() - f.since > WINDOW_MS) failures.set(email, { n: 1, since: Date.now() });
  else f.n++;
}

async function landingFor(userId: string): Promise<string> {
  const { data } = await adminDb().from("profiles").select("role").eq("id", userId).maybeSingle();
  return data?.role === "admin" ? "/admin" : "/portal";
}

/** Only same-origin relative paths are accepted as a post-login destination. */
function safeNext(next: string | null | undefined): string | null {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : null;
}

export async function signIn(email: string, password: string, next?: string | null): Promise<Result> {
  if (!dbConfigured()) return { ok: false, error: "The portal isn't connected yet." };
  const e = email.trim().toLowerCase();
  if (!e || !password) return { ok: false, error: "Incorrect email or password." };
  if (throttled(e)) return { ok: false, error: "Too many attempts. Please wait a few minutes and try again." };

  const rows = await sql()<{ id: string; encrypted_password: string | null }[]>`
    select id, encrypted_password from auth.users where lower(email) = ${e}`;
  const user = rows[0];
  // Compare against a dummy hash when the user doesn't exist so timing doesn't
  // reveal which emails have accounts.
  const ok = await verifyPassword(password, user?.encrypted_password ?? "$2b$10$6HHGT7DX9IvDLRrjsE6jA.bXskIq/7HZNt8fqGWx7xDJeIMIzdhNS");
  if (!user || !ok) {
    recordFailure(e);
    return { ok: false, error: "Incorrect email or password." };
  }
  failures.delete(e);
  await createSession(user.id);
  return { ok: true, dest: safeNext(next) ?? (await landingFor(user.id)) };
}

export async function signOut(): Promise<void> {
  await destroySession();
}

/** Emails a one-hour reset link. Always reports success so the form can't be
    used to find out which emails have accounts. */
export async function requestPasswordReset(email: string): Promise<{ ok: boolean; error?: string }> {
  if (!dbConfigured()) return { ok: false, error: "The portal isn't connected yet." };
  const e = email.trim().toLowerCase();
  if (!e) return { ok: false, error: "Enter your email." };
  if (!envStr("RESEND_API_KEY")) return { ok: false, error: "Couldn't send the reset email. Please contact the studio." };

  const rows = await sql()<{ id: string }[]>`select id from auth.users where lower(email) = ${e}`;
  const user = rows[0];
  if (!user) return { ok: true };

  const token = newToken();
  await sql()`
    insert into auth.password_resets (id, user_id, expires_at)
    values (${hashToken(token)}, ${user.id}, now() + interval '1 hour')`;

  const base = (envStr("APP_URL") ?? SITE_URL).replace(/\/+$/, "");
  const link = `${base}/auth/confirm?token=${encodeURIComponent(token)}&next=/reset-password`;
  const from = envStr("AUTH_FROM_EMAIL") ?? envStr("CAMPAIGN_FROM_EMAIL") ?? mailFrom();
  await sendMail(
    e,
    {
      subject: "Reset your Gray Content Studio password",
      text: `Someone asked to reset the password for this email.\n\nSet a new password here (the link works for one hour):\n${link}\n\nIf this wasn't you, you can ignore this email.`,
      html: `<p>Someone asked to reset the password for this email.</p><p><a href="${link}">Set a new password</a> (the link works for one hour).</p><p>If this wasn't you, you can ignore this email.</p>`,
    },
    "auth-reset",
    { from }
  );
  return { ok: true };
}

/** Set a new password for the logged-in user (after a reset link, or any time). */
export async function updatePassword(password: string): Promise<Result> {
  const user = await currentUser();
  if (!user) return { ok: false, error: "Your reset link expired. Request a new one from the login page." };
  if (password.length < 8) return { ok: false, error: "Password must be at least 8 characters." };
  const hash = await hashPassword(password);
  await sql()`update auth.users set encrypted_password = ${hash}, updated_at = now() where id = ${user.id}`;
  await destroyAllSessions(user.id, true);
  return { ok: true, dest: await landingFor(user.id) };
}
