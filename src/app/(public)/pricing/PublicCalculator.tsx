"use client";

import { useState } from "react";
import Link from "next/link";
import { EstimateBuilder, emptyBuilderState, type BuilderState } from "@/modules/pricing/EstimateBuilder";

export function PublicCalculator() {
  const [state, setState] = useState<BuilderState>(emptyBuilderState());

  return (
    <EstimateBuilder
      mode="public"
      state={state}
      onChange={setState}
      sidebar={(estimate) => (
        <div className="mt-6 grid gap-3">
          <Link
            href="/#contact"
            className="block text-center rounded-full bg-accent text-bg border border-accent font-semibold uppercase text-[0.82rem] tracking-[0.08em] px-4 py-3 transition-all duration-200 hover:bg-transparent hover:text-accent"
          >
            {estimate.items.length > 0 ? "Request This Quote" : "Talk To Us"}
          </Link>
          <p className="text-muted text-[0.78rem] text-center">
            Estimates are a starting point — every proposal is confirmed after a short discovery
            call.
          </p>
        </div>
      )}
    />
  );
}
