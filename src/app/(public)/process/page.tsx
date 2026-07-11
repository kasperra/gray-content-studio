import type { Metadata } from "next";
import { PROCESS_STEPS } from "@/content/site";
import { Container } from "@/components/sections";
import { Eyebrow, ButtonGold } from "@/components/Buttons";
import { Reveal } from "@/components/Reveal";

export const metadata: Metadata = {
  title: "Our Production Process",
  description:
    "How Gray Content Studio takes projects from discovery to distribution — a transparent seven-step production process.",
};

export default function ProcessPage() {
  return (
    <>
      <section className="pt-48 pb-16">
        <Container>
          <Eyebrow>How We Work</Eyebrow>
          <h1 className="font-display font-semibold leading-[1.08] tracking-[-0.015em] text-[clamp(2.6rem,7vw,5.5rem)] mt-4 max-w-[14ch]">
            From first call to final frame
          </h1>
          <p className="text-muted text-[1.06rem] max-w-136 mt-5">
            Seven steps, no surprises. You&apos;ll know where your project stands at every moment —
            because clarity is part of the product.
          </p>
        </Container>
      </section>

      <section className="pb-24">
        <Container className="max-w-176">
          <ol className="relative border-l border-rule ml-3 space-y-12">
            {PROCESS_STEPS.map((step, i) => (
              <Reveal key={step.title} as="li" className="relative pl-10">
                <span className="absolute -left-[13px] top-1 w-6 h-6 rounded-full bg-surface border border-accent flex items-center justify-center text-[0.65rem] font-semibold text-accent">
                  {i + 1}
                </span>
                <h2 className="font-display text-[1.5rem] font-semibold">{step.title}</h2>
                <p className="text-muted mt-2 leading-relaxed">{step.text}</p>
              </Reveal>
            ))}
          </ol>
        </Container>
      </section>

      <section className="text-center py-24 border-t border-rule bg-[radial-gradient(60%_80%_at_50%_100%,var(--color-accent-soft),transparent_60%)]">
        <Container>
          <h2 className="font-display font-semibold text-[clamp(2rem,4.5vw,3.2rem)]">
            Step one is a conversation
          </h2>
          <ButtonGold href="/#contact" className="mt-9">Start Discovery</ButtonGold>
        </Container>
      </section>
    </>
  );
}
