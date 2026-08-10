import type { Metadata } from "next";
import Link from "next/link";
import { DiagnosticFrame, Wordmark } from "../DiagnosticFrame";
import { track } from "@/modules/diagnostic/actions";

const TITLE = "Content Growth Diagnostic — Find Your Content Bottleneck";
const DESCRIPTION =
  "A free 2-minute content marketing assessment. Identify the bottleneck limiting your content's business results, see your content growth stage, and get a personalized roadmap.";
const URL = "https://diagnostic.graycontentstudio.co";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: URL },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: URL,
    siteName: "Gray Content Studio",
    type: "website",
  },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

const JSONLD = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Content Growth Diagnostic",
  applicationCategory: "BusinessApplication",
  url: URL,
  description: DESCRIPTION,
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  provider: {
    "@type": "Organization",
    name: "Gray Content Studio",
    url: "https://www.graycontentstudio.co",
  },
};

const DELIVERABLES = [
  { title: "Your Growth Stage", detail: "Where your content operation currently stands." },
  { title: "Your Biggest Bottleneck", detail: "The single issue most likely limiting your growth." },
  { title: "Your Secondary Bottlenecks", detail: "Additional weaknesses affecting performance." },
  { title: "Your Next Stage", detail: "What you need to accomplish to move forward." },
  { title: "Your Personalized Roadmap", detail: "The specific areas you should focus on next." },
];

const STAGE_NAMES = ["Invisible", "Active", "Strategic", "Growth", "Content Engine"];

export default async function DiagnosticLanding() {
  // Funnel entry point. Best-effort and never blocks the render.
  void track("view");

  return (
    <DiagnosticFrame>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSONLD) }} />

      <header className="w-[min(1080px,92vw)] mx-auto pt-8 pb-4">
        <Wordmark />
      </header>

      <main>
        <section className="w-[min(1080px,92vw)] mx-auto pt-16 pb-20 sm:pt-24 sm:pb-28">
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.3em] text-accent">
            Content Growth Diagnostic
          </p>
          <h1 className="font-display font-semibold leading-[1.05] tracking-[-0.02em] text-[clamp(2.4rem,7vw,4.6rem)] max-w-[16ch] mt-5">
            What&apos;s Really Holding Your Content Back?
          </h1>
          <p className="text-muted text-[clamp(1rem,1.6vw,1.2rem)] leading-relaxed max-w-[58ch] mt-7">
            Answer a few strategic questions about your business, content, audience, and marketing.
            We&apos;ll identify your biggest content-growth bottleneck and create a personalized
            roadmap showing you what to focus on next.
          </p>
          <div className="flex flex-wrap items-center gap-x-7 gap-y-4 mt-10">
            <Link
              href="/diagnostic/start"
              className="inline-block rounded-full bg-accent text-bg border border-accent font-semibold uppercase text-[0.88rem] tracking-[0.08em] px-[2.1em] py-[0.9em] transition-all duration-200 hover:bg-transparent hover:text-accent hover:-translate-y-0.5 active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
            >
              Diagnose My Content
            </Link>
            <p className="text-muted text-[0.9rem]">Free. Takes about 2–3 minutes.</p>
          </div>
        </section>

        {/* The five stages, so the framework is legible before starting. */}
        <section className="border-y border-rule bg-surface/40" aria-label="The five content growth stages">
          <div className="w-[min(1080px,92vw)] mx-auto py-12">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-muted mb-6">
              Every business lands in one of five stages
            </p>
            <ol className="grid grid-cols-2 md:grid-cols-5 gap-x-4 gap-y-6">
              {STAGE_NAMES.map((name, i) => (
                <li key={name} className="border-t border-rule pt-4">
                  <span className="font-display italic text-accent text-[0.9rem]">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="block font-display text-[1.05rem] font-semibold mt-1">{name}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="w-[min(1080px,92vw)] mx-auto py-20 sm:py-24">
          <h2 className="font-display font-semibold text-[clamp(1.7rem,3.6vw,2.5rem)] tracking-[-0.01em]">
            Your diagnostic will reveal
          </h2>
          <dl className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-9 mt-12">
            {DELIVERABLES.map((d, i) => (
              <div key={d.title} className="relative border-t border-rule pt-5 before:content-[''] before:absolute before:-top-px before:left-0 before:w-10 before:h-px before:bg-accent">
                <span className="font-display italic text-accent text-[0.9rem]">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <dt className="font-display text-[1.2rem] font-semibold mt-1.5">{d.title}</dt>
                <dd className="text-muted text-[0.95rem] mt-2 leading-relaxed">{d.detail}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-14">
            <Link
              href="/diagnostic/start"
              className="inline-block rounded-full bg-accent text-bg border border-accent font-semibold uppercase text-[0.88rem] tracking-[0.08em] px-[2.1em] py-[0.9em] transition-all duration-200 hover:bg-transparent hover:text-accent hover:-translate-y-0.5 active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
            >
              Start My Diagnostic
            </Link>
          </div>
        </section>

        <section className="border-t border-rule">
          <div className="w-[min(1080px,92vw)] mx-auto py-14">
            <p className="text-muted text-[0.95rem] leading-relaxed max-w-[62ch]">
              You don&apos;t necessarily need more content. You need to understand what&apos;s
              preventing your existing content from creating more business. This diagnostic was built
              by{" "}
              <a
                href="https://www.graycontentstudio.co"
                className="text-accent hover:underline underline-offset-4"
              >
                Gray Content Studio
              </a>{" "}
              to find that out.
            </p>
          </div>
        </section>
      </main>
    </DiagnosticFrame>
  );
}
