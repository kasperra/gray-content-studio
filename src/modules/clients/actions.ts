"use server";

import { revalidatePath } from "next/cache";
import { randomBytes } from "crypto";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";

export async function createClientRecord(input: {
  company: string;
  contactName?: string;
  contactEmail?: string;
  phone?: string;
  notes?: string;
}): Promise<{ ok: boolean; id?: string; message: string }> {
  await requireAdmin();
  if (!input.company.trim()) return { ok: false, message: "Company name is required." };
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase
    .from("clients")
    .insert({
      company: input.company.trim(),
      contact_name: input.contactName?.trim() || null,
      contact_email: input.contactEmail?.trim() || null,
      phone: input.phone?.trim() || null,
      notes: input.notes?.trim() || null,
    })
    .select("id")
    .single();
  if (error) return { ok: false, message: "Could not create the client." };
  revalidatePath("/admin/clients");
  return { ok: true, id: data.id, message: "Client created." };
}

/** Convert a lead into a client record and link them. */
export async function convertLeadToClient(
  leadId: string
): Promise<{ ok: boolean; clientId?: string; message: string }> {
  await requireAdmin();
  const supabase = await createSupabaseServer();

  const { data: lead } = await supabase.from("leads").select("*").eq("id", leadId).single();
  if (!lead) return { ok: false, message: "Lead not found." };
  if (lead.client_id) return { ok: true, clientId: lead.client_id, message: "Lead is already linked to a client." };

  const { data: client, error } = await supabase
    .from("clients")
    .insert({
      company: lead.company || lead.name,
      contact_name: lead.name,
      contact_email: lead.email,
      notes: lead.message ? `From website inquiry: ${lead.message}` : null,
    })
    .select("id")
    .single();
  if (error || !client) return { ok: false, message: "Could not create the client." };

  await supabase
    .from("leads")
    .update({ client_id: client.id, status: lead.status === "new" ? "qualified" : lead.status })
    .eq("id", leadId);

  await supabase.from("activities").insert({
    client_id: client.id,
    lead_id: leadId,
    kind: "system",
    body: "Client created from website lead.",
  });

  revalidatePath("/admin");
  revalidatePath("/admin/clients");
  return { ok: true, clientId: client.id, message: "Lead converted to client." };
}

/** Provision a portal login for a client contact. Returns a one-time temp password
    for the studio to share — avoids depending on email templates (free-tier friendly). */
export async function createClientLogin(input: {
  clientId: string;
  email: string;
  name: string;
}): Promise<{ ok: boolean; tempPassword?: string; message: string }> {
  await requireAdmin();
  const email = input.email.trim().toLowerCase();
  if (!email || !input.clientId) return { ok: false, message: "Client and email are required." };

  const admin = createSupabaseAdmin();
  const tempPassword = `Gray-${randomBytes(6).toString("base64url")}`;

  const { data: created, error } = await admin.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: { name: input.name.trim() || email },
  });
  if (error || !created.user) {
    return {
      ok: false,
      message: error?.message?.includes("already")
        ? "A login already exists for that email."
        : "Could not create the login.",
    };
  }

  // The signup trigger created the profile — link it to the client
  const { error: profileError } = await admin
    .from("profiles")
    .update({ client_id: input.clientId, role: "client", name: input.name.trim() || null })
    .eq("id", created.user.id);
  if (profileError) return { ok: false, message: "Login created but linking to the client failed." };

  revalidatePath(`/admin/clients/${input.clientId}`);
  return { ok: true, tempPassword, message: "Login created — share the temporary password securely." };
}
