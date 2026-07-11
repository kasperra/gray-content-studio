import type { Metadata } from "next";
import { WorkGrid } from "./WorkGrid";
import { Container } from "@/components/sections";
import { Eyebrow } from "@/components/Buttons";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Selected Work & Case Studies",
  description:
    "Case studies from Gray Content Studio — video production for ExxonMobil, Anthem, Dominion Energy, iHeartRadio, national campaigns, and more.",
};

export default function WorkPage() {
  return (
    <>
      <section className="relative pt-48 pb-24 overflow-hidden">
        <div className="absolute inset-0 -z-20">
          <Image
            src="/img/mamdani-1.jpg"
            alt="Confetti falling at a victory celebration"
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        </div>
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_bottom,rgba(11,11,12,0.72),rgba(11,11,12,0.55)_50%,var(--color-bg)_100%)]" />
        <Container>
          <Eyebrow>Portfolio</Eyebrow>
          <h1 className="font-display font-semibold leading-[1.05] tracking-[-0.015em] text-[clamp(3rem,9vw,7rem)] mt-4">
            Selected Work
          </h1>
          <p className="text-muted text-[clamp(1rem,1.6vw,1.18rem)] max-w-120 mt-5">
            Fifteen clients. Boardrooms, ballots, and billion-view platforms — every frame cut to
            move an audience.
          </p>
        </Container>
      </section>

      <section className="pb-28">
        <Container>
          <WorkGrid />
        </Container>
      </section>

      <section className="text-center py-28 border-t border-rule bg-[radial-gradient(60%_80%_at_50%_100%,var(--color-accent-soft),transparent_60%)]">
        <Container>
          <Eyebrow>Next Up</Eyebrow>
          <h2 className="font-display font-semibold text-[clamp(2.2rem,5vw,3.8rem)] mt-2">
            Have a story to tell?
          </h2>
          <a
            href="/#contact"
            className="inline-block mt-10 rounded-full bg-accent text-bg border border-accent font-semibold uppercase text-[0.88rem] tracking-[0.08em] px-[1.9em] py-[0.78em] transition-all duration-200 hover:bg-transparent hover:text-accent hover:-translate-y-0.5"
          >
            Start a Project
          </a>
        </Container>
      </section>
    </>
  );
}
