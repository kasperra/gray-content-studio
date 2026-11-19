import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/sections";
import { Eyebrow } from "@/components/Buttons";
import { PricingPackages } from "./PricingPackages";

export const metadata: Metadata = {
  title: "Pricing & Estimate Calculator",
  description:
    "Transparent video production and event coverage pricing — package examples, event photography and video packages from $450, and a real-time estimate calculator built on Gray Content Studio's public rate card.",
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
            Our rate card is public. Start from a production package or an event coverage package
            below, or build your exact scope in the calculator — then send it to us as an inquiry.
          </p>
          {/* The rate card's companion read. The article sat on a single inbound
              link from /blog and never got indexed; this is also the page a
              visitor comparing quotes actually wants next. */}
          <p className="mt-6">
            <Link
              href="/blog/how-much-does-video-production-cost"
              className="text-accent text-[0.9rem] font-semibold hover:underline underline-offset-4"
            >
              Read the full breakdown: how much does video production actually cost? →
            </Link>
          </p>
        </Container>
      </section>

      <PricingPackages />
    </>
  );
}
