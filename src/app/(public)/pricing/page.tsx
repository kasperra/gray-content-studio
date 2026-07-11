import type { Metadata } from "next";
import { PACKAGES } from "@/content/site";
import { Container } from "@/components/sections";
import { Eyebrow, SectionTitle } from "@/components/Buttons";
import { Reveal } from "@/components/Reveal";
import { PublicCalculator } from "./PublicCalculator";

export const metadata: Metadata = {
  title: "Pricing & Estimate Calculator",
  description:
    "Transparent video production pricing — package examples and a real-time estimate calculator built on Gray Content Studio's public rate card.",
};

export default function PricingPage() {
  return (
    <>
      <section className="pt-48 pb-16">
        <Container>
          <Eyebrow>Pricing</Eyebrow>
          <h1 className="font-display font-semibold leading-[1.08] tracking-[-0.015em] text-[clamp(2.6rem,7vw,5.5rem)] mt-4 max-w-[14ch]">
            Real numbers, before the sales call
          </h1>
          <p className="text-muted text-[1.06rem] max-w-136 mt-5">
            Our rate card is public. Start from a package below, or build your exact scope in the
            calculator — then send it to us as an inquiry.
          </p>
        </Container>
      </section>

      <section className="pb-24">
        <Container>
          <div className="grid md:grid-cols-3 gap-6">
            {PACKAGES.map((p, i) => (
              <Reveal key={p.name} delay={i * 0.1}>
                <div className={`h-full rounded-lg p-7 border flex flex-col ${i === 1 ? "border-accent bg-accent-soft" : "border-rule bg-surface"}`}>
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
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      <section className="py-24 border-t border-rule" id="calculator">
        <Container>
          <Reveal className="mb-12">
            <Eyebrow>Estimate Calculator</Eyebrow>
            <SectionTitle>Build your exact scope</SectionTitle>
            <p className="text-muted text-[1.06rem] max-w-136 mt-4">
              Check the services you need, set quantities, and watch the estimate update — the
              same rate card we quote from.
            </p>
          </Reveal>
          <PublicCalculator />
        </Container>
      </section>
    </>
  );
}
