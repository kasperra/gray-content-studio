"use client";

import { useTransition } from "react";
import { setLeadStatus } from "@/modules/proposals/actions";

type Lead = {
  id: string;
  name: string;
  email: string;
  company: string | null;
  project_type: string | null;
  message: string | null;
  status: "new" | "contacted" | "qualified" | "won" | "lost";
  created_at: string;
};

const STATUSES: Lead["status"][] = ["new", "contacted", "qualified", "won", "lost"];

const statusColor: Record<Lead["status"], string> = {
  new: "text-accent border-accent/50",
  contacted: "text-[#8db4d9] border-[#8db4d9]/40",
  qualified: "text-[#c9a4e0] border-[#c9a4e0]/40",
  won: "text-[#8ec98e] border-[#8ec98e]/40",
  lost: "text-muted border-rule",
};

export function LeadRow({ lead }: { lead: Lead }) {
  const [pending, startTransition] = useTransition();

  return (
    <details className="bg-surface border border-rule rounded-lg group open:border-accent/40 transition-colors">
      <summary className="flex flex-wrap items-center gap-x-5 gap-y-2 px-5 py-4 cursor-pointer list-none">
        <span className="font-medium min-w-40">{lead.name}</span>
        <span className="text-muted text-[0.88rem]">{lead.company || "—"}</span>
        <span className="text-[0.75rem] font-semibold uppercase tracking-[0.14em] text-accent">
          {lead.project_type}
        </span>
        <span className="text-muted text-[0.8rem] ml-auto">
          {new Date(lead.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
        </span>
        <select
          value={lead.status}
          disabled={pending}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => startTransition(() => setLeadStatus(lead.id, e.target.value as Lead["status"]))}
          className={`rounded-full border bg-transparent text-[0.72rem] font-semibold uppercase tracking-[0.1em] px-3 py-1 cursor-pointer ${statusColor[lead.status]}`}
          aria-label={`Status for lead from ${lead.name}`}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s} className="bg-surface text-ink">
              {s}
            </option>
          ))}
        </select>
      </summary>
      <div className="px-5 pb-5 pt-1 border-t border-rule text-[0.92rem] space-y-2">
        <p>
          <a href={`mailto:${lead.email}`} className="text-accent hover:underline">{lead.email}</a>
        </p>
        {lead.message && <p className="text-muted whitespace-pre-wrap">{lead.message}</p>}
        <p>
          <a
            href={`/admin/proposals/new?name=${encodeURIComponent(lead.name)}&company=${encodeURIComponent(lead.company ?? "")}&email=${encodeURIComponent(lead.email)}`}
            className="text-accent text-[0.85rem] font-semibold hover:underline underline-offset-4"
          >
            Create proposal for this lead →
          </a>
        </p>
      </div>
    </details>
  );
}
