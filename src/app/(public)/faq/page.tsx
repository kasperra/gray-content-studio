import type { Metadata } from "next";
import { FAQS } from "@/content/site";
import { Container } from "@/components/sections";
import { Eyebrow } from "@/components/Buttons";
import { FaqList } from "./FaqList";

export const metadata: Metadata = {
  title: "Frequently Asked Questions",
  description:
    "Pricing, process, timelines, revisions, travel, ownership — answers to the questions clients ask Gray Content Studio most.",
};

export default function FaqPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <section className="pt-48 pb-12">
        <Container>
          <Eyebrow>FAQ</Eyebrow>
          <h1 className="font-display font-semibold leading-[1.08] tracking-[-0.015em] text-[clamp(2.6rem,7vw,5.5rem)] mt-4">
            Answers, upfront
          </h1>
        </Container>
      </section>
      <section className="pb-28">
        <Container className="max-w-176">
          <FaqList />
        </Container>
      </section>
    </>
  );
}
