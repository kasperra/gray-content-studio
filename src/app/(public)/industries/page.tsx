import type { Metadata } from "next";
import Link from "next/link";
import { INDUSTRIES } from "@/content/site";
import { Container } from "@/components/sections";
import { Eyebrow, ButtonGold } from "@/components/Buttons";
import { Reveal } from "@/components/Reveal";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Industries We Shoot For",
  description:
    "Video production built around how each industry actually sells — contractors, restaurants, medical, real estate, automotive, gyms, SaaS, and ecommerce.",
};

/* The hub the eight /industries/[slug] pages were missing.

   Each vertical page used to carry exactly one inbound link (a card on the home
   page), with the footer's "Industries" entry pointing at /industries/real-estate
   alone. Search Console indexed three of the eight and left the rest as
   discovered-but-not-indexed. A hub gives every vertical a crawlable path from
   the footer of all ~36 public pages, and gives the set a page of its own to
   rank for the category query. */
export default function IndustriesPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Industries We Shoot For",
    url: `${SITE_URL}/industries`,
    hasPart: INDUSTRIES.map((i) => ({
      "@type": "WebPage",
      name: `Video Production for ${i.name}`,
      url: `${SITE_URL}/industries/${i.slug}`,
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <section className="pt-48 pb-16">
        <Container>
          <Eyebrow>Industries</Eyebrow>
          <h1 className="font-display font-semibold leading-[1.08] tracking-[-0.015em] text-[clamp(2.6rem,7vw,5.5rem)] mt-4 max-w-[15ch]">
            Every industry sells differently
          </h1>
          <p className="text-muted text-[1.06rem] max-w-136 mt-5">
            A contractor&apos;s best asset is finished work. A restaurant&apos;s is appetite. A
            clinic&apos;s is trust. We shoot to the way your market actually decides — here is what
            that looks like in eight of them.
          </p>
        </Container>
      </section>

      <section className="pb-28">
        <Container>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {INDUSTRIES.map((ind, i) => (
              <Reveal key={ind.slug} delay={(i % 3) * 0.08}>
                <Link
                  href={`/industries/${ind.slug}`}
                  className="group flex h-full flex-col rounded-lg border border-rule bg-surface p-7 transition-colors hover:border-accent/50"
                >
                  <h2 className="font-display text-[1.22rem] font-semibold leading-snug transition-colors group-hover:text-accent">
                    {ind.name}
                  </h2>
                  <p className="text-accent text-[0.92rem] mt-2.5 leading-snug">{ind.headline}</p>
                  <p className="text-muted text-[0.9rem] mt-4 leading-relaxed">{ind.pain}</p>
                  <ul className="mt-5 space-y-1.5">
                    {ind.services.slice(0, 3).map((s) => (
                      <li key={s} className="flex gap-2 text-[0.85rem] text-ink/75">
                        <span className="text-accent shrink-0">—</span>
                        {s}
                      </li>
                    ))}
                  </ul>
                  <span className="text-accent text-[0.85rem] font-semibold mt-6 pt-5 border-t border-rule">
                    See how we shoot it →
                  </span>
                </Link>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      <section className="text-center py-24 border-t border-rule bg-[radial-gradient(60%_80%_at_50%_100%,var(--color-accent-soft),transparent_60%)]">
        <Container>
          <Eyebrow>Not Listed?</Eyebrow>
          <h2 className="font-display font-semibold text-[clamp(2rem,4.5vw,3.2rem)] mt-2">
            We have probably shot something close
          </h2>
          <p className="text-muted text-[1rem] max-w-120 mx-auto mt-5">
            Fifteen case studies span energy, healthcare, politics, nonprofits, ecommerce, and
            media. Tell us the market and we will show you the closest thing we have made.
          </p>
          <ButtonGold href="/#contact" className="mt-9">Start a Project</ButtonGold>
          <p className="mt-6">
            <Link href="/work" className="text-muted text-[0.9rem] hover:text-ink transition-colors">
              or browse selected work →
            </Link>
          </p>
        </Container>
      </section>
    </>
  );
}
