"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServer } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";

function refreshCrm() {
  revalidatePath("/admin");
  revalidatePath("/admin/crm");
  revalidatePath("/admin/invoices");
}

/** Delete an invoice. Invoices are leaf records, so this is a straight delete. */
export async function deleteInvoice(
  invoiceId: string
): Promise<{ ok: boolean; message: string }> {
  await requireAdmin();
  if (!invoiceId) return { ok: false, message: "Missing invoice." };
  const supabase = await createSupabaseServer();
  const { data: invoice } = await supabase
    .from("invoices")
    .select("client_id")
    .eq("id", invoiceId)
    .single();
  const { error } = await supabase.from("invoices").delete().eq("id", invoiceId);
  if (error) return { ok: false, message: "Could not delete the invoice." };
  refreshCrm();
  if (invoice?.client_id) revalidatePath(`/admin/clients/${invoice.client_id}`);
  return { ok: true, message: "Invoice deleted." };
}

export async function addNote(input: {
  body: string;
  leadId?: string;
  clientId?: string;
  projectId?: string;
}): Promise<{ ok: boolean; message: string }> {
  const session = await requireAdmin();
  if (!input.body.trim()) return { ok: false, message: "Write something first." };
  const supabase = await createSupabaseServer();
  const { error } = await supabase.from("activities").insert({
    lead_id: input.leadId ?? null,
    client_id: input.clientId ?? null,
    project_id: input.projectId ?? null,
    kind: "note",
    body: input.body.trim(),
    created_by: session.userId,
  });
  if (error) return { ok: false, message: "Could not save the note." };
  refreshCrm();
  if (input.clientId) revalidatePath(`/admin/clients/${input.clientId}`);
  if (input.projectId) revalidatePath(`/admin/projects/${input.projectId}`);
  return { ok: true, message: "Note saved." };
}

export async function createInvoice(input: {
  clientId: string;
  number: string;
  amount: number;
  dueDate?: string;
}): Promise<{ ok: boolean; message: string }> {
  await requireAdmin();
  if (!input.clientId || !input.number.trim() || !(input.amount > 0))
    return { ok: false, message: "Client, invoice number, and a positive amount are required." };
  const supabase = await createSupabaseServer();
  const { error } = await supabase.from("invoices").insert({
    client_id: input.clientId,
    number: input.number.trim(),
    amount: input.amount,
    due_date: input.dueDate || null,
    status: "sent",
  });
  if (error) return { ok: false, message: "Could not create the invoice." };

  await supabase.from("activities").insert({
    client_id: input.clientId,
    kind: "system",
    body: `Invoice ${input.number.trim()} sent ($${input.amount.toLocaleString()}).`,
  });
  refreshCrm();
  return { ok: true, message: "Invoice created." };
}

export async function setInvoiceStatus(
  invoiceId: string,
  status: "draft" | "sent" | "paid" | "overdue"
) {
  await requireAdmin();
  const supabase = await createSupabaseServer();
  const { data: inv } = await supabase
    .from("invoices")
    .update({ status })
    .eq("id", invoiceId)
    .select("client_id, number")
    .single();
  if (inv && status === "paid") {
    await supabase.from("activities").insert({
      client_id: inv.client_id,
      kind: "system",
      body: `Invoice ${inv.number} marked paid.`,
    });
  }
  refreshCrm();
}

/* ---------- Follow-up engine (computed, no external services) ---------- */

export type FollowUp = {
  kind: "stale_lead" | "quiet_proposal" | "overdue_invoice";
  label: string;
  detail: string;
  href: string;
};

const DAY = 24 * 60 * 60 * 1000;

export async function computeFollowUps(): Promise<FollowUp[]> {
  await requireAdmin();
  const supabase = await createSupabaseServer();
  const now = Date.now();
  const followUps: FollowUp[] = [];

  // Leads still new/contacted with no touch in 3+ days
  const { data: leads } = await supabase
    .from("leads")
    .select("id, name, company, status, created_at")
    .in("status", ["new", "contacted"]);
  if (leads?.length) {
    const { data: touches } = await supabase
      .from("activities")
      .select("lead_id, created_at")
      .in("lead_id", leads.map((l) => l.id));
    for (const lead of leads) {
      const lastTouch = Math.max(
        new Date(lead.created_at).getTime(),
        ...(touches ?? [])
          .filter((t) => t.lead_id === lead.id)
          .map((t) => new Date(t.created_at).getTime())
      );
      const days = Math.floor((now - lastTouch) / DAY);
      if (days >= 3) {
        followUps.push({
          kind: "stale_lead",
          label: `Follow up with ${lead.name}${lead.company ? ` (${lead.company})` : ""}`,
          detail: `No activity for ${days} days — status "${lead.status}".`,
          href: "/admin/crm",
        });
      }
    }
  }

  // Proposals sitting in "sent" for 7+ days
  const { data: proposals } = await supabase
    .from("proposals")
    .select("id, client_name, title, total, updated_at")
    .eq("status", "sent");
  for (const p of proposals ?? []) {
    const days = Math.floor((now - new Date(p.updated_at).getTime()) / DAY);
    if (days >= 7) {
      followUps.push({
        kind: "quiet_proposal",
        label: `Nudge ${p.client_name || "client"} on "${p.title || "proposal"}"`,
        detail: `Sent ${days} days ago ($${Number(p.total).toLocaleString()}) with no decision.`,
        href: "/admin/proposals",
      });
    }
  }

  // Invoices past due
  const today = new Date().toISOString().slice(0, 10);
  const { data: invoices } = await supabase
    .from("invoices")
    .select("id, number, amount, due_date, clients(company)")
    .eq("status", "sent")
    .lt("due_date", today);
  for (const inv of invoices ?? []) {
    const company = (inv.clients as unknown as { company: string } | null)?.company ?? "client";
    followUps.push({
      kind: "overdue_invoice",
      label: `Invoice ${inv.number} is overdue`,
      detail: `${company} — $${Number(inv.amount).toLocaleString()}, due ${inv.due_date}.`,
      href: "/admin/invoices",
    });
  }

  return followUps;
}
