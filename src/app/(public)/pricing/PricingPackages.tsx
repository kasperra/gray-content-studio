"use client";

import { useRef, useState } from "react";
import { Container } from "@/components/sections";
import { Eyebrow, SectionTitle } from "@/components/Buttons";
import { Reveal } from "@/components/Reveal";
import { emptyBuilderState, type BuilderState } from "@/modules/pricing/EstimateBuilder";
import { getBundle } from "@/modules/pricing/bundles";
import { PACKAGES, EVENT_PACKAGES, EVENT_UPGRADES, type Package } from "@/content/site";
import { PublicCalculator } from "./PublicCalculator";

/** Package cards + the calculator, sharing one estimate state so clicking a
    package loads it into the builder below.

    Two ladders, one calculator: the production packages stack, the event
    packages are alternatives sized to the event. Loading either replaces the
    builder's selections rather than adding to them — nobody is buying a gala
    and a monthly content retainer as one line. */

function PackageCard({
  pkg,
  featured,
  isLoaded,
  onLoad,
}: {
  pkg: Package;
  featured: boolean;
  isLoaded: boolean;
  onLoad: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onLoad}
      aria-label={`Load the ${pkg.name} package into the estimate calculator`}
      className={`group h-full w-full text-left rounded-lg p-7 border flex flex-col cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg ${
        featured
          ? "border-accent bg-accent-soft hover:bg-accent/20"
          : "border-rule bg-surface hover:border-accent/60"
      }`}
    >
      <h3 className="font-display text-[1.35rem] font-semibold">{pkg.name}</h3>
      <p className="font-display text-accent text-[1.6rem] mt-1">{pkg.price}</p>
      <p className="text-muted text-[0.92rem] mt-2">{pkg.tagline}</p>
      <ul className="mt-5 space-y-2 grow">
        {pkg.includes.map((line) => (
          <li key={line} className="flex gap-2.5 text-[0.9rem] text-ink/85">
            <span className="text-accent shrink-0">—</span>
            {line}
          </li>
        ))}
      </ul>
      <p className="text-muted text-[0.8rem] mt-5 pt-4 border-t border-rule">{pkg.note}</p>
      <span
        className={`mt-4 inline-flex items-center gap-1.5 text-[0.82rem] font-semibold transition-colors ${
          isLoaded ? "text-accent" : "text-muted group-hover:text-accent"
        }`}
      >
        {isLoaded ? "Loaded below — adjust anything" : "Use this package"}
        <span aria-hidden="true">→</span>
      </span>
    </button>
  );
}

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
      <section className="pb-20">
        <Container>
          {/* The cards are h3, so this section needs its own h2 — without it the
              page would jump straight from h1 to h3. */}
          <Reveal className="mb-10">
            <Eyebrow>Ongoing &amp; Production</Eyebrow>
            <SectionTitle>Packages that build a content engine</SectionTitle>
          </Reveal>
          <div className="grid md:grid-cols-3 gap-6">
            {PACKAGES.map((p, i) => (
              <Reveal key={p.name} delay={i * 0.1}>
                <PackageCard
                  pkg={p}
                  featured={i === 1}
                  isLoaded={loaded === p.bundleId}
                  onLoad={() => loadPackage(p.bundleId)}
                />
              </Reveal>
            ))}
          </div>
          <p className="text-muted text-[0.85rem] mt-6">
            Pick a package to load it into the calculator — every line stays editable.
          </p>
        </Container>
      </section>

      <section className="py-20 border-t border-rule" id="event-coverage">
        <Container>
          <Reveal className="mb-10">
            <Eyebrow>Event Coverage</Eyebrow>
            <SectionTitle>One event, covered properly</SectionTitle>
            <p className="text-muted text-[1.06rem] max-w-136 mt-4">
              One-time photography and video for galas, conferences, fundraisers, launches, and
              community events — the people, the energy, the details, and the sponsors who paid to
              be seen.
            </p>
          </Reveal>
          <div className="grid md:grid-cols-3 gap-6">
            {EVENT_PACKAGES.map((p, i) => (
              <Reveal key={p.name} delay={i * 0.1}>
                <PackageCard
                  pkg={p}
                  featured={i === 1}
                  isLoaded={loaded === p.bundleId}
                  onLoad={() => loadPackage(p.bundleId)}
                />
              </Reveal>
            ))}
          </div>

          <Reveal className="mt-10">
            <h3 className="font-display text-[1.15rem] font-semibold">Upgrades</h3>
            <ul className="grid sm:grid-cols-2 gap-x-10 mt-4 max-w-4xl">
              {EVENT_UPGRADES.map((u) => (
                <li
                  key={u.name}
                  className="flex items-baseline justify-between gap-4 border-b border-rule py-2.5 text-[0.9rem]"
                >
                  <span className="text-ink/85">{u.name}</span>
                  <span className="text-muted whitespace-nowrap">{u.price}</span>
                </li>
              ))}
            </ul>
            <p className="text-muted text-[0.85rem] mt-6 max-w-[70ch]">
              All event pricing is starting pricing. Final quotes vary with event length, location,
              production requirements, deliverables, staffing, turnaround, and travel.
            </p>
          </Reveal>
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
