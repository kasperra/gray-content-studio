import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { EVENT_PACKAGES, EVENT_UPGRADES } from "@/content/site";
import { Container } from "@/components/sections";
import { Eyebrow, ButtonGold, SectionTitle } from "@/components/Buttons";
import { Reveal } from "@/components/Reveal";

export const metadata: Metadata = {
  title: "Event Photography & Video Coverage",
  description:
    "Professional event photography and video coverage from $450 — galas, conferences, fundraisers, awards programs, grand openings, and corporate events. Edited gallery, vertical recap video, and social-ready clips.",
  alternates: { canonical: "/event-coverage" },
};

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.graycontentstudio.co";

/* One Service entity per package, so each package's price and inclusions are
   eligible to surface on their own rather than as one undifferentiated blob. */
const EVENT_JSONLD = {
  "@context": "https://schema.org",
  "@graph": EVENT_PACKAGES.map((p) => ({
    "@type": "Service",
    name: `${p.name} — Event Coverage`,
    serviceType: "Event photography and video coverage",
    description: `${p.tagline} ${p.includes.join(". ")}.`,
    provider: { "@type": "Organization", name: "Gray Content Studio", url: SITE },
    areaServed: "United States",
    offers: {
      "@type": "Offer",
      priceCurrency: "USD",
      price: p.price.replace(/[^0-9]/g, ""),
      priceSpecification: {
        "@type": "PriceSpecification",
        priceCurrency: "USD",
        minPrice: p.price.replace(/[^0-9]/g, ""),
        valueAddedTaxIncluded: false,
      },
      url: `${SITE}/event-coverage`,
    },
  })),
};

/* Frames from the Walk Like Her x Secure dinner. Captions describe what each
   one demonstrates, because the grid is doing a job — proving the four things
   the packages promise — not decorating the page. */
const GALLERY = [
  { src: "/img/events/bar.jpg", alt: "A bartender shaking a cocktail behind a candlelit bar at an evening event" },
  { src: "/img/events/guests.jpg", alt: "Two guests laughing together on a green velvet banquette" },
  { src: "/img/events/plating.jpg", alt: "Two plated courses photographed on a dark table under warm light" },
  { src: "/img/events/room.jpg", alt: "Guests in conversation along a long dinner table set with candles and glassware" },
  { src: "/img/events/service.jpg", alt: "A server pouring wine beside a table centerpiece of red and orange florals" },
  { src: "/img/events/signage.jpg", alt: "Guests posing beside event signage reading An Intimate Dinner in Honor of Women's History Month" },
];

const EVENT_TYPES = [
  "Corporate events",
  "Galas",
  "Fundraisers",
  "Conferences",
  "Networking events",
  "Awards programs",
  "Grand openings",
  "Brand activations",
  "Community events",
];

const ALWAYS_INCLUDED = [
  {
    title: "Guest candids and key moments",
    detail: "The room as it actually felt — arrivals, conversations, reactions, the moment the award is handed over.",
  },
  {
    title: "Detail, décor, signage and branding",
    detail: "The work your team spent months on, photographed properly: table settings, staging, environmental graphics, step-and-repeats.",
  },
  {
    title: "Speaker and award coverage",
    detail: "Podium, panel, and presentation moments captured where applicable, so the program itself is documented and not just the reception.",
  },
  {
    title: "Sponsor and partner visibility",
    detail: "Deliberate coverage of the logos and activations your sponsors paid for — the images that make renewal conversations easy.",
  },
];

