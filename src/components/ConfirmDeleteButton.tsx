"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

const DANGER = "#d98a7a";

type DeleteResult = { ok: boolean; message: string } | void;

/**
 * Reusable ✕ delete control with an inline confirm — no native dialogs, no modals.
 *
 * Pass a server action + its string args (works from both server and client pages):
 *   <ConfirmDeleteButton action={deleteProposal} args={[p.id]} itemName={p.title} />
 *
 * variant:
 *   "overlay" (default) — a corner ✕ + a confirm that covers the card. The parent
 *                         element must be `relative`.
 *   "inline"            — a ✕ that swaps in place to "Delete? Yes / No". For rows.
 */
export function ConfirmDeleteButton({
  action,
  args = [],
  itemName,
  note,
  variant = "overlay",
  redirectTo,
  corner = "top-2 right-2",
}: {
  action: (...a: string[]) => Promise<DeleteResult>;
  args?: string[];
  itemName?: string;
  note?: string;
  variant?: "overlay" | "inline";
  redirectTo?: string;
  corner?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const run = () => {
    setError("");
    startTransition(async () => {
      try {
        const res = await action(...args);
        if (res && res.ok === false) {
          setError(res.message || "Couldn't delete.");
          return;
        }
        setOpen(false);
        if (redirectTo) router.replace(redirectTo);
        router.refresh();
      } catch {
        setError("Something went wrong.");
      }
    });
  };

  const label = itemName ? `Delete ${itemName}` : "Delete";

  const xButton = (extra: string) => (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={() => { setOpen(true); setError(""); }}
      className={`grid place-items-center rounded-full text-muted/70 hover:text-[#d98a7a] hover:bg-[#d98a7a1a] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d98a7a] focus-visible:ring-offset-2 focus-visible:ring-offset-surface ${extra}`}
    >
      <span aria-hidden="true" className="leading-none">✕</span>
    </button>
  );

  const deleteBtn = (
    <button
      type="button"
      onClick={run}
      disabled={pending}
      className="rounded-full text-[0.74rem] font-semibold uppercase tracking-[0.08em] px-3.5 py-1.5 text-bg transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
      style={{ background: DANGER, border: `1px solid ${DANGER}` }}
    >
      {pending ? "Deleting…" : "Delete"}
    </button>
  );

  const cancelBtn = (
    <button
      type="button"
      onClick={() => { setOpen(false); setError(""); }}
      disabled={pending}
      className="rounded-full border border-rule text-[0.74rem] font-medium uppercase tracking-[0.08em] px-3.5 py-1.5 text-muted hover:text-ink hover:border-ink/40 transition-colors cursor-pointer disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
    >
      Cancel
    </button>
  );

  if (variant === "inline") {
    if (!open) {
      return xButton("h-7 w-7 text-[0.8rem] shrink-0");
    }
    return (
      <span className="inline-flex items-center gap-1.5 shrink-0">
        <span className="text-[0.76rem] text-muted whitespace-nowrap">Delete?</span>
        <button
          type="button"
          onClick={run}
          disabled={pending}
          className="rounded-full text-[0.68rem] font-semibold uppercase tracking-[0.06em] px-2.5 py-1 text-bg cursor-pointer disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-offset-surface"
          style={{ background: DANGER, border: `1px solid ${DANGER}` }}
        >
          {pending ? "…" : "Yes"}
        </button>
        <button
          type="button"
          onClick={() => { setOpen(false); setError(""); }}
          disabled={pending}
          className="rounded-full border border-rule text-[0.68rem] font-medium uppercase tracking-[0.06em] px-2.5 py-1 text-muted hover:text-ink transition-colors cursor-pointer disabled:opacity-50"
        >
          No
        </button>
        {error && <span className="text-[0.72rem]" style={{ color: DANGER }}>{error}</span>}
      </span>
    );
  }

  // overlay variant
  return (
    <>
      {xButton(`absolute ${corner} z-10 h-8 w-8 text-[0.9rem]`)}
      {open && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2.5 rounded-lg bg-surface/97 backdrop-blur-sm p-4 text-center">
          <p className="text-[0.88rem] text-ink">
            Delete{itemName ? <> <span className="font-semibold">{itemName}</span></> : ""}?
          </p>
          {note && <p className="text-muted text-[0.76rem] -mt-1">{note}</p>}
          {error && <p role="alert" className="text-[0.76rem]" style={{ color: DANGER }}>{error}</p>}
          <div className="flex items-center gap-2 mt-0.5">
            {deleteBtn}
            {cancelBtn}
          </div>
        </div>
      )}
    </>
  );
}
