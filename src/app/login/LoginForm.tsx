"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase/client";

const fieldCls =
  "w-full font-body text-base text-ink bg-bg border border-rule rounded px-4 py-3 focus:outline-none focus:border-accent transition-colors";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const setupMode = params.get("setup") === "1";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
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

  const submit = async (e: React.FormEvent) => {
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

  return (
    <form onSubmit={submit} className="w-full max-w-100 bg-surface border border-rule rounded-lg p-9">
      <p className="text-[0.72rem] font-semibold uppercase tracking-[0.3em] text-accent text-center">Private</p>
      <h1 className="font-display text-[1.6rem] font-semibold text-center mt-1.5">Client Login</h1>
      <p className="text-muted text-[0.9rem] text-center mt-2 mb-7">
        Access your projects, deliverables, and proposals.
      </p>
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
        <p role="alert" className="text-[#d98a7a] text-[0.85rem] min-h-[1.2em]">{error}</p>
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-accent text-bg border border-accent font-semibold uppercase text-[0.85rem] tracking-[0.08em] py-3 transition-all duration-200 hover:bg-transparent hover:text-accent disabled:opacity-60 cursor-pointer"
        >
          {pending ? "Signing in…" : "Sign In"}
        </button>
      </div>
      <p className="text-muted text-[0.8rem] text-center mt-6">
        Need access? Contact your producer at Gray Content Studio.
      </p>
    </form>
  );
}
