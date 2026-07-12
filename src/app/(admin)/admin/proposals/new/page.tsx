import { createSupabaseServer } from "@/lib/supabase/server";
import { ProposalBuilder, type LoadedProposal } from "./ProposalBuilder";

export default async function NewProposalPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const editId = typeof params.edit === "string" ? params.edit : undefined;
  const leadId = typeof params.lead === "string" ? params.lead : undefined;
  const supabase = await createSupabaseServer();

  // Prefill from a lead's calculator estimate (services, rush, travel + contact info)
  let fromLead:
    | {
        leadId: string;
        clientName: string;
        company: string;
        email: string;
        items: { id: string; qty: number }[];
        rushId: string;
        travelMiles: number;
      }
    | undefined;
  if (leadId && !editId) {
    const { data: lead } = await supabase
      .from("leads")
      .select("id, name, company, email, estimate")
      .eq("id", leadId)
      .single();
    if (lead) {
      const est = lead.estimate as {
        items?: { id: string; qty: number }[];
        rushId?: string;
        travelMiles?: number;
      } | null;
      fromLead = {
        leadId: lead.id,
        clientName: lead.name ?? "",
        company: lead.company ?? "",
        email: lead.email ?? "",
        items: est?.items?.map((i) => ({ id: i.id, qty: i.qty })) ?? [],
        rushId: est?.rushId ?? "none",
        travelMiles: Number(est?.travelMiles ?? 0),
      };
    }
  }

  let loaded: LoadedProposal | undefined;
  if (editId) {
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
    clientName: fromLead?.clientName ?? (typeof params.name === "string" ? params.name : ""),
    company: fromLead?.company ?? (typeof params.company === "string" ? params.company : ""),
    email: fromLead?.email ?? (typeof params.email === "string" ? params.email : ""),
  };

  return <ProposalBuilder loaded={loaded} prefill={prefill} fromLead={fromLead} />;
}
