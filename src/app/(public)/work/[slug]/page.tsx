import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CASE_STUDIES, getCaseStudy } from "@/content/case-studies";
import { Container } from "@/components/sections";
import { Eyebrow, ButtonGold } from "@/components/Buttons";
import { Reveal } from "@/components/Reveal";

export function generateStaticParams() {
  return CASE_STUDIES.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const cs = getCaseStudy((await params).slug);
  if (!cs) return {};
  return {
    title: `${cs.client} — Case Study`,
    description: cs.summary,
    openGraph: cs.image ? { images: [cs.image] } : undefined,
  };
}

export default async function CaseStudyPage({ params }: { params: Promise<{ slug: string }> }) {
  const cs = getCaseStudy((await params).slug);
  if (!cs) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: `${cs.client}: ${cs.title}`,
    description: cs.summary,
    author: { "@type": "Organization", name: "Gray Content Studio" },
    ...(cs.image ? { image: cs.image } : {}),
  };

  return (
    <article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <section className="relative pt-44 pb-20 overflow-hidden">
        {cs.image && (
          <>
            <div className="absolute inset-0 -z-20">
              <Image src={cs.image} alt="" fill priority sizes="100vw" className="object-cover" />
            </div>
            <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_bottom,rgba(11,11,12,0.78),rgba(11,11,12,0.6)_50%,var(--color-bg)_100%)]" />
          </>
        )}
        <Container>
          <Eyebrow>
            {cs.categoryLabel} · {cs.year}
          </Eyebrow>
          <h1 className="font-display font-semibold leading-[1.08] tracking-[-0.015em] text-[clamp(2.4rem,6vw,4.5rem)] mt-4 max-w-[18ch]">
            {cs.title}
          </h1>
          <p className="font-display text-accent text-[1.3rem] mt-4">{cs.client}</p>
        </Container>
      </section>

      <section className="pb-24">
        <Container className="grid lg:grid-cols-[1.4fr_1fr] gap-14">
          <div className="space-y-12">
            <Reveal>
              <h2 className="font-display text-[1.6rem] font-semibold text-accent">The Challenge</h2>
              <p className="text-ink/85 mt-3 leading-relaxed">{cs.challenge}</p>
            </Reveal>
            <Reveal>
              <h2 className="font-display text-[1.6rem] font-semibold text-accent">The Solution</h2>
              <p className="text-ink/85 mt-3 leading-relaxed">{cs.solution}</p>
            </Reveal>
            {cs.gallery.length > 0 && (
              <Reveal>
                <h2 className="font-display text-[1.6rem] font-semibold text-accent">Gallery</h2>
                <div className="grid sm:grid-cols-2 gap-4 mt-4">
                  {cs.gallery.map((src) => (
                    <div key={src} className="relative aspect-video rounded-md overflow-hidden">
                      <Image src={src} alt={`${cs.client} project imagery`} fill sizes="(max-width:640px) 92vw, 40vw" className="object-cover" />
                    </div>
                  ))}
                </div>
              </Reveal>
            )}
            {cs.testimonial && (
              <Reveal>
                <blockquote className="border-l-2 border-accent pl-6 py-1">
                  <p className="font-display italic text-[1.15rem] text-ink/90">“{cs.testimonial.quote}”</p>
                  <cite className="block not-italic text-muted text-[0.9rem] mt-3">— {cs.testimonial.author}</cite>
                </blockquote>
              </Reveal>
            )}
          </div>

          <aside className="space-y-8 lg:pt-2">
            <Reveal className="bg-surface border border-rule rounded-lg p-7">
              <h2 className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-accent">Deliverables</h2>
              <ul className="mt-4 space-y-2.5">
                {cs.deliverables.map((d) => (
                  <li key={d} className="flex gap-2.5 text-[0.92rem] text-ink/85">
                    <span className="text-accent shrink-0">—</span>
                    {d}
                  </li>
                ))}
              </ul>
            </Reveal>
            <Reveal className="bg-surface border border-rule rounded-lg p-7">
              <h2 className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-accent">Results</h2>
              <ul className="mt-4 space-y-2.5">
                {cs.results.map((r) => (
                  <li key={r} className="flex gap-2.5 text-[0.92rem] text-ink/85">
                    <span className="text-accent shrink-0">✓</span>
                    {r}
                  </li>
                ))}
              </ul>
            </Reveal>
            <Reveal className="bg-accent-soft border border-accent/40 rounded-lg p-7 text-center">
              <p className="font-display text-[1.2rem] font-semibold">Want results like this?</p>
              <ButtonGold href="/#contact" className="mt-5">Start a Project</ButtonGold>
            </Reveal>
          </aside>
        </Container>
      </section>

      <section className="py-10 border-t border-rule">
        <Container className="flex justify-between items-center">
          <Link href="/work" className="text-muted text-[0.9rem] hover:text-ink transition-colors">
            ← All case studies
          </Link>
        </Container>
      </section>
    </article>
  );
}
