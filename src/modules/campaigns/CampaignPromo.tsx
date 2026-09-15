import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/sections";
import { Reveal } from "@/components/Reveal";
import { themeById, themeVars, type Campaign } from "./campaign";

/* The campaign hero, restated as a band inside another page.

   Same shape as the top of CampaignPage — eyebrow, title, price, lede, the
   fact row, the hero frame — with three deliberate differences, because this
   is a promo on someone else's page rather than the page's own opening:

   - an <h2>, since the host page already owns its <h1>;
   - the buttons navigate to the campaign instead of jumping to #request and
     #included, which don't exist here;
   - it renders nothing at all when no campaign is running, so a host page
     doesn't need to know whether there's a season on.

   Driven by the Campaign object like everything else, so the next season
   appears here with no edit to the pages that embed it. */

const FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--c-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-bg";

export function CampaignPromo({ campaign }: { campaign: Campaign | null }) {
  if (!campaign || !campaign.published) return null;

  const theme = themeById(campaign.themeId);
  const lead = campaign.gallery[0];
  const href = `/${campaign.slug}`;

  return (
    <section
      aria-labelledby={`promo-${campaign.slug}`}
      className="relative overflow-hidden border-t border-rule py-20 sm:py-24"
      style={themeVars(theme)}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(70% 70% at 15% 0%, var(--c-glow), transparent 60%), radial-gradient(55% 60% at 100% 100%, var(--c-warm-soft), transparent 65%)",
        }}
      />
      <Container>
        <div
          className={`grid gap-10 lg:gap-14 items-center ${
            lead?.src ? "lg:grid-cols-[1.05fr_0.95fr]" : ""
          }`}
        >
          <Reveal>
            <p className="font-body text-[0.72rem] sm:text-[0.78rem] font-semibold uppercase tracking-[0.28em] text-[var(--c-accent)]">
              {campaign.eyebrow}
            </p>

            <h2
              id={`promo-${campaign.slug}`}
              className="font-display font-semibold leading-[1.04] tracking-[-0.02em] text-[clamp(2.2rem,6vw,3.6rem)] mt-3"
            >
              {campaign.title}
            </h2>

            <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mt-4">
              <span className="font-display font-semibold text-[clamp(1.9rem,5vw,2.6rem)] text-[var(--c-accent)] leading-none">
                {campaign.price}
              </span>
              <span className="text-muted text-[0.95rem]">per session</span>
            </p>

            <p className="text-muted text-[1rem] sm:text-[1.04rem] leading-relaxed max-w-136 mt-5">
              {campaign.lede}
            </p>

            <div className="flex flex-col sm:flex-row gap-3.5 mt-8">
              <Link
                href={href}
                className={`inline-block rounded-full bg-[var(--c-accent)] text-bg border border-[var(--c-accent)] font-semibold uppercase text-[0.84rem] sm:text-[0.88rem] tracking-[0.08em] px-[1.7em] sm:px-[1.9em] py-[0.85em] text-center transition-all duration-200 hover:bg-transparent hover:text-[var(--c-accent)] hover:-translate-y-0.5 active:translate-y-0 ${FOCUS}`}
              >
                {campaign.ctaLabel}
              </Link>
              <Link
                href={href}
                className={`inline-block rounded-full border border-rule text-ink text-center font-semibold uppercase text-[0.84rem] sm:text-[0.88rem] tracking-[0.08em] px-[1.7em] sm:px-[1.9em] py-[0.85em] transition-colors hover:border-[var(--c-accent)] hover:text-[var(--c-accent)] ${FOCUS}`}
              >
                What&apos;s included
              </Link>
            </div>

            {campaign.highlights.length > 0 && (
              <dl
                className="grid gap-4 sm:gap-6 mt-10 border-t border-rule pt-6 max-w-136"
                style={{
                  gridTemplateColumns: `repeat(${campaign.highlights.length}, minmax(0, 1fr))`,
                }}
              >
                {campaign.highlights.map((f) => (
                  <div key={f.label}>
                    <dt className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-muted">
                      {f.label}
                    </dt>
                    <dd className="font-display text-[1.05rem] sm:text-[1.25rem] font-semibold mt-1">
                      {f.value}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
          </Reveal>

          {lead?.src && (
            <Reveal delay={0.12}>
              {/* The whole frame is a link: on a phone the image sits under the
                  buttons and is the largest thing on screen, so it should be
                  tappable rather than decorative. */}
              <Link
                href={href}
                tabIndex={-1}
                aria-hidden="true"
                className="group relative block aspect-4/5 sm:aspect-3/2 lg:aspect-4/5 w-full overflow-hidden rounded-lg bg-surface shadow-[0_30px_80px_-24px_rgba(0,0,0,0.7)]"
              >
                <Image
                  src={lead.src}
                  alt={lead.alt}
                  fill
                  sizes="(max-width: 1024px) 92vw, 44vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                />
              </Link>
            </Reveal>
          )}
        </div>
      </Container>
    </section>
  );
}
