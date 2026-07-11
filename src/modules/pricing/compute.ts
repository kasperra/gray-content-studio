import {
  PRICING_CATEGORIES,
  RUSH_OPTIONS,
  TRAVEL_RATE,
  TRAVEL_FREE_MILES,
  type RushId,
} from "./data";

export type LineItem = {
  id: string;
  name: string;
  unit: string;
  price: number;
  qty: number;
  total: number;
  category: string;
};

export type EstimateInput = {
  /** serviceId -> quantity (only selected services, qty > 0) */
  selections: Record<string, number>;
  /** serviceId -> overridden unit price (admin rate edits) */
  priceOverrides?: Record<string, number>;
  rushId: RushId;
  travelMiles: number;
  discountType: "none" | "pct" | "flat";
  discountValue: number;
  depositPct: number;
};

export type Estimate = {
  items: LineItem[];
  subtotal: number;
  rushId: RushId;
  rushName: string;
  rushPct: number;
  rushAmt: number;
  travelMiles: number;
  travelAmt: number;
  discountType: "none" | "pct" | "flat";
  discountValue: number;
  discountAmt: number;
  total: number;
  depositPct: number;
  deposit: number;
  balance: number;
};

export function computeEstimate(input: EstimateInput): Estimate {
  const overrides = input.priceOverrides ?? {};
  const items: LineItem[] = [];

  for (const cat of PRICING_CATEGORIES) {
    for (const svc of cat.services) {
      const qty = input.selections[svc.id];
      if (qty && qty > 0) {
        const price = overrides[svc.id] ?? svc.price;
        items.push({
          id: svc.id,
          name: svc.name,
          unit: svc.unit,
          price,
          qty,
          total: price * qty,
          category: cat.name,
        });
      }
    }
  }

  const subtotal = items.reduce((s, i) => s + i.total, 0);

  const rush = RUSH_OPTIONS.find((r) => r.id === input.rushId) ?? RUSH_OPTIONS[0];
  const rushAmt = subtotal * (rush.pct / 100);

  const travelAmt = Math.max(0, input.travelMiles - TRAVEL_FREE_MILES) * TRAVEL_RATE;

  const preDiscount = subtotal + rushAmt + travelAmt;
  let discountAmt = 0;
  if (input.discountType === "pct") {
    discountAmt = preDiscount * (Math.min(input.discountValue, 100) / 100);
  } else if (input.discountType === "flat") {
    discountAmt = Math.min(input.discountValue, preDiscount);
  }

  const total = preDiscount - discountAmt;
  const depositPct = Math.min(Math.max(input.depositPct, 0), 100);
  const deposit = total * (depositPct / 100);

  return {
    items,
    subtotal,
    rushId: rush.id,
    rushName: rush.name,
    rushPct: rush.pct,
    rushAmt,
    travelMiles: input.travelMiles,
    travelAmt,
    discountType: input.discountType,
    discountValue: input.discountValue,
    discountAmt,
    total,
    depositPct,
    deposit,
    balance: total - deposit,
  };
}
