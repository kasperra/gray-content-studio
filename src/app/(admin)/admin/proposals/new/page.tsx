import { createSupabaseServer } from "@/lib/supabase/server";
import { ProposalBuilder, type LoadedProposal } from "./ProposalBuilder";

export default async function NewProposalPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const editId = typeof params.edit === "string" ? params.edit : undefined;

  let loaded: LoadedProposal | undefined;
  if (editId) {
    const supabase = await createSupabaseServer();
    const { data } = await supabase.from("proposals").select("*").eq("id", editId).single();
    if (data) {
      loaded = {
        id: data.id,
        clientName: data.client_name ?? "",
        company: data.company ?? "",
        email: data.email ?? "",
        title: data.title ?? "",
        notes: data.notes ?? "",
        validUntil: data.valid_until ?? "",
        items: (data.items as { id: string; qty: number }[]) ?? [],
        rushId: data.rush_id,
        travelMiles: Number(data.travel_miles),
        discountType: data.discount_type,
        discountValue: Number(data.discount_value),
        depositPct: Number(data.deposit_pct),
      };
    }
  }

  const prefill = {
    clientName: typeof params.name === "string" ? params.name : "",
    company: typeof params.company === "string" ? params.company : "",
    email: typeof params.email === "string" ? params.email : "",
  };

  return <ProposalBuilder loaded={loaded} prefill={prefill} />;
}
