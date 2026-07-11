import Image from "next/image";
import Link from "next/link";
import { ButtonGold, ButtonGhost, Eyebrow, SectionTitle } from "@/components/Buttons";
import { Reveal } from "@/components/Reveal";
import { ContactForm } from "@/components/ContactForm";
import { Container, TrustedBy, WorkCard, TestimonialCards, SectionHead } from "@/components/sections";
import { SERVICES, PROCESS_STEPS, INDUSTRIES, PACKAGES, FAQS } from "@/content/site";
import { CASE_STUDIES } from "@/content/case-studies";

const ORG_JSONLD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://gray-content-studio.vercel.app/#org",
      name: "Gray Content Studio",
      url: "https://gray-content-studio.vercel.app",
      description:
        "Video production, editing, and 2D animation studio for Fortune 500 brands, campaigns, and creators.",
      logo: "https://gray-content-studio.vercel.app/img/iheart.jpg",
    },
    {
      "@type": "LocalBusiness",
      name: "Gray Content Studio",
      "@id": "https://gray-content-studio.vercel.app/#business",
      url: "https://gray-content-studio.vercel.app",
      priceRange: "$$",
      areaServed: "United States",
    },
    ...SERVICES.slice(0, 8).map((s) => ({
      "@type": "Service",
      name: s.title,
      description: s.outcome,
      provider: { "@id": "https://gray-content-studio.vercel.app/#org" },
    })),
  ],
};

