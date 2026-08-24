import { LEGAL } from "@/content/legal";

/* Shared shell for the three legal pages. Long-form reading, so the measure is
   tight and the type scale is the body face rather than the display face. */
export function LegalPage({ title, intro, children }: { title: string; intro?: string; children: React.ReactNode }) {
  return (
    <article className="w-[min(720px,92vw)] mx-auto pt-36 pb-24">
      <h1 className="font-display font-semibold leading-[1.1] tracking-[-0.015em] text-[clamp(2rem,5vw,3rem)]">
        {title}
      </h1>
      <p className="text-muted text-[0.85rem] mt-4">Last updated {LEGAL.lastUpdated}</p>
      {intro && <p className="text-ink/90 text-[1.02rem] leading-relaxed mt-6">{intro}</p>}
      <div className="mt-10 space-y-8 [&_h2]:font-display [&_h2]:text-[1.2rem] [&_h2]:font-semibold [&_h2]:mb-2.5 [&_p]:text-muted [&_p]:leading-relaxed [&_p]:text-[0.95rem] [&_li]:text-muted [&_li]:leading-relaxed [&_li]:text-[0.95rem] [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_a]:text-accent [&_a]:underline [&_a]:underline-offset-2">
        {children}
      </div>
    </article>
  );
}
