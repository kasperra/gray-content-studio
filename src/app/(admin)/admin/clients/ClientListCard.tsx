"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteClient } from "@/modules/clients/actions";

const DANGER = "#d98a7a";

export function ClientListCard({
  id,
  company,
  contactName,
  contactEmail,
  projectCount,
}: {
  id: string;
  company: string;
  contactName: string | null;
  contactEmail: string | null;
  projectCount: number;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  const onDelete = async () => {
    setError("");
    setPending(true);
    try {
      const res = await deleteClient(id);
      if (!res.ok) {
        setError(res.message);
        setPending(false);
        return;
      }
      router.refresh();
    } catch {
      setError("Something went wrong.");
      setPending(false);
    }
  };

  return (
    <div className="relative bg-surface border border-rule rounded-lg hover:border-accent/60 transition-colors">
      <Link href={`/admin/clients/${id}`} className="block p-6 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg">
        <p className="font-display text-[1.2rem] font-semibold pr-8">{company}</p>
        <p className="text-muted text-[0.88rem] mt-1">
          {contactName || "—"}
          {contactEmail ? ` · ${contactEmail}` : ""}
        </p>
        <p className="text-accent text-[0.78rem] font-semibold uppercase tracking-[0.14em] mt-3">
          {projectCount} project{projectCount === 1 ? "" : "s"}
        </p>
      </Link>

      <button
        type="button"
        aria-label={`Delete ${company}`}
        title={`Delete ${company}`}
        onClick={() => setConfirming(true)}
        className="absolute top-2.5 right-2.5 grid h-8 w-8 place-items-center rounded-full text-muted hover:text-[#d98a7a] hover:bg-[#d98a7a1a] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d98a7a] focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
      >
        <span aria-hidden="true" className="text-[0.95rem] leading-none">✕</span>
      </button>

      {confirming && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-lg bg-surface/97 backdrop-blur-sm p-5 text-center">
          <p className="text-[0.9rem] text-ink">
            Delete <span className="font-semibold">{company}</span>?
          </p>
          <p className="text-muted text-[0.8rem] -mt-1.5">
            {projectCount > 0
              ? `Its ${projectCount} project${projectCount === 1 ? "" : "s"} and all data are removed. Permanent.`
              : "This can't be undone."}
          </p>
          {error && (
            <p role="alert" className="text-[0.8rem]" style={{ color: DANGER }}>{error}</p>
          )}
          <div className="flex items-center gap-2 mt-1">
            <button
              type="button"
              onClick={onDelete}
              disabled={pending}
              className="rounded-full text-[0.78rem] font-semibold uppercase tracking-[0.08em] px-4 py-1.5 text-bg transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
              style={{ background: DANGER, border: `1px solid ${DANGER}` }}
            >
              {pending ? "Deleting…" : "Delete"}
            </button>
            <button
              type="button"
              onClick={() => { setConfirming(false); setError(""); }}
              disabled={pending}
              className="rounded-full border border-rule text-[0.78rem] font-medium uppercase tracking-[0.08em] px-4 py-1.5 text-muted hover:text-ink hover:border-ink/40 transition-colors cursor-pointer disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
