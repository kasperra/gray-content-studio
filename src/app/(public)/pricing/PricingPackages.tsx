"use client";

import { useRef, useState } from "react";
import { Container } from "@/components/sections";
import { Eyebrow, SectionTitle } from "@/components/Buttons";
import { Reveal } from "@/components/Reveal";
import { emptyBuilderState, type BuilderState } from "@/modules/pricing/EstimateBuilder";
import { getBundle } from "@/modules/pricing/bundles";
import { PACKAGES } from "@/content/site";
import { PublicCalculator } from "./PublicCalculator";

/** Package cards + the calculator, sharing one estimate state so clicking a
    package loads it into the builder below. */
export function PricingPackages() {
  const [state, setState] = useState<BuilderState>(emptyBuilderState());
  const [loaded, setLoaded] = useState<string | undefined>();
  const calculatorRef = useRef<HTMLElement>(null);

  const loadPackage = (bundleId: string) => {
    const bundle = getBundle(bundleId);
    if (!bundle) return;
    setState({ ...emptyBuilderState(), selections: { ...bundle.selections } });
    setLoaded(bundleId);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    calculatorRef.current?.scrollIntoView({
      behavior: reduce ? "auto" : "smooth",
      block: "start",
    });
  };

  return (
    <>
      <section className="pb-24">
        <Container>
          <div className="grid md:grid-cols-3 gap-6">
            {PACKAGES.map((p, i) => {
              const isLoaded = loaded === p.bundleId;
              const featured = i === 1;
              return (
                <Reveal key={p.name} delay={i * 0.1}>
                  <button
                    type="button"
                    onClick={() => loadPackage(p.bundleId)}
                    aria-label={`Load the ${p.name} package into the estimate calculator`}
                    className={`group h-full w-full text-left rounded-lg p-7 border flex flex-col cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg ${
                      featured
                        ? "border-accent bg-accent-soft hover:bg-accent/20"
                        : "border-rule bg-surface hover:border-accent/60"
                    }`}
                  >
                    <h2 className="font-display text-[1.35rem] font-semibold">{p.name}</h2>
                    <p className="font-display text-accent text-[1.6rem] mt-1">{p.price}</p>
                    <p className="text-muted text-[0.92rem] mt-2">{p.tagline}</p>
                    <ul className="mt-5 space-y-2 grow">
                      {p.includes.map((line) => (
                        <li key={line} className="flex gap-2.5 text-[0.9rem] text-ink/85">
                          <span className="text-accent shrink-0">—</span>
                          {line}
                        </li>
                      ))}
                    </ul>
                    <p className="text-muted text-[0.8rem] mt-5 pt-4 border-t border-rule">{p.note}</p>
                    <span
                      className={`mt-4 inline-flex items-center gap-1.5 text-[0.82rem] font-semibold transition-colors ${
                        isLoaded ? "text-accent" : "text-muted group-hover:text-accent"
                      }`}
                    >
                      {isLoaded ? "Loaded below — adjust anything" : "Use this package"}
                      <span aria-hidden="true">→</span>
                    </span>
                  </button>
                </Reveal>
              );
            })}
          </div>
          <p className="text-muted text-[0.85rem] mt-6">
            Pick a package to load it into the calculator — every line stays editable.
          </p>
        </Container>
      </section>

      <section ref={calculatorRef} className="py-24 border-t border-rule scroll-mt-20" id="calculator">
        <Container>
          <Reveal className="mb-12">
            <Eyebrow>Estimate Calculator</Eyebrow>
            <SectionTitle>Build your exact scope</SectionTitle>
            <p className="text-muted text-[1.06rem] max-w-136 mt-4">
              Check the services you need, set quantities, and watch the estimate update — the same
              rate card we quote from.
            </p>
          </Reveal>
          <PublicCalculator state={state} onChange={setState} />
        </Container>
      </section>
    </>
  );
}
