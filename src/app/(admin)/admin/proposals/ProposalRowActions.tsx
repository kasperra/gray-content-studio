"use client";

import { useState, useTransition } from "react";
import { setProposalStatus, deleteProposal } from "@/modules/proposals/actions";

type Status = "draft" | "sent" | "accepted" | "declined";
const STATUSES: Status[] = ["draft", "sent", "accepted", "declined"];

const statusColor: Record<Status, string> = {
  draft: "text-muted border-rule",
  sent: "text-[#8db4d9] border-[#8db4d9]/40",
  accepted: "text-[#8ec98e] border-[#8ec98e]/40",
  declined: "text-[#d98a7a] border-[#d98a7a]/40",
};

export function ProposalRowActions({
  id,
  publicId,
  status,
}: {
  id: string;
  publicId: string;
  status: Status;
}) {
  const [pending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    const url = `${location.origin}/p/${publicId}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      prompt("Copy this proposal link:", url);
    }
  };

  return (
    <>
      <td className="py-3.5 pr-4">
        <select
          value={status}
          disabled={pending}
          onChange={(e) => startTransition(() => setProposalStatus(id, e.target.value as Status))}
          className={`rounded-full border bg-transparent text-[0.72rem] font-semibold uppercase tracking-[0.1em] px-3 py-1 cursor-pointer ${statusColor[status]}`}
          aria-label="Proposal status"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s} className="bg-surface text-ink">
              {s}
            </option>
          ))}
        </select>
      </td>
      <td className="py-3.5 text-right whitespace-nowrap">
        <span className="inline-flex gap-2">
          <a
            href={`/p/${publicId}`}
            target="_blank"
            rel="noopener"
            className="rounded border border-rule text-[0.78rem] font-medium px-3 py-1.5 text-muted hover:text-accent hover:border-accent transition-colors"
          >
            View
          </a>
          <button
            onClick={copyLink}
            className="rounded border border-rule text-[0.78rem] font-medium px-3 py-1.5 text-muted hover:text-accent hover:border-accent transition-colors cursor-pointer"
          >
            {copied ? "Copied!" : "Link"}
          </button>
          <a
            href={`/admin/proposals/new?edit=${id}`}
            className="rounded border border-rule text-[0.78rem] font-medium px-3 py-1.5 text-muted hover:text-accent hover:border-accent transition-colors"
          >
            Edit
          </a>
          <button
            onClick={() => {
              if (confirm("Delete this proposal? The client link will stop working.")) {
                startTransition(() => deleteProposal(id));
              }
            }}
            className="rounded border border-rule text-[0.78rem] font-medium px-3 py-1.5 text-muted hover:text-[#d98a7a] hover:border-[#d98a7a] transition-colors cursor-pointer"
          >
            Delete
          </button>
        </span>
      </td>
    </>
  );
}
