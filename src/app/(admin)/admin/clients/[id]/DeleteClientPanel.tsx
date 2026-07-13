"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteClient } from "@/modules/clients/actions";

const DANGER = "#d98a7a";

export function DeleteClientPanel({
  clientId,
  company,
  counts,
}: {
  clientId: string;
  company: string;
  counts: { projects: number; invoices: number; contracts: number; logins: number };
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  const parts = [
    counts.projects && `${counts.projects} project${counts.projects === 1 ? "" : "s"}`,
    counts.invoices && `${counts.invoices} invoice${counts.invoices === 1 ? "" : "s"}`,
    counts.contracts && `${counts.contracts} document${counts.contracts === 1 ? "" : "s"}`,
    counts.logins && `${counts.logins} portal login${counts.logins === 1 ? "" : "s"}`,
  ].filter(Boolean) as string[];

  const canDelete = confirm.trim() === company.trim() && !pending;

  const onDelete = async () => {
    if (!canDelete) return;
    setError("");
    setPending(true);
    try {
      const res = await deleteClient(clientId);
      if (!res.ok) {
        setError(res.message);
        setPending(false);
        return;
      }
      router.replace("/admin/clients");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setPending(false);
    }
  };

  return (
    <section
      className="rounded-lg p-6 mt-6"
      style={{ border: `1px solid ${DANGER}55`, background: `${DANGER}0d` }}
    >
      <h2 className="font-display text-[1.05rem] font-semibold" style={{ color: DANGER }}>
        Danger Zone
      </h2>

      {!open ? (
        <div className="mt-3 flex items-center justify-between gap-4 flex-wrap">
          <p className="text-muted text-[0.9rem] max-w-140">
            Permanently delete this client and everything attached to it. This can&apos;t be undone.
          </p>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="shrink-0 rounded-full text-[0.8rem] font-semibold uppercase tracking-[0.08em] px-5 py-2 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
            style={{ border: `1px solid ${DANGER}`, color: DANGER }}
          >
            Delete Client
          </button>
        </div>
      ) : (
        <div className="mt-4">
          <p className="text-[0.9rem] text-ink/90">
            Deleting <span className="font-semibold">{company}</span> will also remove{" "}
            {parts.length ? (
              <span className="text-ink">{parts.join(", ")}</span>
            ) : (
              "all of its records"
            )}
            . This is permanent.
          </p>
          <label htmlFor="confirm-delete" className="block text-[0.78rem] font-medium uppercase tracking-[0.14em] text-muted mt-5 mb-1.5">
            Type <span className="text-ink normal-case tracking-normal font-semibold">{company}</span> to confirm
          </label>
          <input
            id="confirm-delete"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="off"
            placeholder={company}
            className="w-full max-w-100 font-body text-base text-ink bg-bg border border-rule rounded px-4 py-2.5 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/50 transition-colors"
          />
          {error && (
            <p role="alert" className="text-[0.85rem] mt-3" style={{ color: DANGER }}>
              {error}
            </p>
          )}
          <div className="flex items-center gap-3 mt-5">
            <button
              type="button"
              onClick={onDelete}
              disabled={!canDelete}
              className="rounded-full text-[0.8rem] font-semibold uppercase tracking-[0.08em] px-5 py-2 text-bg transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
              style={{ background: DANGER, border: `1px solid ${DANGER}` }}
            >
              {pending ? "Deleting…" : "Permanently Delete"}
            </button>
            <button
              type="button"
              onClick={() => { setOpen(false); setConfirm(""); setError(""); }}
              disabled={pending}
              className="rounded-full border border-rule text-[0.8rem] font-medium uppercase tracking-[0.08em] px-5 py-2 text-muted hover:text-ink hover:border-ink/40 transition-colors cursor-pointer disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
