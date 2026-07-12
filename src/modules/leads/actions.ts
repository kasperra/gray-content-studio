"use server";

import { createSupabaseAdmin, supabaseConfigured } from "@/lib/supabase/server";
import {
  parseDraft,
  estimateFromDraft,
  summarizeEstimate,
} from "@/modules/pricing/estimate-link";

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
  let message = String(formData.get("message") ?? "").trim();

  if (!name || !email || !projectType) {
    return { ok: false, message: "Please fill in your name, email, and project type." };
  }

  // Estimate handed off from the pricing calculator — validate the draft and
  // recompute all totals server-side from the canonical rate card.
  const draft = parseDraft(String(formData.get("estimate") ?? ""));
  const estimate = draft ? estimateFromDraft(draft) : null;
  if (estimate && estimate.items.length > 0) {
    message = [message, summarizeEstimate(estimate)].filter(Boolean).join("\n\n");
  }

  let dbOk = false;
  let emailOk = false;

  // 1) CRM record in Supabase (service role — leads table is admin-only under RLS)
  if (supabaseConfigured() && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const admin = createSupabaseAdmin();
      const row = {
        name,
        email,
        company: company || null,
        project_type: projectType,
        message: message || null,
        source: estimate ? "pricing_calculator" : "website",
        estimate: estimate && estimate.items.length > 0 ? estimate : null,
      };
      let { error } = await admin.from("leads").insert(row);
      if (error && estimate) {
        // Fallback if the 0002 migration (estimate column) isn't applied yet —
        // the summary is still preserved inside `message`.
        ({ error } = await admin.from("leads").insert({ ...row, estimate: undefined }));
      }
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
