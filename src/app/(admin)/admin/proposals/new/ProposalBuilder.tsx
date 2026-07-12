"use client";

import { useEffect, useState, useTransition } from "react";
import {
  EstimateBuilder,
  emptyBuilderState,
  type BuilderState,
} from "@/modules/pricing/EstimateBuilder";
import type { RushId } from "@/modules/pricing/data";
import { computeEstimate } from "@/modules/pricing/compute";
import { saveProposal, type ProposalDetails } from "@/modules/proposals/actions";

export type LoadedProposal = ProposalDetails & {
  id: string;
  items: { id: string; qty: number }[];
  rushId: string;
  travelMiles: number;
  discountType: string;
  discountValue: number;
  depositPct: number;
};

const OVERRIDES_KEY = "gcs_price_overrides";

const fieldCls =
  "w-full font-body text-[0.95rem] text-ink bg-bg border border-rule rounded px-3.5 py-2.5 focus:outline-none focus:border-accent transition-colors";
const labelCls = "text-[0.72rem] font-medium uppercase tracking-[0.14em] text-muted";

export type FromLead = {
  leadId: string;
  clientName: string;
  company: string;
  email: string;
  items: { id: string; qty: number }[];
  rushId: string;
  travelMiles: number;
};

export function ProposalBuilder({
  loaded,
  prefill,
  fromLead,
}: {
  loaded?: LoadedProposal;
  prefill: { clientName: string; company: string; email: string };
  fromLead?: FromLead;
}) {
  const [details, setDetails] = useState<ProposalDetails>({
    clientName: loaded?.clientName ?? prefill.clientName,
    company: loaded?.company ?? prefill.company,
    email: loaded?.email ?? prefill.email,
    title: loaded?.title ?? "",
    notes: loaded?.notes ?? "",
    validUntil: loaded?.validUntil ?? "",
  });

  const [state, setState] = useState<BuilderState>(() => {
    if (loaded) {
      return {
        selections: Object.fromEntries(loaded.items.map((i) => [i.id, i.qty])),
        rushId: loaded.rushId as RushId,
        travelMiles: loaded.travelMiles,
        discountType: loaded.discountType as BuilderState["discountType"],
        discountValue: loaded.discountValue,
        depositPct: loaded.depositPct,
      };
    }
    if (fromLead && fromLead.items.length) {
      return {
        ...emptyBuilderState(),
        selections: Object.fromEntries(fromLead.items.map((i) => [i.id, i.qty])),
        rushId: fromLead.rushId as RushId,
        travelMiles: fromLead.travelMiles,
      };
    }
    return emptyBuilderState();
  });

  // Rate overrides persist per-browser (same behavior as the original admin panel)
  const [overrides, setOverrides] = useState<Record<string, number>>({});
  useEffect(() => {
    try {
      setOverrides(JSON.parse(localStorage.getItem(OVERRIDES_KEY) ?? "{}"));
    } catch {
      /* ignore */
    }
  }, []);

  const [savedId, setSavedId] = useState<string | undefined>(loaded?.id);
  const [publicId, setPublicId] = useState<string | undefined>();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const onPriceOverride = (serviceId: string, price: number | null) => {
    const next = { ...overrides };
    if (price == null) delete next[serviceId];
    else next[serviceId] = price;
    setOverrides(next);
    localStorage.setItem(OVERRIDES_KEY, JSON.stringify(next));
  };

  const save = () => {
    const estimate = computeEstimate({ ...state, priceOverrides: overrides });
    startTransition(async () => {
      const res = await saveProposal(details, estimate, savedId, fromLead?.leadId);
      setMessage({ ok: res.ok, text: res.message });
      if (res.ok) {
        setSavedId(res.id);
        setPublicId(res.publicId);
      }
    });
  };

  const copyLink = async () => {
    if (!publicId) return;
    const url = `${location.origin}/p/${publicId}`;
    try {
      await navigator.clipboard.writeText(url);
      setMessage({ ok: true, text: "Client link copied to clipboard." });
    } catch {
      prompt("Copy this proposal link:", url);
    }
  };

  return (
    <>
      <h1 className="font-display text-[1.6rem] font-semibold mb-6">
        {savedId ? "Edit Proposal" : "New Proposal"}
      </h1>

      <section className="bg-surface border border-rule rounded-lg p-6 mb-8">
        <h2 className="font-display text-[1.15rem] font-semibold mb-4">Client &amp; Project</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Client Name" id="p-name">
            <input id="p-name" className={fieldCls} value={details.clientName}
              onChange={(e) => setDetails({ ...details, clientName: e.target.value })} placeholder="Jane Smith" />
          </Field>
          <Field label="Company" id="p-company">
            <input id="p-company" className={fieldCls} value={details.company}
              onChange={(e) => setDetails({ ...details, company: e.target.value })} placeholder="Company or campaign" />
          </Field>
          <Field label="Client Email" id="p-email">
            <input id="p-email" type="email" className={fieldCls} value={details.email}
              onChange={(e) => setDetails({ ...details, email: e.target.value })} placeholder="jane@company.com" />
          </Field>
          <Field label="Project Title" id="p-title">
            <input id="p-title" className={fieldCls} value={details.title}
              onChange={(e) => setDetails({ ...details, title: e.target.value })} placeholder="Spring Brand Campaign" />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Scope Notes (shown on proposal)" id="p-notes">
              <textarea id="p-notes" rows={3} className={`${fieldCls} resize-y`} value={details.notes}
                onChange={(e) => setDetails({ ...details, notes: e.target.value })}
                placeholder="Short intro describing the project scope, goals, and approach." />
            </Field>
          </div>
          <Field label="Valid Until" id="p-valid">
            <input id="p-valid" type="date" className={fieldCls} value={details.validUntil}
              onChange={(e) => setDetails({ ...details, validUntil: e.target.value })} />
          </Field>
        </div>
      </section>

      <EstimateBuilder
        mode="admin"
        state={state}
        onChange={setState}
        priceOverrides={overrides}
        onPriceOverride={onPriceOverride}
        sidebar={() => (
          <div className="mt-6 grid gap-3">
            <button
              onClick={save}
              disabled={pending}
              className="rounded-full bg-accent text-bg border border-accent font-semibold uppercase text-[0.82rem] tracking-[0.08em] px-4 py-3 transition-all duration-200 hover:bg-transparent hover:text-accent disabled:opacity-60 cursor-pointer"
            >
              {pending ? "Saving…" : savedId ? "Update Proposal" : "Save Proposal"}
            </button>
            {publicId && (
              <>
                <button
                  onClick={copyLink}
                  className="rounded-full border border-rule text-ink font-semibold uppercase text-[0.82rem] tracking-[0.08em] px-4 py-3 hover:border-accent hover:text-accent transition-colors cursor-pointer"
                >
                  Copy Client Link
                </button>
                <a
                  href={`/p/${publicId}`}
                  target="_blank"
                  rel="noopener"
                  className="text-center rounded-full border border-rule text-ink font-semibold uppercase text-[0.82rem] tracking-[0.08em] px-4 py-3 hover:border-accent hover:text-accent transition-colors"
                >
                  Preview Proposal
                </a>
              </>
            )}
            {message && (
              <p className={`text-[0.85rem] text-center ${message.ok ? "text-[#8ec98e]" : "text-[#d98a7a]"}`} role="status">
                {message.text}
              </p>
            )}
          </div>
        )}
      />
    </>
  );
}

function Field({ label, id, children }: { label: string; id: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <label htmlFor={id} className={labelCls}>{label}</label>
      {children}
    </div>
  );
}
