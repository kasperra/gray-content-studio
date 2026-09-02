import Image from "next/image";
import { Container } from "@/components/sections";
import { Reveal } from "@/components/Reveal";
import { CampaignInquiryForm } from "./CampaignInquiryForm";
import { themeById, themeVars, type Campaign, type CampaignImage } from "./campaign";

/* One layout, every season. Nothing below is written for fall specifically —
   all copy, imagery, pricing and form options come from the Campaign object,
   and the palette comes from its theme as CSS custom properties on the wrapper.

   Built mobile-first: the hero is a single column that becomes two at lg, the
   grids step 1 → 2 → 4, and a sticky request bar rides the bottom of the
   viewport on small screens, where the form is a long scroll away. */

const FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--c-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-bg";

function CtaButton({
  children,
  className = "",
  href = "#request",
}: {
  children: React.ReactNode;
  className?: string;
  href?: string;
}) {
  return (
    <a
      href={href}
      className={`inline-block rounded-full bg-[var(--c-accent)] text-bg border border-[var(--c-accent)] font-semibold uppercase text-[0.84rem] sm:text-[0.88rem] tracking-[0.08em] px-[1.7em] sm:px-[1.9em] py-[0.85em] text-center transition-all duration-200 hover:bg-transparent hover:text-[var(--c-accent)] hover:-translate-y-0.5 active:translate-y-0 ${FOCUS} ${className}`}
    >
      {children}
    </a>
  );
}

function SeasonEyebrow({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <p
      className={`font-body text-[0.72rem] sm:text-[0.78rem] font-semibold uppercase tracking-[0.28em] text-[var(--c-accent)] ${className}`}
    >
      {children}
    </p>
  );
}

/* A gallery tile. Slots without a `src` render as a composed seasonal panel
   rather than a gap — a campaign is publishable before its photographs exist,
   and the layout has to hold either way. See the note in campaigns.ts for how
   to fill one. */
function GallerySlot({
  image,
  priority = false,
  className = "",
  sizes,
}: {
  image: CampaignImage;
  priority?: boolean;
  className?: string;
  sizes: string;
}) {
  return (
    <figure className={`group relative overflow-hidden rounded-lg bg-surface ${className}`}>
      {image.src ? (
        <Image
          src={image.src}
          alt={image.alt}
          fill
          priority={priority}
          sizes={sizes}
          className="object-cover transition-transform duration-700 group-hover:scale-[1.05]"
        />
      ) : (
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(120% 90% at 25% 15%, var(--c-warm-soft), transparent 62%), linear-gradient(155deg, var(--c-deep), var(--color-surface) 78%)",
          }}
        >
          {/* A soft ring of the season's hue, so an unfilled slot still reads as
              a deliberate panel rather than a loading state. */}
          <div className="absolute inset-0 grid place-items-center">
            <span className="grid h-14 w-14 place-items-center rounded-full border border-[var(--c-accent)]/35 text-[var(--c-accent)]/70">
              <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
                <path
                  d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2.2l1-1.6A1 1 0 0 1 9.6 5h4.8a1 1 0 0 1 .9.4l1 1.6h2.2A1.5 1.5 0 0 1 20 8.5v8A1.5 1.5 0 0 1 18.5 18h-13A1.5 1.5 0 0 1 4 16.5v-8Z"
                  stroke="currentColor"
                  strokeWidth="1.3"
                />
                <circle cx="12" cy="12" r="3.1" stroke="currentColor" strokeWidth="1.3" />
              </svg>
            </span>
          </div>
        </div>
      )}
      {image.caption && (
        <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-bg/90 to-transparent p-4 sm:p-5">
          <span className="text-[0.82rem] font-medium text-ink/90">{image.caption}</span>
        </figcaption>
      )}
    </figure>
  );
}

