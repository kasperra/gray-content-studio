import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { INDUSTRIES, getIndustry } from "@/content/site";
import { CASE_STUDIES } from "@/content/case-studies";
import { Container, WorkCard } from "@/components/sections";
import { Eyebrow, ButtonGold, SectionTitle } from "@/components/Buttons";
import { Reveal } from "@/components/Reveal";

export function generateStaticParams() {
  return INDUSTRIES.map((i) => ({ slug: i.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const ind = getIndustry((await params).slug);
  if (!ind) return {};
  return {
    title: `Video Production for ${ind.name}`,
    description: `${ind.headline}. ${ind.approach}`,
  };
}

/* Map industries to loosely-related portfolio categories for the proof section */
const RELATED: Record<string, string[]> = {
  contractors: ["ll-flooring", "dominion-energy"],
  restaurants: ["visit-tappahannock", "essential-elements"],
  medical: ["anthem", "1md-nutrition"],
  "real-estate": ["ll-flooring", "visit-tappahannock"],
  automotive: ["exxonmobil", "ll-flooring"],
  gyms: ["essential-elements", "1md-nutrition"],
  saas: ["gigantic", "vpap"],
  ecommerce: ["1md-nutrition", "hair-la-vie"],
};

export default async function IndustryPage({ params }: { params: Promise<{ slug: string }> }) {
  const ind = getIndustry((await params).slug);
  if (!ind) notFound();

  const related = (RELATED[ind.slug] ?? [])
    .map((slug) => CASE_STUDIES.find((c) => c.slug === slug))
    .filter((c): c is NonNullable<typeof c> => Boolean(c));

  return (
    <>
      <section className="pt-48 pb-16">
        <Container>
          <Eyebrow>Industries · {ind.name}</Eyebrow>
          <h1 className="font-display font-semibold leading-[1.08] tracking-[-0.015em] text-[clamp(2.4rem,6.5vw,5rem)] mt-4 max-w-[16ch]">
            {ind.headline}
          </h1>
        </Container>
      </section>

      <section className="pb-20">
        <Container className="grid md:grid-cols-2 gap-12">
          <Reveal>
            <h2 className="font-display text-[1.5rem] font-semibold text-accent">The problem</h2>
            <p className="text-ink/85 mt-3 leading-relaxed">{ind.pain}</p>
          </Reveal>
          <Reveal delay={0.1}>
            <h2 className="font-display text-[1.5rem] font-semibold text-accent">Our approach</h2>
            <p className="text-ink/85 mt-3 leading-relaxed">{ind.approach}</p>
          </Reveal>
        </Container>
      </section>

      <section className="py-20 border-t border-rule">
        <Container>
          <Reveal>
            <SectionTitle className="text-[clamp(1.6rem,3.5vw,2.4rem)]">
              What we build for {ind.name.toLowerCase()}
            </SectionTitle>
          </Reveal>
          <div className="flex flex-wrap gap-3 mt-8">
            {ind.services.map((s, i) => (
              <Reveal key={s} delay={i * 0.06}>
                <span className="inline-block border border-rule rounded-full px-6 py-2.5 text-[0.9rem] text-ink/85">
                  {s}
                </span>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {related.length > 0 && (
        <section className="py-20 border-t border-rule">
          <Container>
            <Reveal>
              <Eyebrow>Related Work</Eyebrow>
            </Reveal>
            <div className="grid sm:grid-cols-2 gap-6 mt-8 max-w-176">
              {related.map((cs, i) => (
                <WorkCard key={cs.slug} cs={cs} delay={i * 0.1} />
              ))}
            </div>
          </Container>
        </section>
      )}

      <section className="text-center py-24 border-t border-rule bg-[radial-gradient(60%_80%_at_50%_100%,var(--color-accent-soft),transparent_60%)]">
        <Container>
          <h2 className="font-display font-semibold text-[clamp(2rem,4.5vw,3.2rem)]">
            Ready to own your market&apos;s attention?
          </h2>
          <ButtonGold href="/#contact" className="mt-9">Get a Quote</ButtonGold>
          <p className="mt-6">
            <Link href="/pricing" className="text-muted text-[0.9rem] hover:text-ink transition-colors">
              or build your own estimate →
            </Link>
          </p>
        </Container>
      </section>
    </>
  );
}
