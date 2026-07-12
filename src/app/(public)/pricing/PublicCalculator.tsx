"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { EstimateBuilder, emptyBuilderState, type BuilderState } from "@/modules/pricing/EstimateBuilder";
import { saveDraft } from "@/modules/pricing/estimate-link";

export function PublicCalculator() {
  const router = useRouter();
  const [state, setState] = useState<BuilderState>(emptyBuilderState());

  const requestQuote = () => {
    saveDraft({
      selections: state.selections,
      rushId: state.rushId,
      travelMiles: state.travelMiles,
    });
    router.push("/#contact");
  };

  return (
    <EstimateBuilder
      mode="public"
      state={state}
      onChange={setState}
      sidebar={(estimate) => (
        <div className="mt-6 grid gap-3">
          {estimate.items.length > 0 ? (
            <button
              onClick={requestQuote}
              className="block w-full text-center rounded-full bg-accent text-bg border border-accent font-semibold uppercase text-[0.82rem] tracking-[0.08em] px-4 py-3 transition-all duration-200 hover:bg-transparent hover:text-accent cursor-pointer"
            >
              Request This Quote
            </button>
          ) : (
            <Link
              href="/#contact"
              className="block text-center rounded-full bg-accent text-bg border border-accent font-semibold uppercase text-[0.82rem] tracking-[0.08em] px-4 py-3 transition-all duration-200 hover:bg-transparent hover:text-accent"
            >
              Talk To Us
            </Link>
          )}
          <p className="text-muted text-[0.78rem] text-center">
            {estimate.items.length > 0
              ? "Your estimate rides along with the inquiry — no retyping."
              : "Estimates are a starting point — every proposal is confirmed after a short discovery call."}
          </p>
        </div>
      )}
    />
  );
}
