import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getResultByPublicId, getConfig } from "@/modules/diagnostic/actions";
import { diagnose, stageMeta } from "@/modules/diagnostic/scoring";
import { ResultReport } from "@/modules/diagnostic/ResultReport";
import { DEFAULT_BOOKING_URL } from "@/modules/diagnostic/content";
import type { Answers } from "@/modules/diagnostic/types";
import { DiagnosticFrame, Wordmark } from "../../../DiagnosticFrame";

export const metadata: Metadata = {
  title: "Your Content Growth Diagnosis",
  // A result is personal to the visitor who took it; keep it out of search.
  robots: { index: false, follow: false },
};

export default async function ResultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const row = await getResultByPublicId(id);
  if (!row) notFound();

  // Recomputed from the stored answers rather than reassembled from columns, so
  // a returning visitor sees exactly the diagnosis the engine produces today.
  const result = diagnose((row.answers ?? {}) as Answers);
  const config = await getConfig();
  const meta = stageMeta(result.stage);

  return (
    <DiagnosticFrame>
      <header className="w-[min(1080px,92vw)] mx-auto pt-8 pb-2">
        <Wordmark />
      </header>
      <main className="py-12 sm:py-16">
        <ResultReport
          result={result}
          full
          ctaLabel={config[`cta_stage_${result.stage}`] ?? meta.cta}
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
