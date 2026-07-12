/* Carries a calculator estimate from /pricing to the contact form (and onward
   into the CRM lead + proposal builder). Shared between client + server code. */

import { computeEstimate, type Estimate } from "./compute";
import { money, DEFAULT_DEPOSIT_PCT, type RushId } from "./data";

export type EstimateDraft = {
  selections: Record<string, number>;
  rushId: RushId;
  travelMiles: number;
};

const STORAGE_KEY = "gcs_estimate_draft";

/* ---------- Browser-side draft handoff (sessionStorage) ---------- */

export function saveDraft(draft: EstimateDraft): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  } catch {
    /* storage unavailable — the form simply won't show the attachment */
  }
}

export function loadDraft(): EstimateDraft | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return parseDraft(raw);
  } catch {
    return null;
  }
}

export function clearDraft(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/* ---------- Validation (used server-side on untrusted input too) ---------- */

export function parseDraft(json: string): EstimateDraft | null {
  try {
    const d = JSON.parse(json) as Partial<EstimateDraft>;
    if (!d || typeof d !== "object" || !d.selections || typeof d.selections !== "object") return null;
    const selections: Record<string, number> = {};
    for (const [id, qty] of Object.entries(d.selections)) {
      const n = Number(qty);
      if (typeof id === "string" && id.length < 40 && isFinite(n) && n > 0) {
        selections[id] = Math.min(n, 10000);
      }
    }
    if (!Object.keys(selections).length) return null;
    return {
      selections,
      rushId: d.rushId === "rush48" || d.rushId === "sameday" ? d.rushId : "none",
      travelMiles: Math.max(0, Math.min(Number(d.travelMiles) || 0, 100000)),
    };
  } catch {
    return null;
  }
}

/** Recompute totals from a draft using the canonical rate card (never trust client math). */
export function estimateFromDraft(draft: EstimateDraft): Estimate {
  return computeEstimate({
    selections: draft.selections,
    rushId: draft.rushId,
    travelMiles: draft.travelMiles,
    discountType: "none",
    discountValue: 0,
    depositPct: DEFAULT_DEPOSIT_PCT,
  });
}

/** Plain-text summary appended to the lead message (and the notification email). */
export function summarizeEstimate(estimate: Estimate): string {
  const lines = estimate.items.map((i) => `• ${i.qty}× ${i.name} — ${money(i.total)}`);
  const extras: string[] = [];
  if (estimate.rushAmt > 0) extras.push(`${estimate.rushName} (+${estimate.rushPct}%): ${money(estimate.rushAmt)}`);
  if (estimate.travelAmt > 0) extras.push(`Travel (${estimate.travelMiles} mi): ${money(estimate.travelAmt)}`);
  return [
    "— Estimate built with the pricing calculator —",
    ...lines,
    ...extras,
    `Estimated total: ${money(estimate.total)}`,
  ].join("\n");
}
