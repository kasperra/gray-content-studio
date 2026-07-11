"use client";

import { useMemo, useState } from "react";
import {
  PRICING_CATEGORIES,
  RUSH_OPTIONS,
  TRAVEL_FREE_MILES,
  TRAVEL_RATE,
  DEFAULT_DEPOSIT_PCT,
  money,
  type RushId,
} from "./data";
import { computeEstimate, type Estimate, type EstimateInput } from "./compute";

export type BuilderState = {
  selections: Record<string, number>;
  rushId: RushId;
  travelMiles: number;
  discountType: "none" | "pct" | "flat";
  discountValue: number;
  depositPct: number;
};

export const emptyBuilderState = (): BuilderState => ({
  selections: {},
  rushId: "none",
  travelMiles: 0,
  discountType: "none",
  discountValue: 0,
  depositPct: DEFAULT_DEPOSIT_PCT,
});

const fieldCls =
  "w-full font-body text-[0.95rem] text-ink bg-bg border border-rule rounded px-3 py-2 focus:outline-none focus:border-accent transition-colors";
const labelCls = "text-[0.72rem] font-medium uppercase tracking-[0.14em] text-muted";

/** Interactive service calculator. mode="public" = estimate only; mode="admin" adds discount/deposit + rate editing. */
export function EstimateBuilder({
  mode,
  state,
  onChange,
  priceOverrides = {},
  onPriceOverride,
  sidebar,
}: {
  mode: "public" | "admin";
  state: BuilderState;
  onChange: (next: BuilderState) => void;
  priceOverrides?: Record<string, number>;
  onPriceOverride?: (serviceId: string, price: number | null) => void;
  /** Extra content rendered under the totals (CTAs, save buttons) */
  sidebar?: (estimate: Estimate) => React.ReactNode;
}) {
  const [open, setOpen] = useState<Record<string, boolean>>({ [PRICING_CATEGORIES[0].id]: true });
  const [editRates, setEditRates] = useState(false);

  const estimate = useMemo(() => {
    const input: EstimateInput = { ...state, priceOverrides };
    return computeEstimate(input);
  }, [state, priceOverrides]);

  const setQty = (id: string, qty: number) => {
    const selections = { ...state.selections };
    if (qty > 0) selections[id] = qty;
    else delete selections[id];
    onChange({ ...state, selections });
  };

  return (
    <div className="grid lg:grid-cols-[1fr_340px] gap-8 items-start">
      <div>
        {mode === "admin" && (
          <label className="flex items-center gap-2.5 mb-4 text-[0.82rem] text-muted cursor-pointer select-none">
            <input
              type="checkbox"
              checked={editRates}
              onChange={(e) => setEditRates(e.target.checked)}
              className="accent-[var(--color-accent)] w-4 h-4"
            />
            Edit rates (overrides persist for future estimates)
          </label>
        )}
        <div className="space-y-3">
          {PRICING_CATEGORIES.map((cat) => {
            const selCount = cat.services.filter((s) => state.selections[s.id] > 0).length;
            const isOpen = open[cat.id] ?? selCount > 0;
            return (
              <div key={cat.id} className="border border-rule rounded-md overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpen({ ...open, [cat.id]: !isOpen })}
                  className="w-full flex items-center justify-between gap-4 px-5 py-3.5 bg-surface-2 text-[0.92rem] font-semibold tracking-[0.06em] cursor-pointer"
                >
                  <span>{cat.name}</span>
                  <span className="flex items-center gap-3.5 text-[0.82rem] font-medium text-muted">
                    {selCount > 0 && <span className="text-accent">{selCount} selected</span>}
                    <span className={`transition-transform ${isOpen ? "rotate-180" : ""}`}>▾</span>
                  </span>
                </button>
                {isOpen && (
                  <div>
                    {cat.services.map((svc) => {
                      const qty = state.selections[svc.id] ?? 0;
                      const price = priceOverrides[svc.id] ?? svc.price;
                      const selected = qty > 0;
                      return (
                        <div
                          key={svc.id}
                          className="grid grid-cols-[auto_1fr_78px_96px] sm:grid-cols-[auto_1fr_100px_84px_100px] gap-3.5 items-center px-5 py-2.5 border-t border-rule hover:bg-ink/2"
                        >
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={(e) => setQty(svc.id, e.target.checked ? Math.max(qty, 1) : 0)}
                            aria-label={`Include ${svc.name}`}
                            className="accent-[var(--color-accent)] w-[17px] h-[17px] cursor-pointer"
                          />
                          <div className="text-[0.92rem]">
                            {svc.name}
                            <span className="block text-muted text-[0.78rem]">per {svc.unit}</span>
                          </div>
                          <div className="hidden sm:block text-right text-[0.9rem]">
                            {mode === "admin" && editRates && onPriceOverride ? (
                              <input
                                type="number"
                                min={0}
                                step={0.01}
                                defaultValue={price}
                                onBlur={(e) => {
                                  const v = parseFloat(e.target.value);
                                  if (!isNaN(v) && v >= 0)
                                    onPriceOverride(svc.id, v === svc.price ? null : v);
                                }}
                                aria-label={`Unit price for ${svc.name}`}
                                className={`${fieldCls} text-right !border-accent py-1`}
                              />
                            ) : (
                              <span className={priceOverrides[svc.id] != null ? "text-accent" : "text-muted"}>
                                {money(price)}
                              </span>
                            )}
                          </div>
                          <input
                            type="number"
                            min={0}
                            step={1}
                            value={qty || ""}
                            placeholder="0"
                            onChange={(e) => setQty(svc.id, Math.max(0, parseFloat(e.target.value) || 0))}
                            aria-label={`Quantity of ${svc.name}`}
                            className={`${fieldCls} text-center py-1.5`}
                          />
                          <div className={`text-right text-[0.92rem] tabular-nums ${selected ? "text-accent font-semibold" : "text-muted"}`}>
                            {selected ? money(price * qty) : "—"}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="grid sm:grid-cols-2 gap-4 mt-6">
          <div className="grid gap-1.5">
            <label htmlFor="eb-rush" className={labelCls}>Delivery Speed</label>
            <select
              id="eb-rush"
              value={state.rushId}
              onChange={(e) => onChange({ ...state, rushId: e.target.value as RushId })}
              className={fieldCls}
            >
              {RUSH_OPTIONS.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                  {r.pct > 0 ? ` (+${r.pct}%)` : ""}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-1.5">
            <label htmlFor="eb-miles" className={labelCls}>
              Travel — round-trip miles (first {TRAVEL_FREE_MILES} free, then ${TRAVEL_RATE}/mi)
            </label>
            <input
              id="eb-miles"
              type="number"
              min={0}
              step={1}
              value={state.travelMiles || ""}
              placeholder="0"
              onChange={(e) => onChange({ ...state, travelMiles: Math.max(0, parseFloat(e.target.value) || 0) })}
              className={fieldCls}
            />
          </div>
        </div>
      </div>

      {/* Totals */}
      <aside className="lg:sticky lg:top-24 bg-surface border border-rule rounded-lg p-6">
        <h2 className="font-display text-[1.25rem] font-semibold mb-4">Estimate</h2>
        <Row label="Services Subtotal" value={money(estimate.subtotal)} />
        {estimate.rushPct > 0 && (
          <Row label={`${estimate.rushName} (+${estimate.rushPct}%)`} value={money(estimate.rushAmt)} />
        )}
        {estimate.travelAmt > 0 && <Row label="Travel Fee" value={money(estimate.travelAmt)} />}
        {mode === "admin" && (
          <div className="grid grid-cols-3 gap-3 my-4">
            <div className="grid gap-1">
              <label htmlFor="eb-dtype" className={labelCls}>Discount</label>
              <select
                id="eb-dtype"
                value={state.discountType}
                onChange={(e) => onChange({ ...state, discountType: e.target.value as BuilderState["discountType"] })}
                className={fieldCls}
              >
                <option value="none">None</option>
                <option value="pct">%</option>
                <option value="flat">$</option>
              </select>
            </div>
            <div className="grid gap-1">
              <label htmlFor="eb-dval" className={labelCls}>Amount</label>
              <input
                id="eb-dval"
                type="number"
                min={0}
                value={state.discountValue || ""}
                placeholder="0"
                onChange={(e) => onChange({ ...state, discountValue: Math.max(0, parseFloat(e.target.value) || 0) })}
                className={fieldCls}
              />
            </div>
            <div className="grid gap-1">
              <label htmlFor="eb-dep" className={labelCls}>Deposit %</label>
              <input
                id="eb-dep"
                type="number"
                min={0}
                max={100}
                value={state.depositPct}
                onChange={(e) => onChange({ ...state, depositPct: Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)) })}
                className={fieldCls}
              />
            </div>
          </div>
        )}
        {estimate.discountAmt > 0 && <Row label="Discount" value={`−${money(estimate.discountAmt)}`} />}
        <div className="flex justify-between gap-4 border-t border-rule mt-3 pt-4 items-baseline">
          <span className="font-semibold text-[1.05rem]">Total</span>
          <span className="font-display text-accent text-[1.35rem] tabular-nums">{money(estimate.total)}</span>
        </div>
        <Row label={`Deposit to book (${estimate.depositPct}%)`} value={money(estimate.deposit)} />
        <Row label="Balance on delivery" value={money(estimate.balance)} />
        {sidebar?.(estimate)}
      </aside>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 py-1.5 text-[0.93rem] text-muted tabular-nums">
      <span>{label}</span>
      <span className="text-ink">{value}</span>
    </div>
  );
}