export function CampaignPage({ campaign, minDate }: { campaign: Campaign; minDate: string }) {
  const theme = themeById(campaign.themeId);
  // A campaign may ship with no gallery at all; the hero then runs full width
  // rather than reserving a column for a tile that isn't there.
  const [lead, ...rest] = campaign.gallery;

  return (
    <div style={themeVars(theme)}>
      {/* ------------------------------------------------------------ hero -- */}
      <section className="relative overflow-hidden pt-[calc(76px+3.5rem)] pb-20 sm:pb-24 lg:pt-[calc(76px+6rem)] lg:pb-32">
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(75% 60% at 12% 0%, var(--c-glow), transparent 60%), radial-gradient(60% 50% at 100% 100%, var(--c-warm-soft), transparent 65%)",
          }}
        />
        <Container>
          <div
            className={`grid gap-12 lg:gap-16 items-center ${
              lead ? "lg:grid-cols-[1.05fr_0.95fr]" : "max-w-[52rem]"
            }`}
          >
            <Reveal>
              <SeasonEyebrow>{campaign.eyebrow}</SeasonEyebrow>

              <h1 className="font-display font-semibold leading-[1.02] tracking-[-0.02em] text-[clamp(2.6rem,8vw,4.6rem)] mt-4">
                {campaign.title}
              </h1>

              <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mt-5">
                <span className="font-display font-semibold text-[clamp(2.2rem,6vw,3.2rem)] text-[var(--c-accent)] leading-none">
                  {campaign.price}
                </span>
                <span className="text-muted text-[0.95rem]">per session</span>
              </p>

              <p className="text-muted text-[1.02rem] sm:text-[1.08rem] leading-relaxed max-w-136 mt-6">
                {campaign.lede}
              </p>

              <div className="flex flex-col sm:flex-row gap-3.5 mt-9">
                <CtaButton className="w-full sm:w-auto">{campaign.ctaLabel}</CtaButton>
                <a
                  href="#included"
                  className={`inline-block rounded-full border border-rule text-ink text-center font-semibold uppercase text-[0.84rem] sm:text-[0.88rem] tracking-[0.08em] px-[1.7em] sm:px-[1.9em] py-[0.85em] transition-colors hover:border-[var(--c-accent)] hover:text-[var(--c-accent)] ${FOCUS}`}
                >
                  What&apos;s included
                </a>
              </div>

              {/* The three facts that decide whether someone reads on. */}
              <dl className="grid grid-cols-3 gap-4 sm:gap-6 mt-11 border-t border-rule pt-7 max-w-136">
                {[
                  { k: "Session", v: "30 min" },
                  { k: "Photos", v: "10 edited" },
                  { k: "Setting", v: "Outdoors" },
                ].map((f) => (
                  <div key={f.k}>
                    <dt className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-muted">
                      {f.k}
                    </dt>
                    <dd className="font-display text-[1.05rem] sm:text-[1.25rem] font-semibold mt-1">
                      {f.v}
                    </dd>
                  </div>
                ))}
              </dl>
            </Reveal>

            {lead && (
              <Reveal delay={0.12}>
                <GallerySlot
                  image={lead}
                  priority
                  sizes="(max-width: 1024px) 92vw, 44vw"
                  className="aspect-4/5 w-full shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)]"
                />
              </Reveal>
            )}
          </div>
        </Container>
      </section>

      {/* --------------------------------------------------------- gallery -- */}
      {rest.length > 0 && (
        <section className="py-20 sm:py-24 border-t border-rule">
          <Container>
            <Reveal className="mb-10 sm:mb-14">
              <SeasonEyebrow>{campaign.galleryTitle}</SeasonEyebrow>
              <h2 className="font-display font-semibold leading-[1.08] tracking-[-0.015em] text-[clamp(1.9rem,4.5vw,3rem)] mt-2">
                {campaign.galleryLede}
              </h2>
            </Reveal>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {rest.map((img, i) => (
                <Reveal key={`${img.caption ?? img.alt}-${i}`} delay={0.05 * i}>
                  <GallerySlot
                    image={img}
                    sizes="(max-width: 640px) 46vw, (max-width: 1024px) 46vw, 23vw"
                    className="aspect-4/5 w-full"
                  />
                </Reveal>
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* -------------------------------------------------------- included -- */}
      <section id="included" className="py-20 sm:py-28 border-t border-rule scroll-mt-20">
        <Container>
          <div className="grid lg:grid-cols-[0.8fr_1.2fr] gap-10 lg:gap-16">
            <Reveal>
              <SeasonEyebrow>What&apos;s included</SeasonEyebrow>
              <h2 className="font-display font-semibold leading-[1.08] tracking-[-0.015em] text-[clamp(1.9rem,4.5vw,3rem)] mt-2">
                Everything in the {campaign.price} session.
              </h2>
            </Reveal>

            <Reveal delay={0.1}>
              <ul className="grid sm:grid-cols-2 gap-x-8 gap-y-0">
                {campaign.includes.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-3.5 border-b border-rule py-4 text-[0.98rem] leading-relaxed"
                  >
                    <span
                      aria-hidden="true"
                      className="mt-[0.42em] h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--c-accent)]"
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </Container>
      </section>

      {/* -------------------------------------------------------- audience -- */}
      {campaign.audience.length > 0 && (
        <section className="py-20 sm:py-28 border-t border-rule">
          <Container>
            <Reveal className="mb-10 sm:mb-14">
              <SeasonEyebrow>Who these are for</SeasonEyebrow>
              <h2 className="font-display font-semibold leading-[1.08] tracking-[-0.015em] text-[clamp(1.9rem,4.5vw,3rem)] mt-2">
                Bring whoever you&apos;d put on the wall.
              </h2>
            </Reveal>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5">
              {campaign.audience.map((a, i) => (
                <Reveal key={a.title} delay={0.06 * i}>
                  <div className="h-full rounded-lg border border-rule bg-surface p-6 sm:p-7 transition-colors hover:border-[var(--c-accent)]/45">
                    <h3 className="font-display text-[1.2rem] font-semibold">{a.title}</h3>
                    <p className="text-muted text-[0.93rem] leading-relaxed mt-3">{a.detail}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* ----------------------------------------------------------- steps -- */}
      {campaign.steps.length > 0 && (
        <section
          className="py-20 sm:py-28 border-t border-rule"
          style={{
            background:
              "radial-gradient(70% 55% at 50% 0%, var(--c-warm-soft), transparent 62%)",
          }}
        >
          <Container>
            <Reveal className="mb-10 sm:mb-14">
              <SeasonEyebrow>How booking works</SeasonEyebrow>
              <h2 className="font-display font-semibold leading-[1.08] tracking-[-0.015em] text-[clamp(1.9rem,4.5vw,3rem)] mt-2">
                Four steps, and only one of them is yours.
              </h2>
            </Reveal>

            <ol className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-6 lg:gap-8">
              {campaign.steps.map((s, i) => (
                <Reveal as="li" key={s.title} delay={0.06 * i}>
                  <div className="border-t-2 border-[var(--c-accent)]/30 pt-5">
                    <span className="font-display text-[0.9rem] font-semibold text-[var(--c-accent)] tracking-[0.1em]">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <h3 className="font-display text-[1.18rem] font-semibold mt-2.5">{s.title}</h3>
                    <p className="text-muted text-[0.93rem] leading-relaxed mt-2.5">{s.detail}</p>
                  </div>
                </Reveal>
              ))}
            </ol>
          </Container>
        </section>
      )}

      {/* ----------------------------------------------------------- form -- */}
      <section id="request" className="py-20 sm:py-28 border-t border-rule scroll-mt-20">
        <Container className="max-w-[820px]">
          <Reveal className="text-center mb-10 sm:mb-12">
            <SeasonEyebrow>{campaign.formTitle}</SeasonEyebrow>
            <h2 className="font-display font-semibold leading-[1.08] tracking-[-0.015em] text-[clamp(1.9rem,4.5vw,2.8rem)] mt-2">
              {campaign.title} — {campaign.price}
            </h2>
            <p className="text-muted text-[1rem] leading-relaxed mt-4 max-w-136 mx-auto">
              {campaign.formLede}
            </p>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="rounded-lg border border-rule bg-surface/60 p-5 sm:p-8 lg:p-10">
              <CampaignInquiryForm campaign={campaign} minDate={minDate} />
            </div>
          </Reveal>
        </Container>
      </section>

      {/* -------------------------------------------------------- closing -- */}
      <section
        className="border-t border-rule py-20 sm:py-28 text-center"
        style={{
          background: "radial-gradient(60% 80% at 50% 100%, var(--c-glow), transparent 62%)",
        }}
      >
        <Container>
          <Reveal>
            <SeasonEyebrow>{campaign.eyebrow}</SeasonEyebrow>
            <h2 className="font-display font-semibold leading-[1.06] tracking-[-0.015em] text-[clamp(2rem,5.5vw,3.4rem)] mt-3">
              {campaign.closingTitle}
            </h2>
            <p className="text-muted text-[1.02rem] leading-relaxed mt-5 max-w-120 mx-auto">
              {campaign.closingLede}
            </p>
            <CtaButton className="mt-9 w-full sm:w-auto">{campaign.ctaLabel}</CtaButton>
          </Reveal>
        </Container>
      </section>

      {/* Sticky request bar — phones only, where the form is a long scroll from
          the hero. `pb-[env(safe-area-inset-bottom)]` keeps it clear of the iOS
          home indicator. Hidden once the form itself is on screen. */}
      <div className="sm:hidden sticky bottom-0 z-30 border-t border-rule bg-bg/92 backdrop-blur-lg px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
        <div className="flex items-center justify-between gap-3">
          <p className="leading-tight">
            <span className="block font-display text-[1.05rem] font-semibold">
              {campaign.price}
            </span>
            <span className="block text-[0.72rem] text-muted">{campaign.title}</span>
          </p>
          <CtaButton className="shrink-0 text-[0.76rem] px-[1.3em] py-[0.8em]">Book now</CtaButton>
        </div>
      </div>
    </div>
  );
}
