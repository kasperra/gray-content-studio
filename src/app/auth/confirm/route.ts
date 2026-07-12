import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServer, supabaseConfigured } from "@/lib/supabase/server";

/**
 * Handles the link in Supabase auth emails (password recovery, email confirm, etc.).
 * Verifies the one-time token, which sets the session cookies, then forwards the
 * user to `next` (the set-a-new-password screen for recovery).
 *
 * Requires the Supabase email template to point here, e.g.:
 *   {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/reset-password
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/reset-password";

  const failure = new URL("/login", origin);
  failure.searchParams.set("error", "reset_link");

  if (!supabaseConfigured() || !token_hash || !type) {
    return NextResponse.redirect(failure);
  }

  const supabase = await createSupabaseServer();
  const { error } = await supabase.auth.verifyOtp({ type, token_hash });
  if (error) {
    return NextResponse.redirect(failure);
  }

  // Only allow same-origin relative redirects.
  const dest = next.startsWith("/") ? next : "/reset-password";
  return NextResponse.redirect(new URL(dest, origin));
}
