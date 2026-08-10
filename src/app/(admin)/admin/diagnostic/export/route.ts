import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseServer } from "@/lib/supabase/server";

/** CSV of every completed diagnostic, one row per lead, shaped for import into
    a CRM or mail tool. Admin-gated; the query still runs under the caller's RLS. */
export async function GET() {
  await requireAdmin();

  const supabase = await createSupabaseServer();
  const { data, error } = await supabase
    .from("diagnostic_results")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Diagnostic tables not found." }, { status: 400 });
  }

  const columns = [
    "created_at",
    "name",
    "email",
    "business_name",
    "website",
    "business_type",
    "stage",
    "stage_name",
    "primary_bottleneck",
    "secondary_bottlenecks",
    "overall_score",
    "visibility_score",
    "strategy_score",
    "production_score",
    "distribution_score",
    "conversion_score",
    "measurement_score",
    "purchase_intent",
    "urgency",
    "recommended_next_step",
    "result_url",
  ];

  const esc = (v: unknown) => {
    const s =
      v === null || v === undefined
        ? ""
        : Array.isArray(v)
          ? v.join(" | ")
          : typeof v === "object"
            ? JSON.stringify(v)
            : String(v);
    // Prefix formula-leading characters so a spreadsheet can't execute a cell.
    const safe = /^[=+\-@]/.test(s) ? `'${s}` : s;
    return `"${safe.replace(/"/g, '""')}"`;
  };

  const lines = [columns.join(",")];
  for (const r of data ?? []) {
    const scores = (r.scores ?? {}) as Record<string, number>;
    lines.push(
      [
        r.created_at,
        r.name,
        r.email,
        r.business_name,
        r.website,
        r.business_type,
        r.stage,
        r.stage_name,
        r.primary_bottleneck,
        r.secondary_bottlenecks,
        r.overall_score,
        scores.visibility,
        scores.strategy,
        scores.production,
        scores.distribution,
        scores.conversion,
        scores.measurement,
        r.purchase_intent,
        r.urgency,
        r.recommended_next_step,
        `https://diagnostic.graycontentstudio.co/results/${r.public_id}`,
      ]
        .map(esc)
        .join(",")
    );
  }

  const stamp = new Date().toISOString().slice(0, 10);
  return new NextResponse(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="diagnostic-leads-${stamp}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
