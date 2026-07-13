import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServer, supabaseConfigured } from "@/lib/supabase/server";

/**
 * Handles the link in Supabase auth emails (password recovery, email confirm, etc.).
 * Establishes the session cookies, then forwards the user to `next` (the
 * set-a-new-password screen for recovery). Supports both:
 *
 *   1. The DEFAULT Supabase email — arrives here with `?code=…` (PKCE); we call
 *      exchangeCodeForSession. No email-template editing (and no custom SMTP) needed.
 *   2. A CUSTOM template — `?token_hash=…&type=recovery&next=/reset-password`; verifyOtp.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/reset-password";
  // Only allow same-origin relative redirects.
  const dest = next.startsWith("/") ? next : "/reset-password";

  const failure = new URL("/login", origin);
  failure.searchParams.set("error", "reset_link");

  if (!supabaseConfigured()) {
    return NextResponse.redirect(failure);
  }

  const supabase = await createSupabaseServer();

  // Default email (PKCE code flow).
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    return NextResponse.redirect(error ? failure : new URL(dest, origin));
  }

  // Custom email template (OTP token_hash flow).
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    return NextResponse.redirect(error ? failure : new URL(dest, origin));
  }

  return NextResponse.redirect(failure);
}
