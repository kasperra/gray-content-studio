"use client";

import { useState, useTransition } from "react";
import { createClientLogin } from "@/modules/clients/actions";

const fieldCls =
  "w-full font-body text-[0.95rem] text-ink bg-bg border border-rule rounded px-3.5 py-2.5 focus:outline-none focus:border-accent transition-colors";

export function ClientLoginPanel({
  clientId,
  defaultEmail,
  defaultName,
  existingLogins,
}: {
  clientId: string;
  defaultEmail: string;
  defaultName: string;
  existingLogins: string[];
}) {
  const [email, setEmail] = useState(defaultEmail);
  const [name, setName] = useState(defaultName);
  const [result, setResult] = useState<{ ok: boolean; message: string; tempPassword?: string } | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <section className="bg-surface border border-rule rounded-lg p-6">
      <h2 className="font-display text-[1.2rem] font-semibold mb-1.5">Portal Access</h2>
      {existingLogins.length > 0 && (
        <p className="text-muted text-[0.85rem] mb-3">
          Active logins: {existingLogins.join(", ")}
        </p>
      )}
      <p className="text-muted text-[0.85rem] mb-4">
        Create a login so this client can track projects and download deliverables.
      </p>
      <div className="grid gap-3">
        <input className={fieldCls} placeholder="Client contact name" value={name} onChange={(e) => setName(e.target.value)} />
        <input className={fieldCls} type="email" placeholder="Login email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <button
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              setResult(await createClientLogin({ clientId, email, name }));
            })
          }
          className="rounded-full bg-accent text-bg border border-accent font-semibold uppercase text-[0.78rem] tracking-[0.08em] px-5 py-2.5 transition-all hover:bg-transparent hover:text-accent disabled:opacity-60 cursor-pointer"
        >
          {pending ? "Creating…" : "Create Portal Login"}
        </button>
        {result && (
          <div className={`text-[0.88rem] ${result.ok ? "text-[#8ec98e]" : "text-[#d98a7a]"}`} role="status">
            <p>{result.message}</p>
            {result.tempPassword && (
              <p className="mt-2 text-ink bg-bg border border-accent/50 rounded px-3 py-2 font-mono text-[0.9rem] select-all">
                {result.tempPassword}
              </p>
            )}
            {result.tempPassword && (
              <p className="text-muted mt-1.5">
                Share this once (call or secure message) — it won&apos;t be shown again.
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
