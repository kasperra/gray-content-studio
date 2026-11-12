"use server";

import { revalidatePath } from "next/cache";
import { randomBytes } from "crypto";
import { createUser, deleteUser } from "@/lib/auth/users";
import { userDb, adminDb } from "@/lib/db";
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
  const db = await userDb();
  const { data, error } = await db
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

/** Permanently delete a client and everything tied to it.
 *
 * The DB cascades projects, deliverables, invoices, contracts, activities, assets,
 * and metrics (all `on delete cascade`). Two things it does NOT cascade, handled here:
 *   - Portal logins: `profiles.client_id` is `on delete set null`, so the auth users
 *     are deleted explicitly (which cascades their profile rows) to avoid orphaned logins.
 *   - Leads: `leads.client_id` is `on delete set null`, so lead history is preserved,
 *     just unlinked — intentional.
 *
 * Uses the service-role client (admin-gated) so RLS can't silently block the delete. */
export async function deleteClient(
  clientId: string
): Promise<{ ok: boolean; message: string }> {
  await requireAdmin();
  if (!clientId) return { ok: false, message: "Missing client." };

  const admin = adminDb();

  // 1. Remove any portal logins (auth users) linked to this client.
  const { data: logins } = await admin.from("profiles").select("id").eq("client_id", clientId);
  for (const login of logins ?? []) {
    // Best-effort: if a login is already gone, keep going.
    await deleteUser(login.id).catch(() => {});
  }

  // 2. Delete the client — the database cascades the rest.
  const { error } = await admin.from("clients").delete().eq("id", clientId);
  if (error) return { ok: false, message: "Could not delete the client." };

  revalidatePath("/admin/clients");
  revalidatePath("/admin");
  return { ok: true, message: "Client deleted." };
}

/** Convert a lead into a client record and link them. */
export async function convertLeadToClient(
  leadId: string
): Promise<{ ok: boolean; clientId?: string; message: string }> {
  await requireAdmin();
  const db = await userDb();

  const { data: lead } = await db.from("leads").select("*").eq("id", leadId).single();
  if (!lead) return { ok: false, message: "Lead not found." };
  if (lead.client_id) return { ok: true, clientId: lead.client_id, message: "Lead is already linked to a client." };

  const { data: client, error } = await db
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

  await db
    .from("leads")
    .update({ client_id: client.id, status: lead.status === "new" ? "qualified" : lead.status })
    .eq("id", leadId);

  await db.from("activities").insert({
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

  const admin = adminDb();
  const tempPassword = `Gray-${randomBytes(6).toString("base64url")}`;

  const created = await createUser({
    email,
    password: tempPassword,
    name: input.name.trim() || email,
  });
  const error = created.error ? { message: created.error } : null;
  if (error || !created.id) {
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
    .eq("id", created.id);
  if (profileError) return { ok: false, message: "Login created but linking to the client failed." };

  revalidatePath(`/admin/clients/${input.clientId}`);
  return { ok: true, tempPassword, message: "Login created — share the temporary password securely." };
}
