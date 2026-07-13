"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase/client";

const fieldCls =
  "w-full font-body text-base text-ink bg-bg border border-rule rounded px-4 py-3 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/50 transition-colors";
const btnCls =
  "rounded-full bg-accent text-bg border border-accent font-semibold uppercase text-[0.85rem] tracking-[0.08em] py-3 transition-all duration-200 hover:bg-transparent hover:text-accent active:translate-y-px disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg";
const linkCls =
  "text-accent text-[0.82rem] font-medium hover:underline underline-offset-4 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface cursor-pointer";

const ERROR_NOTICES: Record<string, string> = {
  reset_link: "That reset link was invalid or already used. Enter your email below to get a fresh one.",
  reset_expired: "Your reset link expired. Enter your email below to get a fresh one.",
};

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const setupMode = params.get("setup") === "1";
  const errorParam = params.get("error");

  const [mode, setMode] = useState<"signin" | "forgot">(errorParam ? "forgot" : "signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(errorParam ? ERROR_NOTICES[errorParam] ?? "" : "");
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);

  if (setupMode) {
    return (
      <div className="w-full max-w-100 bg-surface border border-rule rounded-lg p-9 text-center">
        <h1 className="font-display text-[1.5rem] font-semibold">Portal not connected yet</h1>
        <p className="text-muted text-[0.92rem] mt-3">
          The client portal backend (Supabase) hasn&apos;t been configured for this deployment.
          Once the project keys are added, login will activate automatically.
        </p>
        <a href="/" className="inline-block mt-6 text-accent text-[0.9rem] font-semibold hover:underline underline-offset-4">
          ← Back to site
        </a>
      </div>
    );
  }

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setPending(true);
    try {
      const supabase = createSupabaseBrowser();
      const { data: auth, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error || !auth.user) {
        setError("Incorrect email or password.");
        return;
      }
      // Land admins on /admin, clients on /portal (or an explicit ?next=)
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", auth.user.id)
        .single();
      const next = params.get("next");
      router.replace(next ?? (profile?.role === "admin" ? "/admin" : "/portal"));
      router.refresh();
    } finally {
      setPending(false);
    }
  };

  const sendReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setPending(true);
    try {
      const supabase = createSupabaseBrowser();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/confirm?next=/reset-password`,
      });
      if (error) {
        setError("Couldn't send the reset email. Please try again.");
        return;
      }
      setSent(true);
    } finally {
      setPending(false);
    }
  };

  if (sent) {
    return (
      <div className="w-full max-w-100 bg-surface border border-rule rounded-lg p-9 text-center">
        <p className="text-[0.72rem] font-semibold uppercase tracking-[0.3em] text-accent">Check your inbox</p>
        <h1 className="font-display text-[1.5rem] font-semibold mt-1.5">Reset link sent</h1>
        <p className="text-muted text-[0.92rem] mt-3">
          If an account exists for <span className="text-ink">{email}</span>, a password reset link is on its way.
          The link expires shortly, so use it soon.
        </p>
        <button
          type="button"
          onClick={() => { setSent(false); setMode("signin"); setNotice(""); }}
          className={`mt-6 ${linkCls}`}
        >
          ← Back to sign in
        </button>
      </div>
    );
  }

  const forgot = mode === "forgot";

  return (
    <form onSubmit={forgot ? sendReset : signIn} className="w-full max-w-100 bg-surface border border-rule rounded-lg p-9">
      <p className="text-[0.72rem] font-semibold uppercase tracking-[0.3em] text-accent text-center">
        {forgot ? "Account Recovery" : "Private"}
      </p>
      <h1 className="font-display text-[1.6rem] font-semibold text-center mt-1.5">
        {forgot ? "Reset your password" : "Client Login"}
      </h1>
      <p className="text-muted text-[0.9rem] text-center mt-2 mb-7">
        {forgot
          ? "Enter your email and we'll send you a link to set a new password."
          : "Access your projects, deliverables, and proposals."}
      </p>
      {notice && (
        <p className="text-[0.85rem] text-ink/90 bg-accent-soft border border-accent/40 rounded-md px-4 py-3 mb-5">
          {notice}
        </p>
      )}
      <div className="grid gap-4">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          autoComplete="email"
          required
          aria-label="Email"
          className={fieldCls}
        />
        {!forgot && (
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            autoComplete="current-password"
            required
            aria-label="Password"
            className={fieldCls}
          />
        )}
        <p role="alert" className="text-[#d98a7a] text-[0.85rem] min-h-[1.2em]">{error}</p>
        <button type="submit" disabled={pending} className={btnCls}>
          {pending ? (forgot ? "Sending…" : "Signing in…") : forgot ? "Send Reset Link" : "Sign In"}
        </button>
      </div>
      <div className="text-center mt-6">
        <button
          type="button"
          onClick={() => { setMode(forgot ? "signin" : "forgot"); setError(""); setNotice(""); }}
          className={linkCls}
        >
          {forgot ? "← Back to sign in" : "Forgot your password?"}
        </button>
      </div>
      {!forgot && (
        <p className="text-muted text-[0.8rem] text-center mt-4">
          Need access? Contact your producer at Gray Content Studio.
        </p>
      )}
    </form>
  );
}