export default function EventCoveragePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(EVENT_JSONLD) }}
      />

      <section className="pt-48 pb-16">
        <Container>
          <Eyebrow>Event Coverage</Eyebrow>
          <h1 className="font-display font-semibold leading-[1.08] tracking-[-0.015em] text-[clamp(2.4rem,6.5vw,5rem)] mt-4 max-w-[17ch]">
            Your event, documented like it mattered
          </h1>
          <p className="text-muted text-[1.06rem] max-w-136 mt-6">
            Professional photography and video coverage that captures the people, the energy, the
            details, and the story of your event — delivered as an edited gallery and, on the video
            packages, social-ready clips you can post while it&apos;s still news.
          </p>
          <div className="flex flex-wrap items-center gap-6 mt-9">
            <ButtonGold href="/#contact">Check Your Date</ButtonGold>
            <Link
              href="/pricing#event-coverage"
              className="text-muted text-[0.9rem] hover:text-ink transition-colors"
            >
              or build a custom estimate →
            </Link>
          </div>
        </Container>
      </section>

      {/* Proof before pricing — a page selling visual work has to show some. */}
      <section className="py-16 border-t border-rule">
        <Container>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {GALLERY.map((img, i) => (
              <Reveal key={img.src} delay={(i % 3) * 0.08}>
                <div className="relative aspect-16/9 overflow-hidden rounded-md bg-surface">
                  <Image
                    src={img.src}
                    alt={img.alt}
                    fill
                    sizes="(max-width: 640px) 92vw, (max-width: 1024px) 46vw, 30vw"
                    className="object-cover transition-transform duration-700 hover:scale-[1.04]"
                  />
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal>
            <p className="text-muted text-[0.85rem] mt-5">
              Walk Like Her × Secure — an intimate dinner in honor of Women&apos;s History Month.
              Guest candids, details, service, and sponsor signage from a single evening.
            </p>
          </Reveal>
        </Container>
      </section>

      <section className="py-20 border-t border-rule">
        <Container>
          <Reveal className="mb-10">
            <SectionTitle className="text-[clamp(1.8rem,4vw,2.8rem)]">Three ways to cover it</SectionTitle>
            <p className="text-muted text-[1rem] max-w-136 mt-4">
              Sized to the event, not stacked — pick the one that matches how long it runs and how
              much of a content library you need afterward.
            </p>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-6">
            {EVENT_PACKAGES.map((p, i) => (
              <Reveal key={p.name} delay={i * 0.1}>
                <div
                  className={`h-full rounded-lg p-7 border flex flex-col ${
                    i === 1 ? "border-accent bg-accent-soft" : "border-rule bg-surface"
                  }`}
                >
                  {i === 1 && (
                    <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-accent mb-2">
                      Most booked
                    </p>
                  )}
                  <h3 className="font-display text-[1.35rem] font-semibold">{p.name}</h3>
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

          <p className="text-muted text-[0.85rem] mt-8 max-w-[70ch]">
            All event pricing is starting pricing. Final quotes vary with event length, location,
            production requirements, deliverables, staffing, turnaround, and travel.
          </p>
        </Container>
      </section>

      <section className="py-20 border-t border-rule">
        <Container>
          <Reveal className="mb-10">
            <Eyebrow>In every package</Eyebrow>
            <SectionTitle className="text-[clamp(1.6rem,3.5vw,2.4rem)]">
              What gets covered regardless of tier
            </SectionTitle>
          </Reveal>
          <div className="grid sm:grid-cols-2 gap-x-12 gap-y-8">
            {ALWAYS_INCLUDED.map((item, i) => (
              <Reveal key={item.title} delay={i * 0.08}>
                <h3 className="font-display text-[1.1rem] font-semibold">{item.title}</h3>
                <p className="text-muted text-[0.95rem] mt-2 leading-relaxed">{item.detail}</p>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      <section className="py-20 border-t border-rule">
        <Container>
          <Reveal className="mb-8">
            <Eyebrow>Add-ons</Eyebrow>
            <SectionTitle className="text-[clamp(1.6rem,3.5vw,2.4rem)]">
              À la carte upgrades
            </SectionTitle>
          </Reveal>
          <ul className="grid sm:grid-cols-2 gap-x-12 max-w-4xl">
            {EVENT_UPGRADES.map((u) => (
              <li
                key={u.name}
                className="flex items-baseline justify-between gap-4 border-b border-rule py-3 text-[0.95rem]"
              >
                <span className="text-ink/85">{u.name}</span>
                <span className="text-muted text-[0.9rem] whitespace-nowrap">{u.price}</span>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <section className="py-20 border-t border-rule">
        <Container>
          <Reveal>
            <SectionTitle className="text-[clamp(1.6rem,3.5vw,2.4rem)]">Events we cover</SectionTitle>
          </Reveal>
          <div className="flex flex-wrap gap-3 mt-8">
            {EVENT_TYPES.map((t, i) => (
              <Reveal key={t} delay={i * 0.05}>
                <span className="inline-block border border-rule rounded-full px-6 py-2.5 text-[0.9rem] text-ink/85">
                  {t}
                </span>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      <section className="text-center py-24 border-t border-rule bg-[radial-gradient(60%_80%_at_50%_100%,var(--color-accent-soft),transparent_60%)]">
        <Container>
          <h2 className="font-display font-semibold text-[clamp(2rem,4.5vw,3.2rem)]">
            Tell us the date
          </h2>
          <p className="text-muted text-[1rem] max-w-120 mx-auto mt-5">
            Send us your event details and we&apos;ll confirm availability and a firm quote within
            one business day.
          </p>
          <ButtonGold href="/#contact" className="mt-9">Check Your Date</ButtonGold>
          <p className="mt-6">
            <Link
              href="/pricing#event-coverage"
              className="text-muted text-[0.9rem] hover:text-ink transition-colors"
            >
              or build your own estimate →
            </Link>
          </p>
        </Container>
      </section>
    </>
  );
}
