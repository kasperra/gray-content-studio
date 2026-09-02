-- Seasonal campaign landing pages (/fall-mini-sessions and future seasons).
-- Apply by hand in the Supabase SQL editor (same as the other migrations).

-- Campaign inquiries also write into `leads` so they land on the same CRM board
-- as every other inquiry. `phone` was added by 0004 for the offer popup; this
-- re-states it so 0006 can be applied on an install that skipped 0004.
alter table leads add column if not exists phone text;

-- The structured record behind the CRM card. Separate from `leads` for the same
-- reason offer_claims is: the lead is a card someone edits and moves around a
-- pipeline, while this is what the visitor actually submitted, kept intact —
-- including the date they asked for, which is a request and not a booking.
create table if not exists campaign_inquiries (
  id uuid primary key default gen_random_uuid(),

  -- Which campaign the inquiry came from, e.g. 'fall-mini-sessions'. Plain text
  -- rather than a foreign key: campaigns are defined in code, not in the DB, and
  -- an inquiry has to outlive the season it came from.
  campaign_slug text not null,

  -- The lead this inquiry created or updated. `set null` so deleting a lead from
  -- the pipeline never destroys the inquiry behind it.
  lead_id uuid references leads on delete set null,

  name text not null,
  email text not null,
  phone text,

  -- The day the visitor asked for, stored as a date because no time of day is
  -- ever collected. The studio confirms the real date separately.
  preferred_date date,
  -- Stable option value ('family', 'couple', …), not the visitor-facing label,
  -- so rewording the form doesn't rewrite history.
  session_type text,
  ideas text,

  -- Best-effort delivery flags, like offer_claims.coupon_emailed_at: an inquiry
  -- is saved whether or not either message left the building.
  customer_emailed_at timestamptz,
  studio_emailed_at timestamptz,

  created_at timestamptz not null default now()
);

create index if not exists campaign_inquiries_campaign_idx
  on campaign_inquiries (campaign_slug, created_at desc);
create index if not exists campaign_inquiries_email_idx
  on campaign_inquiries (lower(email));

alter table campaign_inquiries enable row level security;

-- Admin-only, like leads and offer_claims. The public page reads and writes
-- through the service-role client in server actions; the browser never sees it.
create policy "admin all campaign_inquiries" on campaign_inquiries
  for all using (auth_role() = 'admin');

-- diagnostic_config is the shared key/value store for public-site features.
-- Campaign overrides are namespaced campaign_<slug>_<field>; every key is
-- optional, since modules/campaigns/campaigns.ts holds the defaults.
comment on table diagnostic_config is
  'Editable key/value config for public-site features. Key prefixes: '
  'cta_*/result_*/booking_* = Content Growth Diagnostic, offer_* = first-visit '
  'offer popup, campaign_* = seasonal campaign landing pages.';
