"use server";

import { createSupabaseAdmin, supabaseConfigured } from "@/lib/supabase/server";

export type LeadFormState = { ok: boolean; message: string } | null;

const FORMSPREE_URL = "https://formspree.io/f/xbdvqvyo"; // email notification channel

export async function submitLead(
  _prev: LeadFormState,
  formData: FormData
): Promise<LeadFormState> {
  // Honeypot: silently accept bots without recording anything
  if (formData.get("_gotcha")) {
    return { ok: true, message: "Thank you — your inquiry is in." };
  }

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const company = String(formData.get("company") ?? "").trim();
  const projectType = String(formData.get("project_type") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();

  if (!name || !email || !projectType) {
    return { ok: false, message: "Please fill in your name, email, and project type." };
  }

  let dbOk = false;
  let emailOk = false;

  // 1) CRM record in Supabase (service role — leads table is admin-only under RLS)
  if (supabaseConfigured() && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const admin = createSupabaseAdmin();
      const { error } = await admin.from("leads").insert({
        name,
        email,
        company: company || null,
        project_type: projectType,
        message: message || null,
        source: "website",
      });
      dbOk = !error;
    } catch {
      dbOk = false;
    }
  }

  // 2) Email notification via Formspree (existing confirmed-working channel)
  try {
    const res = await fetch(FORMSPREE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ name, email, company, project_type: projectType, message }),
    });
    emailOk = res.ok;
  } catch {
    emailOk = false;
  }

  if (dbOk || emailOk) {
    return {
      ok: true,
      message: "Thank you — your inquiry is in. We'll reply personally within one business day.",
    };
  }
  return {
    ok: false,
    message: "Something went wrong sending your message. Please try again or email us directly.",
  };
}
