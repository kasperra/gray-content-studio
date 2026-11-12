import { NextResponse, type NextRequest } from "next/server";
import { sql, dbConfigured } from "@/lib/db/pool";
import { createSession, hashToken } from "@/lib/auth/session";

/**
 * Handles the link in password-reset emails (`?token=…&next=/reset-password`).
 * Uses the one-time token, starts a session, then forwards the user to `next`
 * (the set-a-new-password screen).
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  // Behind the VPS proxy the request URL is the container's own address, so
  // rebuild the public origin from the forwarded headers.
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") ?? "https";
  const origin = host ? `${proto.split(",")[0]}://${host.split(",")[0]}` : request.nextUrl.origin;
  const token = searchParams.get("token");
  const next = searchParams.get("next") ?? "/reset-password";
  // Only allow same-origin relative redirects.
  const dest = next.startsWith("/") && !next.startsWith("//") ? next : "/reset-password";

  const failure = new URL("/login", origin);
  failure.searchParams.set("error", "reset_link");

  if (!dbConfigured() || !token) return NextResponse.redirect(failure);

  // Mark the token used in the same statement that checks it, so a link only works once.
  const rows = await sql()<{ user_id: string }[]>`
    update auth.password_resets set used_at = now()
    where id = ${hashToken(token)} and used_at is null and expires_at > now()
    returning user_id`;
  if (!rows[0]) {
    failure.searchParams.set("error", "reset_expired");
    return NextResponse.redirect(failure);
  }

  await createSession(rows[0].user_id);
  return NextResponse.redirect(new URL(dest, origin));
}
