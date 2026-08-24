import { NextResponse } from "next/server";
import { getOfferSettings } from "@/modules/offer/actions";

/* Public-safe popup rules.

   Fetched by the popup on idle rather than passed down through the public
   layout, so every marketing page stays statically rendered and nothing about
   the offer is on the critical path. Coupon internals (code prefix, validity
   window) are deliberately not in the response — the browser never decides them. */

export async function GET() {
  const s = await getOfferSettings();
  return NextResponse.json(
    {
      enabled: s.enabled,
      headline: s.headline,
      discountLabel: s.discountLabel,
      discountNote: s.discountNote,
      delaySeconds: s.delaySeconds,
      scrollPercent: s.scrollPercent,
      exitIntent: s.exitIntent,
      suppressDays: s.suppressDays,
      smsEnabled: s.smsEnabled,
      eligibility: s.eligibility,
    },
    { headers: { "Cache-Control": "public, max-age=0, s-maxage=60, stale-while-revalidate=300" } }
  );
}
