"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setLeadStatus } from "@/modules/proposals/actions";
import { convertLeadToClient } from "@/modules/clients/actions";
import { deleteLead } from "@/modules/leads/actions";
import { addNote } from "@/modules/crm/actions";

const DANGER = "#d98a7a";

type LeadStatus = "new" | "contacted" | "qualified" | "won" | "lost";

export type BoardLead = {
  id: string;
  name: string;
  email: string;
  company: string | null;
  projectType: string | null;
  message: string | null;
  status: LeadStatus;
  clientId: string | null;
  createdAt: string;
  estimateTotal: number | null;
  notes: { body: string; kind: string; createdAt: string }[];
};

const COLUMNS: { id: LeadStatus; label: string; hint: string }[] = [
  { id: "new", label: "New", hint: "Untouched inquiries" },
  { id: "contacted", label: "Contacted", hint: "Conversation started" },
  { id: "qualified", label: "Qualified", hint: "Real opportunity" },
  { id: "won", label: "Won", hint: "Became clients" },
  { id: "lost", label: "Lost", hint: "Didn't move forward" },
];

const ORDER: LeadStatus[] = ["new", "contacted", "qualified", "won", "lost"];

export function PipelineBoard({ leads }: { leads: BoardLead[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [openCard, setOpenCard] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [delError, setDelError] = useState("");

  const removeLead = (leadId: string) => {
    setDelError("");
    startTransition(async () => {
      const res = await deleteLead(leadId);
      if (!res.ok) {
        setDelError(res.message);
        return;
      }
      setConfirmDelete(null);
      router.refresh();
    });
  };

  const move = (lead: BoardLead, dir: -1 | 1) => {
    const idx = ORDER.indexOf(lead.status);
    const next = ORDER[idx + dir];
    if (!next) return;
    startTransition(() => setLeadStatus(lead.id, next));
  };

  const saveNote = (leadId: string) => {
    if (!noteDraft.trim()) return;
    startTransition(async () => {
      await addNote({ body: noteDraft, leadId });
      setNoteDraft("");
      router.refresh();
    });
  };

  return (
    <div className="overflow-x-auto overscroll-x-contain snap-x snap-proximity pb-4 -mx-2 px-2 [scrollbar-width:thin]">
      <div className="grid grid-cols-5 gap-4 min-w-[1080px]">
        {COLUMNS.map((col) => {
          const cards = leads.filter((l) => l.status === col.id);
          return (
            <section key={col.id} aria-label={`${col.label} leads`} className="snap-start">
              <header className="flex items-baseline justify-between gap-2 px-1 mb-3">
                <h2 className="text-[0.78rem] font-semibold uppercase tracking-[0.16em] text-accent">
                  {col.label}
                </h2>
                <span className="text-muted text-[0.78rem]">{cards.length}</span>
              </header>
              <div className="space-y-3 min-h-24 rounded-lg">
                {cards.length === 0 && (
                  <p className="text-muted/60 text-[0.78rem] border border-dashed border-rule rounded-md px-3 py-4 text-center">
                    {col.hint}
                  </p>
                )}
                {cards.map((lead) => {
                  const isOpen = openCard === lead.id;
                  const idx = ORDER.indexOf(lead.status);
                  return (
                    <article key={lead.id} className="relative bg-surface border border-rule rounded-lg p-4">
                      <button
                        type="button"
                        aria-label={`Delete ${lead.name}`}
                        title={`Delete ${lead.name}`}
                        onClick={() => { setConfirmDelete(lead.id); setDelError(""); }}
                        className="absolute top-2 right-2 z-10 grid h-7 w-7 place-items-center rounded-full text-muted/70 hover:text-[#d98a7a] hover:bg-[#d98a7a1a] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d98a7a] focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                      >
                        <span aria-hidden="true" className="text-[0.85rem] leading-none">✕</span>
                      </button>
                      <button
                        onClick={() => {
                          setOpenCard(isOpen ? null : lead.id);
                          setNoteDraft("");
                        }}
                        className="w-full text-left cursor-pointer"
                      >
                        <p className="font-medium text-[0.92rem] pr-6">{lead.name}</p>
                        <p className="text-muted text-[0.8rem] mt-0.5">
                          {lead.company || "—"}
                          {lead.projectType ? ` · ${lead.projectType}` : ""}
                        </p>
                        <p className="text-muted/70 text-[0.72rem] mt-1">
                          {new Date(lead.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          {lead.notes.length > 0 && ` · ${lead.notes.length} note${lead.notes.length === 1 ? "" : "s"}`}
                        </p>
                        {lead.estimateTotal != null && (
                          <p className="inline-block rounded-full bg-accent-soft text-accent text-[0.72rem] font-semibold px-2.5 py-0.5 mt-1.5">
                            est. ${Math.round(lead.estimateTotal).toLocaleString("en-US")}
                          </p>
                        )}
                      </button>

                      <div className="flex items-center justify-between mt-3">
                        <button
                          disabled={pending || idx === 0}
                          onClick={() => move(lead, -1)}
                          aria-label={`Move ${lead.name} back`}
                          className="rounded border border-rule px-2.5 py-1 text-[0.8rem] text-muted hover:text-accent hover:border-accent transition-colors disabled:opacity-30 cursor-pointer"
                        >
                          ←
                        </button>
                        <button
                          disabled={pending || idx === ORDER.length - 1}
                          onClick={() => move(lead, 1)}
                          aria-label={`Move ${lead.name} forward`}
                          className="rounded border border-rule px-2.5 py-1 text-[0.8rem] text-muted hover:text-accent hover:border-accent transition-colors disabled:opacity-30 cursor-pointer"
                        >
                          →
                        </button>
                      </div>

                      {isOpen && (
                        <div className="mt-3 pt-3 border-t border-rule space-y-3">
                          <p className="text-[0.82rem]">
                            <a href={`mailto:${lead.email}`} className="text-accent hover:underline">{lead.email}</a>
                          </p>
                          {lead.message && (
                            <p className="text-muted text-[0.82rem] whitespace-pre-wrap">{lead.message}</p>
                          )}
                          {lead.notes.length > 0 && (
                            <ul className="space-y-1.5">
                              {lead.notes.slice(0, 5).map((n, i) => (
                                <li key={i} className="text-[0.8rem] text-muted flex gap-2">
                                  <span className="text-accent shrink-0">·</span>
                                  <span>
                                    {n.body}
                                    <span className="block text-[0.7rem] opacity-60">
                                      {new Date(n.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                    </span>
                                  </span>
                                </li>
                              ))}
                            </ul>
                          )}
                          <div className="flex gap-2">
                            <input
                              value={noteDraft}
                              onChange={(e) => setNoteDraft(e.target.value)}
                              onKeyDown={(e) => e.key === "Enter" && saveNote(lead.id)}
                              placeholder="Add a note…"
                              className="w-full font-body text-[0.82rem] text-ink bg-bg border border-rule rounded px-2.5 py-1.5 focus:outline-none focus:border-accent"
                            />
                            <button
                              disabled={pending}
                              onClick={() => saveNote(lead.id)}
                              className="rounded border border-rule px-3 text-[0.78rem] text-muted hover:text-accent hover:border-accent transition-colors cursor-pointer"
                            >
                              Save
                            </button>
                          </div>
                          <div className="flex flex-wrap gap-x-4 gap-y-1">
                            <a
                              href={`/admin/proposals/new?lead=${lead.id}&name=${encodeURIComponent(lead.name)}&company=${encodeURIComponent(lead.company ?? "")}&email=${encodeURIComponent(lead.email)}`}
                              className="text-accent text-[0.8rem] font-semibold hover:underline underline-offset-4"
                            >
                              {lead.estimateTotal != null ? "Proposal from estimate →" : "Proposal →"}
                            </a>
                            {lead.clientId ? (
                              <a href={`/admin/clients/${lead.clientId}`} className="text-accent text-[0.8rem] font-semibold hover:underline underline-offset-4">
                                Client page →
                              </a>
                            ) : (
                              <button
                                disabled={pending}
                                onClick={() =>
                                  startTransition(async () => {
                                    const res = await convertLeadToClient(lead.id);
                                    if (res.ok && res.clientId) router.push(`/admin/clients/${res.clientId}`);
                                  })
                                }
                                className="text-accent text-[0.8rem] font-semibold hover:underline underline-offset-4 cursor-pointer"
                              >
                                Convert to client →
                              </button>
                            )}
                          </div>
                        </div>
                      )}

                      {confirmDelete === lead.id && (
                        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2.5 rounded-lg bg-surface/97 backdrop-blur-sm p-4 text-center">
                          <p className="text-[0.86rem] text-ink">
                            Delete <span className="font-semibold">{lead.name}</span>?
                          </p>
                          <p className="text-muted text-[0.76rem] -mt-1">
                            Removes the lead and its notes. Permanent.
                          </p>
                          {delError && (
                            <p role="alert" className="text-[0.76rem]" style={{ color: DANGER }}>{delError}</p>
                          )}
                          <div className="flex items-center gap-2 mt-0.5">
                            <button
                              type="button"
                              onClick={() => removeLead(lead.id)}
                              disabled={pending}
                              className="rounded-full text-[0.74rem] font-semibold uppercase tracking-[0.08em] px-3.5 py-1.5 text-bg transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                              style={{ background: DANGER, border: `1px solid ${DANGER}` }}
                            >
                              {pending ? "Deleting…" : "Delete"}
                            </button>
                            <button
                              type="button"
                              onClick={() => { setConfirmDelete(null); setDelError(""); }}
                              disabled={pending}
                              className="rounded-full border border-rule text-[0.74rem] font-medium uppercase tracking-[0.08em] px-3.5 py-1.5 text-muted hover:text-ink hover:border-ink/40 transition-colors cursor-pointer disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
