-- First-visit offer popup — coupon issuance + marketing consent ledger.
-- Apply by hand in the Supabase SQL editor (same as the other migrations).

-- The popup writes into the existing `leads` table so a claim lands on the same
-- CRM board as every other inquiry. It only needs one column that wasn't there.
alter table leads add column if not exists phone text;

-- diagnostic_config is already an admin-only key/value store; reuse it rather
-- than standing up a second one. Keys are namespaced by feature.
comment on table diagnostic_config is
  'Editable key/value config for public-site features. Key prefixes: cta_*/result_*/booking_* = Content Growth Diagnostic, offer_* = first-visit offer popup.';

-- One row per coupon issued. Deliberately separate from `leads`: this is the
-- consent + coupon ledger (what was agreed to, when, under which wording), and
-- it has to stay intact and append-only-ish even as the CRM lead is edited.
create table if not exists offer_claims (
  id uuid primary key default gen_random_uuid(),

  -- The CRM lead this claim created or updated. `set null` so deleting a lead
  -- from the pipeline never destroys the consent record behind it.
  lead_id uuid references leads on delete set null,

  name text,
  email text not null,
  phone text,

  -- The one question the popup asks. The visitor is never shown a stage; it's
  -- stored so a claim can be compared with, or upgraded into, a full diagnostic.
  answer_id text not null,
  stage int,
  bottleneck text,

  coupon_code text not null unique,
  discount_label text,
  expires_at timestamptz,
  redeemed_at timestamptz,

  -- Consent is per-channel and never inferred from someone handing over an
  -- address or a number. Version pins the exact wording they agreed to.
  email_consent boolean not null default false,
  sms_consent boolean not null default false,
  consent_version text,
  consent_at timestamptz,
  consent_source text not null default 'first_visit_popup',

  created_at timestamptz not null default now()
);

create index if not exists offer_claims_email_idx on offer_claims (lower(email));
create index if not exists offer_claims_created_idx on offer_claims (created_at desc);

alter table offer_claims enable row level security;

-- Admin-only, like leads. The public popup reads and writes through the
-- service-role client in server actions; the browser never sees this table.
create policy "admin all offer_claims" on offer_claims for all using (auth_role() = 'admin');

insert into diagnostic_config (key, value) values
  ('offer_enabled', 'false'), -- switch on from Admin - Offer once the consent copy is reviewed
  ('offer_headline', 'What would make your content work harder for your business right now?'),
  ('offer_discount_label', '10% off your first project'),
  ('offer_discount_note', 'Applies to your first booked project with Gray Content Studio.'),
  ('offer_coupon_days', '30'),
  ('offer_code_prefix', 'GRAY'),
  ('offer_delay_seconds', '25'),
  ('offer_scroll_percent', '45'),
  ('offer_exit_intent', 'true'),
  ('offer_suppress_days', '14'),
  ('offer_sms_enabled', 'false'),
  ('offer_eligibility',
   'One coupon per business. Applies to new projects only, cannot be combined with other offers or applied to work already booked, and has no cash value.')
on conflict (key) do nothing;