export default function HomePage() {
  const featured = CASE_STUDIES.filter((c) => c.featured).slice(0, 3);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ORG_JSONLD) }}
      />

      {/* Hero — swap the Image for a muted autoplay <video> when a showreel file exists */}
      <section className="relative min-h-svh flex items-center overflow-hidden">
        <div className="absolute inset-0 -z-20">
          <Image
            src="/img/iheart.jpg"
            alt="Cinematic audio waveform glowing red and gold against black"
            fill
            priority
            fetchPriority="high"
            sizes="100vw"
            className="object-cover animate-kenburns"
          />
        </div>
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,rgba(11,11,12,0.92)_0%,rgba(11,11,12,0.55)_55%,rgba(11,11,12,0.25)_100%),linear-gradient(to_top,var(--color-bg)_0%,transparent_35%)]" />
        <Container className="py-36">
          <Eyebrow>Video Production · Editing · Animation</Eyebrow>
          <h1 className="font-display font-semibold leading-[1.08] tracking-[-0.015em] text-[clamp(2.8rem,8vw,6.2rem)] max-w-[11ch] mt-6">
            Stories that <em className="italic font-normal text-accent">move.</em> Brands that stick.
          </h1>
          <p className="text-muted text-[clamp(1rem,1.6vw,1.18rem)] max-w-120 mt-6">
            Gray Content Studio turns raw footage into cinematic campaigns — for Fortune 500
            boardrooms, national political stages, and brands that demand to be watched.
          </p>
          <div className="flex items-center gap-6 flex-wrap mt-10">
            <ButtonGold href="/#contact">Get a Quote</ButtonGold>
            <ButtonGhost href="/work">View Portfolio</ButtonGhost>
          </div>
        </Container>
      </section>

      <TrustedBy />

      {/* Services */}
      <section className="py-28" id="services">
        <Container>
          <SectionHead
            eyebrow="What We Do"
            title="Services built around business outcomes"
            lede="Every service exists to do a job for your business — win the listing, fill the class, close the enterprise deal."
          />
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
            {SERVICES.map((s, i) => (
              <Reveal key={s.title} delay={(i % 4) * 0.1}>
                <div className="relative border-t border-rule pt-6 h-full before:content-[''] before:absolute before:-top-px before:left-0 before:w-12 before:h-px before:bg-accent">
                  <span className="font-display italic text-accent text-[0.95rem]">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="font-display text-[1.3rem] font-semibold mt-2">{s.title}</h3>
                  <p className="text-muted text-[0.94rem] mt-3">{s.outcome}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {/* Process */}
      <section className="py-28 border-t border-rule bg-[radial-gradient(70%_60%_at_20%_0%,var(--color-accent-soft),transparent_55%)]">
        <Container>
          <SectionHead
            eyebrow="How We Work"
            title="A production process you can see coming"
            lede="No mystery, no scope creep — seven steps from first conversation to content in the wild."
          />
          <ol className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {PROCESS_STEPS.map((step, i) => (
              <Reveal key={step.title} delay={(i % 4) * 0.08} as="li">
                <div className="h-full bg-surface border border-rule rounded-lg p-6">
                  <span className="font-display italic text-accent">{String(i + 1).padStart(2, "0")}</span>
                  <h3 className="font-display text-[1.15rem] font-semibold mt-1.5">{step.title}</h3>
                  <p className="text-muted text-[0.9rem] mt-2.5">{step.text}</p>
                </div>
              </Reveal>
            ))}
          </ol>
          <Reveal className="mt-10 text-center">
            <Link href="/process" className="text-accent text-[0.9rem] font-semibold hover:underline underline-offset-4">
              See the full process →
            </Link>
          </Reveal>
        </Container>
      </section>

      {/* Featured work */}
      <section className="py-28">
        <Container>
          <SectionHead eyebrow="Featured Work" title="Recent selected projects" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featured.map((cs, i) => (
              <WorkCard key={cs.slug} cs={cs} delay={i * 0.12} />
            ))}
          </div>
          <Reveal className="mt-10 text-center">
            <ButtonGhost href="/work">See All Case Studies</ButtonGhost>
          </Reveal>
        </Container>
      </section>

      {/* Industries */}
      <section className="py-28 border-t border-rule">
        <Container>
          <SectionHead
            eyebrow="Industries"
            title="We speak your market's language"
            lede="Video strategy tuned to how customers in your industry actually decide."
          />
          <div className="flex flex-wrap gap-3">
            {INDUSTRIES.map((ind, i) => (
              <Reveal key={ind.slug} delay={(i % 8) * 0.05}>
                <Link
                  href={`/industries/${ind.slug}`}
                  className="inline-block border border-rule rounded-full px-6 py-2.5 text-[0.9rem] text-muted hover:text-accent hover:border-accent transition-colors"
                >
                  {ind.name}
                </Link>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {/* Testimonials */}
      <section className="py-28 border-t border-rule">
        <Container>
          <SectionHead eyebrow="Client Voices" title="What working with us feels like" />
          <TestimonialCards />
        </Container>
      </section>

      {/* Packages teaser */}
      <section className="py-28 border-t border-rule">
        <Container>
          <SectionHead
            eyebrow="Pricing"
            title="Transparent packages, real-time estimates"
            lede="Start from a package or build your exact scope in the calculator — our rate card is public."
          />
          <div className="grid md:grid-cols-3 gap-6">
            {PACKAGES.map((p, i) => (
              <Reveal key={p.name} delay={i * 0.1}>
                <div className={`h-full rounded-lg p-7 border ${i === 1 ? "border-accent bg-accent-soft" : "border-rule bg-surface"}`}>
                  <h3 className="font-display text-[1.35rem] font-semibold">{p.name}</h3>
                  <p className="font-display text-accent text-[1.6rem] mt-1">{p.price}</p>
                  <p className="text-muted text-[0.92rem] mt-2">{p.tagline}</p>
                  <ul className="mt-5 space-y-2">
                    {p.includes.map((line) => (
                      <li key={line} className="flex gap-2.5 text-[0.9rem] text-ink/85">
                        <span className="text-accent shrink-0">—</span>
                        {line}
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal className="mt-10 text-center">
            <ButtonGold href="/pricing">Build Your Estimate</ButtonGold>
          </Reveal>
        </Container>
      </section>

      {/* FAQ preview */}
      <section className="py-28 border-t border-rule">
        <Container>
          <SectionHead eyebrow="Questions" title="Answers before you ask" />
          <div className="grid md:grid-cols-2 gap-x-12 gap-y-8 max-w-236">
            {FAQS.slice(0, 4).map((f, i) => (
              <Reveal key={f.q} delay={(i % 2) * 0.1}>
                <h3 className="font-display text-[1.1rem] font-semibold">{f.q}</h3>
                <p className="text-muted text-[0.92rem] mt-2 line-clamp-3">{f.a}</p>
              </Reveal>
            ))}
          </div>
          <Reveal className="mt-10">
            <Link href="/faq" className="text-accent text-[0.9rem] font-semibold hover:underline underline-offset-4">
              Browse all FAQs →
            </Link>
          </Reveal>
        </Container>
      </section>

      {/* Contact — the single opt-in */}
      <section
        id="contact"
        className="py-28 border-t border-rule bg-[radial-gradient(70%_60%_at_80%_0%,var(--color-accent-soft),transparent_55%)]"
      >
        <Container>
          <div className="grid lg:grid-cols-[1fr_1.15fr] gap-14 lg:gap-20 items-start">
            <Reveal>
              <Eyebrow>Start a Project</Eyebrow>
              <SectionTitle>Let&apos;s make something worth watching</SectionTitle>
              <p className="text-muted mt-5 max-w-104">
                Tell us what you&apos;re building and we&apos;ll come back with a plan — scope,
                timeline, and a point of view. No pressure, no boilerplate.
              </p>
              <ul className="mt-9 space-y-4">
                {[
                  "A personal reply within one business day",
                  "A short discovery call to understand your goals",
                  "A written proposal with scope, timeline, and pricing",
                  "A deposit books your dates — balance on delivery",
                ].map((step, i) => (
                  <li key={step} className="flex gap-3.5 items-baseline text-[0.95rem] text-muted">
                    <span className="font-display italic text-accent shrink-0">{i + 1}.</span>
                    {step}
                  </li>
                ))}
              </ul>
            </Reveal>
            <Reveal delay={0.12}>
              <ContactForm />
            </Reveal>
          </div>
        </Container>
      </section>
    </>
  );
}
