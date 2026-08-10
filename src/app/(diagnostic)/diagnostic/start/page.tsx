import type { Metadata } from "next";
import { getConfig } from "@/modules/diagnostic/actions";
import { STAGES, DEFAULT_BOOKING_URL } from "@/modules/diagnostic/content";
import { DiagnosticFrame, Wordmark } from "../../DiagnosticFrame";
import { DiagnosticFlow } from "./DiagnosticFlow";

export const metadata: Metadata = {
  title: "Content Growth Diagnostic",
  description: "Identify the bottleneck limiting your content's business results.",
  // The questions themselves add nothing to search and shouldn't be indexed.
  robots: { index: false, follow: true },
};

export default async function StartPage() {
  const config = await getConfig();

  const ctaByStage = Object.fromEntries(
    STAGES.map((s) => [s.id, config[`cta_stage_${s.id}`] ?? s.cta])
  ) as Record<number, string>;

  return (
    <DiagnosticFrame>
      <header className="w-[min(1080px,92vw)] mx-auto pt-8 pb-2">
        <Wordmark />
      </header>
      <main>
        <DiagnosticFlow
          ctaByStage={ctaByStage}
          bookingUrl={config.booking_url ?? DEFAULT_BOOKING_URL}
          footerCopy={
            config.result_footer ??
            "Your diagnostic was created by Gray Content Studio to help businesses understand where their content is working, where it's breaking down, and what to do next."
          }
        />
      </main>
    </DiagnosticFrame>
  );
}
