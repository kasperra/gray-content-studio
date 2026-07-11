"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServer } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import type { Estimate } from "@/modules/pricing/compute";

export type ProposalDetails = {
  clientName: string;
  company: string;
  email: string;
  title: string;
  notes: string;
  validUntil: string; // yyyy-mm-dd or ""
};

function proposalRow(details: ProposalDetails, estimate: Estimate) {
  return {
    client_name: details.clientName || null,
    company: details.company || null,
    email: details.email || null,
    title: details.title || null,
    notes: details.notes || null,
    valid_until: details.validUntil || null,
    items: estimate.items,
    subtotal: estimate.subtotal,
    rush_id: estimate.rushId,
    rush_name: estimate.rushName,
    rush_pct: estimate.rushPct,
    rush_amt: estimate.rushAmt,
    travel_miles: estimate.travelMiles,
    travel_amt: estimate.travelAmt,
    discount_type: estimate.discountType,
    discount_value: estimate.discountValue,
    discount_amt: estimate.discountAmt,
    total: estimate.total,
    deposit_pct: estimate.depositPct,
    deposit: estimate.deposit,
    balance: estimate.balance,
  };
}

export async function saveProposal(
  details: ProposalDetails,
  estimate: Estimate,
  existingId?: string
): Promise<{ ok: boolean; id?: string; publicId?: string; message: string }> {
  await requireAdmin();
  const supabase = await createSupabaseServer();

  if (!estimate.items.length) return { ok: false, message: "Select at least one service." };
  if (!details.clientName && !details.title)
    return { ok: false, message: "Add a client name or project title." };

  const row = proposalRow(details, estimate);

  if (existingId) {
    const { data, error } = await supabase
      .from("proposals")
      .update(row)
      .eq("id", existingId)
      .select("id, public_id")
      .single();
    if (error) return { ok: false, message: "Could not update the proposal." };
    revalidatePath("/admin/proposals");
    return { ok: true, id: data.id, publicId: data.public_id, message: "Proposal updated." };
  }

  const { data, error } = await supabase
    .from("proposals")
    .insert(row)
    .select("id, public_id")
    .single();
  if (error) return { ok: false, message: "Could not save the proposal." };
  revalidatePath("/admin/proposals");
  return { ok: true, id: data.id, publicId: data.public_id, message: "Proposal saved as draft." };
}

export async function setProposalStatus(id: string, status: "draft" | "sent" | "accepted" | "declined") {
  await requireAdmin();
  const supabase = await createSupabaseServer();
  await supabase.from("proposals").update({ status }).eq("id", id);
  revalidatePath("/admin/proposals");
}

export async function deleteProposal(id: string) {
  await requireAdmin();
  const supabase = await createSupabaseServer();
  await supabase.from("proposals").delete().eq("id", id);
  revalidatePath("/admin/proposals");
}

export async function setLeadStatus(
  id: string,
  status: "new" | "contacted" | "qualified" | "won" | "lost"
) {
  await requireAdmin();
  const supabase = await createSupabaseServer();
  await supabase.from("leads").update({ status }).eq("id", id);
  revalidatePath("/admin");
}
