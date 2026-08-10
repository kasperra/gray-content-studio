-- Content Growth Diagnostic — lead capture, funnel analytics, and editable config.
-- Apply by hand in the Supabase SQL editor (same as the other migrations).

create table if not exists diagnostic_results (
  id uuid primary key default gen_random_uuid(),
  -- Unguessable id used in the shareable result URL. Not sequential, so results
  -- can't be enumerated.
  public_id text not null unique default encode(gen_random_bytes(12), 'hex'),

  -- Raw answers plus the server-computed diagnosis. Scoring is never trusted
  -- from the browser; these columns are written from the server action.
  answers jsonb not null default '{}'::jsonb,
  scores jsonb not null default '{}'::jsonb,
  overall_score int not null default 0,
  stage int not null,
  stage_name text not null,
  primary_bottleneck text not null,
  secondary_bottlenecks jsonb not null default '[]'::jsonb,
  recommended_next_step text,

  -- Segmentation captured during the diagnostic itself.
  business_type text,
  purchase_intent text,
  urgency text,

  -- Contact details, only present once the visitor asks for the full roadmap.
  name text,
  email text,
  business_name text,
  website text,
  email_captured_at timestamptz,

  completed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists diagnostic_results_stage_idx on diagnostic_results (stage);
create index if not exists diagnostic_results_bottleneck_idx on diagnostic_results (primary_bottleneck);
create index if not exists diagnostic_results_intent_idx on diagnostic_results (purchase_intent);
create index if not exists diagnostic_results_created_idx on diagnostic_results (created_at desc);
create index if not exists diagnostic_results_email_idx on diagnostic_results (email);

-- Funnel events. Anonymous until a result exists, so result_id is nullable.
create table if not exists diagnostic_events (
  id uuid primary key default gen_random_uuid(),
  event text not null check (
    event in ('view', 'start', 'question', 'complete', 'capture', 'cta_click')
  ),
  result_id uuid references diagnostic_results on delete cascade,
  -- Anonymous per-visit id so the funnel can be counted without cookies or PII.
  session_id text,
  -- For 'question': which question was last seen, to find the drop-off point.
  step text,
  created_at timestamptz not null default now()
);

create index if not exists diagnostic_events_event_idx on diagnostic_events (event);
create index if not exists diagnostic_events_created_idx on diagnostic_events (created_at desc);
create index if not exists diagnostic_events_session_idx on diagnostic_events (session_id);

-- Copy and links Gray can change without a code deploy.
create table if not exists diagnostic_config (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

insert into diagnostic_config (key, value) values
  ('booking_url', 'https://www.graycontentstudio.co/#contact'),
  ('cta_stage_1', 'Build My Content Foundation'),
  ('cta_stage_2', 'Build My Content Strategy'),
  ('cta_stage_3', 'Fix My Content-to-Conversion Gap'),
  ('cta_stage_4', 'Scale My Content Engine'),
  ('cta_stage_5', 'Optimize My Content Growth System'),
  ('result_footer',
   'Your diagnostic was created by Gray Content Studio to help businesses understand where their content is working, where it''s breaking down, and what to do next.')
on conflict (key) do nothing;

alter table diagnostic_results enable row level security;
alter table diagnostic_events enable row level security;
alter table diagnostic_config enable row level security;

-- Admins see everything. There are deliberately no anon policies: the public
-- diagnostic writes and reads through the service-role client in server
-- actions, so lead rows are never exposed to the browser.
create policy "admin all diagnostic_results" on diagnostic_results for all using (auth_role() = 'admin');
create policy "admin all diagnostic_events" on diagnostic_events for all using (auth_role() = 'admin');
create policy "admin all diagnostic_config" on diagnostic_config for all using (auth_role() = 'admin');
