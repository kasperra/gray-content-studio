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
  emitDraftChange();
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
  emitDraftChange();
}

/* ---------- useSyncExternalStore adapter ----------

   sessionStorage is an external store, so the contact form subscribes to it
   rather than copying it into state from an effect: the server render and the
   hydration pass both see null (no mismatch), and the value appears on the
   client without a second render pass we have to write by hand.

   These module-level values are only ever touched by the browser helpers
   above — server code in this file (parseDraft, estimateFromDraft) doesn't
   reach them. */

const draftListeners = new Set<() => void>();

function emitDraftChange(): void {
  draftListeners.forEach((fn) => fn());
}

export function subscribeToDraft(onChange: () => void): () => void {
  draftListeners.add(onChange);
  // Another tab writing the same key fires `storage`, never our own writes.
  window.addEventListener("storage", onChange);
  return () => {
    draftListeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

// getSnapshot must be referentially stable between reads or React re-renders
// forever, so the parsed draft is memoized against the raw string it came from.
let snapshotRaw: string | null = null;
let snapshotDraft: EstimateDraft | null = null;

export function getDraftSnapshot(): EstimateDraft | null {
  let raw: string | null = null;
  try {
    raw = sessionStorage.getItem(STORAGE_KEY);
  } catch {
    raw = null;
  }
  if (raw !== snapshotRaw) {
    snapshotRaw = raw;
    snapshotDraft = raw ? parseDraft(raw) : null;
  }
  return snapshotDraft;
}

/** Server and hydration snapshot — always empty, since sessionStorage is
    browser-only. Must be a stable reference, so it is a plain null. */
export function getDraftServerSnapshot(): EstimateDraft | null {
  return null;
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
