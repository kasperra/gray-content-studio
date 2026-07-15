import Image from "next/image";
import Link from "next/link";
import { Reveal } from "./Reveal";
import { Eyebrow, SectionTitle } from "./Buttons";
import { CLIENTS, FOUNDER } from "@/content/site";
import type { CaseStudy } from "@/content/case-studies";

export function Container({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`w-[min(1200px,92vw)] mx-auto ${className}`}>{children}</div>;
}

/** Auto-scrolling trusted-by marquee (pauses on hover). */
export function TrustedBy() {
  const marks = [...CLIENTS, ...CLIENTS]; // duplicated for seamless loop
  return (
    <section aria-label="Clients we have worked with" className="py-[4.4rem] border-y border-rule">
      <Eyebrow className="text-center mb-10">Trusted By</Eyebrow>
      <div className="overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)] group">
        <div className="flex items-center gap-[4.5rem] w-max animate-marquee group-hover:[animation-play-state:paused]">
          {marks.map((c, i) => (
            <span
              key={i}
              aria-hidden={i >= CLIENTS.length}
              className="font-display text-[1.12rem] uppercase tracking-[0.18em] whitespace-nowrap text-muted opacity-60 hover:opacity-100 hover:text-ink transition-all"
            >
              {c}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

export function WorkCard({ cs, delay = 0 }: { cs: CaseStudy; delay?: number }) {
  return (
    <Reveal delay={delay}>
      <Link
        href={`/work/${cs.slug}`}
        className="group relative block aspect-4/5 overflow-hidden rounded-md bg-surface"
      >
        {cs.image ? (
          <div className="absolute inset-0 animate-cardpan">
            <Image
              src={cs.image}
              alt={`${cs.client} — ${cs.title}`}
              fill
              sizes="(max-width: 720px) 92vw, (max-width: 960px) 46vw, 30vw"
              className="object-cover grayscale contrast-105 scale-[1.01] transition-all duration-700 group-hover:grayscale-0 group-hover:scale-[1.07]"
            />
          </div>
        ) : cs.logo ? (
          <div className="absolute inset-0 flex items-center justify-center p-8 bg-[radial-gradient(120%_90%_at_20%_10%,var(--color-accent-soft),transparent_60%),linear-gradient(160deg,var(--color-surface-2),var(--color-bg))]">
            <span className="w-[74%] max-w-[230px] rounded-xl bg-white flex items-center justify-center px-6 py-8 shadow-[0_10px_40px_rgba(0,0,0,0.35)] transition-transform duration-700 group-hover:scale-[1.05]">
              <Image
                src={cs.logo}
                alt={`${cs.client} logo`}
                width={230}
                height={150}
                sizes="(max-width: 720px) 60vw, 20vw"
                className="object-contain w-full h-auto"
              />
            </span>
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center p-6 bg-[radial-gradient(120%_90%_at_20%_10%,var(--color-accent-soft),transparent_60%),linear-gradient(160deg,var(--color-surface-2),var(--color-bg))]">
            <span className="font-display text-[clamp(1.5rem,2.6vw,2.1rem)] uppercase tracking-[0.1em] text-center text-muted leading-tight transition-colors group-hover:text-accent">
              {cs.client}
            </span>
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-bg/92 to-transparent">
          <span className="block text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-accent">
            {cs.categoryLabel}
          </span>
          <span className="block font-display text-[1.3rem] font-semibold">{cs.client}</span>
          <span className="block text-muted text-[0.86rem] max-h-0 opacity-0 overflow-hidden transition-all duration-500 group-hover:max-h-20 group-hover:opacity-100">
            {cs.summary}
          </span>
        </div>
      </Link>
    </Reveal>
  );
}

export function MeetFounder() {
  return (
    <div className="grid lg:grid-cols-[0.85fr_1fr] gap-10 lg:gap-16 items-center">
      <Reveal>
        <div className="relative aspect-4/5 overflow-hidden rounded-lg bg-surface">
          <Image
            src={FOUNDER.image}
            alt={FOUNDER.alt}
            fill
            sizes="(max-width: 1024px) 92vw, 40vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-bg/45 to-transparent" />
        </div>
      </Reveal>

      <Reveal delay={0.12}>
        <p className="font-display text-[1.6rem] font-semibold">{FOUNDER.name}</p>
        <p className="text-accent text-[0.78rem] font-semibold uppercase tracking-[0.24em] mt-1.5">
          {FOUNDER.role}
        </p>
        <div className="mt-6 space-y-4">
          {FOUNDER.bio.map((para) => (
            <p key={para} className="text-muted text-[1rem] leading-relaxed">
              {para}
            </p>
          ))}
        </div>
      </Reveal>
    </div>
  );
}

export function SectionHead({
  eyebrow,
  title,
  lede,
}: {
  eyebrow: string;
  title: string;
  lede?: string;
}) {
  return (
    <Reveal className="mb-14">
      <Eyebrow>{eyebrow}</Eyebrow>
      <SectionTitle>{title}</SectionTitle>
      {lede && <p className="text-muted text-[1.06rem] max-w-136 mt-4">{lede}</p>}
    </Reveal>
  );
}
