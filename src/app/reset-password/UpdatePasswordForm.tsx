"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase/client";

const fieldCls =
  "w-full font-body text-base text-ink bg-bg border border-rule rounded px-4 py-3 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/50 transition-colors";

export function UpdatePasswordForm({ email }: { email: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [pending, setPending] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setPending(true);
    try {
      const supabase = createSupabaseBrowser();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setError(error.message || "Couldn't update your password. The link may have expired.");
        return;
      }
      setDone(true);
      // Route by role once the new password is set.
      const {
        data: { user },
      } = await supabase.auth.getUser();
      let dest = "/portal";
      if (user) {
        const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
        dest = profile?.role === "admin" ? "/admin" : "/portal";
      }
      setTimeout(() => {
        router.replace(dest);
        router.refresh();
      }, 1200);
    } finally {
      setPending(false);
    }
  };

  if (done) {
    return (
      <div className="w-full max-w-100 bg-surface border border-rule rounded-lg p-9 text-center">
        <h1 className="font-display text-[1.5rem] font-semibold">Password updated</h1>
        <p className="text-muted text-[0.92rem] mt-3">
          You&apos;re all set. Taking you to your dashboard…
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="w-full max-w-100 bg-surface border border-rule rounded-lg p-9">
      <p className="text-[0.72rem] font-semibold uppercase tracking-[0.3em] text-accent text-center">Account Recovery</p>
      <h1 className="font-display text-[1.6rem] font-semibold text-center mt-1.5">Set a new password</h1>
      <p className="text-muted text-[0.9rem] text-center mt-2 mb-7">
        {email ? `For ${email}` : "Choose a new password for your account."}
      </p>
      <div className="grid gap-4">
        <div className="relative">
          <input
            type={show ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="New password"
            autoComplete="new-password"
            required
            aria-label="New password"
            className={`${fieldCls} pr-16`}
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[0.72rem] font-semibold uppercase tracking-[0.08em] text-muted hover:text-accent transition-colors cursor-pointer rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
            aria-label={show ? "Hide password" : "Show password"}
          >
            {show ? "Hide" : "Show"}
          </button>
        </div>
        <input
          type={show ? "text" : "password"}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Confirm new password"
          autoComplete="new-password"
          required
          aria-label="Confirm new password"
          className={fieldCls}
        />
        <p role="alert" className="text-[#d98a7a] text-[0.85rem] min-h-[1.2em]">{error}</p>
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-accent text-bg border border-accent font-semibold uppercase text-[0.85rem] tracking-[0.08em] py-3 transition-all duration-200 hover:bg-transparent hover:text-accent active:translate-y-px disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
        >
          {pending ? "Updating…" : "Update Password"}
        </button>
      </div>
    </form>
  );
}
