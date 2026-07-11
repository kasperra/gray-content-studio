-- Gray Content Studio — Agency OS schema
-- Apply in the Supabase SQL Editor (or `supabase db push`).
-- Covers all planned modules; Phase 1 actively uses: profiles, clients, leads, proposals.

-- ========== Identity ==========

create type user_role as enum ('admin', 'client');

create table clients (
  id uuid primary key default gen_random_uuid(),
  company text not null,
  contact_name text,
  contact_email text,
  phone text,
  notes text,
  created_at timestamptz not null default now()
);

create table profiles (
  id uuid primary key references auth.users on delete cascade,
  role user_role not null default 'client',
  client_id uuid references clients on delete set null,
  name text,
  created_at timestamptz not null default now()
);

-- Helper: current user's role / client (security definer avoids RLS recursion)
create or replace function auth_role() returns user_role
language sql stable security definer set search_path = public as
$$ select role from profiles where id = auth.uid() $$;

create or replace function auth_client_id() returns uuid
language sql stable security definer set search_path = public as
$$ select client_id from profiles where id = auth.uid() $$;

-- ========== CRM ==========

create type lead_status as enum ('new', 'contacted', 'qualified', 'won', 'lost');

create table leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  company text,
  project_type text,
  message text,
  source text not null default 'website',
  status lead_status not null default 'new',
  client_id uuid references clients on delete set null,
  created_at timestamptz not null default now()
);

create table activities (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references leads on delete cascade,
  client_id uuid references clients on delete cascade,
  project_id uuid,
  kind text not null default 'note', -- note | call | email | status_change | system
  body text,
  created_by uuid references auth.users,
  created_at timestamptz not null default now()
);

-- ========== Sales ==========

create type proposal_status as enum ('draft', 'sent', 'accepted', 'declined');

create table proposals (
  id uuid primary key default gen_random_uuid(),
  public_id text not null unique default substr(md5(random()::text), 1, 10),
  client_id uuid references clients on delete set null,
  lead_id uuid references leads on delete set null,
  client_name text,
  company text,
  email text,
  title text,
  notes text,
  valid_until date,
  items jsonb not null default '[]',
  subtotal numeric(12,2) not null default 0,
  rush_id text not null default 'none',
  rush_name text,
  rush_pct numeric(5,2) not null default 0,
  rush_amt numeric(12,2) not null default 0,
  travel_miles numeric(8,1) not null default 0,
  travel_amt numeric(12,2) not null default 0,
  discount_type text not null default 'none',
  discount_value numeric(12,2) not null default 0,
  discount_amt numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  deposit_pct numeric(5,2) not null default 50,
  deposit numeric(12,2) not null default 0,
  balance numeric(12,2) not null default 0,
  status proposal_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table contracts (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients on delete cascade,
  proposal_id uuid references proposals on delete set null,
  title text not null,
  storage_path text,
  status text not null default 'draft', -- draft | sent | signed
  created_at timestamptz not null default now()
);

create table invoices (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients on delete cascade,
  proposal_id uuid references proposals on delete set null,
  number text not null,
  amount numeric(12,2) not null,
  due_date date,
  status text not null default 'draft', -- draft | sent | paid | overdue
  created_at timestamptz not null default now()
);

-- ========== Production ==========

create type project_stage as enum (
  'lead', 'proposal', 'contract', 'deposit', 'pre_production', 'production',
  'editing', 'review', 'revisions', 'approval', 'delivery', 'completed'
);

create table projects (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients on delete cascade,
  proposal_id uuid references proposals on delete set null,
  title text not null,
  stage project_stage not null default 'lead',
  description text,
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table deliverables (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects on delete cascade,
  title text not null,
  storage_path text,
  status text not null default 'pending', -- pending | in_review | approved | delivered
  created_at timestamptz not null default now()
);

create table tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects on delete cascade,
  title text not null,
  done boolean not null default false,
  due_date date,
  assigned_to uuid references auth.users,
  created_at timestamptz not null default now()
);

alter table activities
  add constraint activities_project_fk
  foreign key (project_id) references projects on delete cascade;

-- ========== Video Review (Phase 4) ==========

create table review_versions (
  id uuid primary key default gen_random_uuid(),
  deliverable_id uuid not null references deliverables on delete cascade,
  version int not null default 1,
  storage_path text not null,
  status text not null default 'in_review', -- in_review | changes_requested | approved
  created_at timestamptz not null default now()
);

create table review_comments (
  id uuid primary key default gen_random_uuid(),
  version_id uuid not null references review_versions on delete cascade,
  author uuid references auth.users,
  timestamp_seconds numeric(10,2),
  body text not null,
  resolved boolean not null default false,
  created_at timestamptz not null default now()
);

-- ========== Assets (Phase 5) ==========

create table asset_folders (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients on delete cascade,
  parent_id uuid references asset_folders on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table assets (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients on delete cascade,
  folder_id uuid references asset_folders on delete set null,
  name text not null,
  kind text not null default 'file', -- video | photo | logo | graphic | doc | music | file
  storage_path text not null,
  tags text[] not null default '{}',
  version_of uuid references assets on delete set null,
  created_at timestamptz not null default now()
);

-- ========== Social Workspace (Phase 6) ==========

create table social_posts (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients on delete cascade,
  platforms text[] not null default '{}',
  caption text,
  hashtags text,
  media_paths text[] not null default '{}',
  scheduled_for timestamptz,
  status text not null default 'draft', -- draft | scheduled | published | archived
  created_at timestamptz not null default now()
);

create table content_templates (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients on delete cascade, -- null = studio-wide
  kind text not null, -- reel | short | social_post | blog | newsletter | caption
  name text not null,
  body text not null,
  created_at timestamptz not null default now()
);

-- ========== Analytics ==========

create table metric_snapshots (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients on delete cascade,
  project_id uuid references projects on delete cascade,
  module text not null,   -- production | marketing | website
  metric text not null,   -- views | reach | engagement | ctr | watch_time | turnaround_days | revisions
  value numeric not null,
  captured_on date not null default current_date,
  created_at timestamptz not null default now()
);

-- ========== Row Level Security ==========
-- Pattern: admins see everything; clients see only rows tied to their client_id.

alter table clients enable row level security;
alter table profiles enable row level security;
alter table leads enable row level security;
alter table activities enable row level security;
alter table proposals enable row level security;
alter table contracts enable row level security;
alter table invoices enable row level security;
alter table projects enable row level security;
alter table deliverables enable row level security;
alter table tasks enable row level security;
alter table review_versions enable row level security;
alter table review_comments enable row level security;
alter table asset_folders enable row level security;
alter table assets enable row level security;
alter table social_posts enable row level security;
alter table content_templates enable row level security;
alter table metric_snapshots enable row level security;

-- profiles: users read their own; admins read all
create policy "own profile" on profiles for select using (id = auth.uid());
create policy "admin all profiles" on profiles for all using (auth_role() = 'admin');

-- clients
create policy "admin all clients" on clients for all using (auth_role() = 'admin');
create policy "client reads own client" on clients for select using (id = auth_client_id());

-- leads: admin only (public inserts go through the service role in a server action)
create policy "admin all leads" on leads for all using (auth_role() = 'admin');

-- activities
create policy "admin all activities" on activities for all using (auth_role() = 'admin');

-- proposals: admin manages; public view is served via service role by public_id
create policy "admin all proposals" on proposals for all using (auth_role() = 'admin');
create policy "client reads own proposals" on proposals for select using (client_id = auth_client_id());

-- contracts / invoices
create policy "admin all contracts" on contracts for all using (auth_role() = 'admin');
create policy "client reads own contracts" on contracts for select using (client_id = auth_client_id());
create policy "admin all invoices" on invoices for all using (auth_role() = 'admin');
create policy "client reads own invoices" on invoices for select using (client_id = auth_client_id());

-- projects & children
create policy "admin all projects" on projects for all using (auth_role() = 'admin');
create policy "client reads own projects" on projects for select using (client_id = auth_client_id());

create policy "admin all deliverables" on deliverables for all using (auth_role() = 'admin');
create policy "client reads own deliverables" on deliverables for select
  using (exists (select 1 from projects p where p.id = project_id and p.client_id = auth_client_id()));

create policy "admin all tasks" on tasks for all using (auth_role() = 'admin');

-- review
create policy "admin all review_versions" on review_versions for all using (auth_role() = 'admin');
create policy "client reads own review_versions" on review_versions for select
  using (exists (
    select 1 from deliverables d join projects p on p.id = d.project_id
    where d.id = deliverable_id and p.client_id = auth_client_id()
  ));

create policy "admin all review_comments" on review_comments for all using (auth_role() = 'admin');
create policy "client rw own review_comments" on review_comments for select
  using (exists (
    select 1 from review_versions v
    join deliverables d on d.id = v.deliverable_id
    join projects p on p.id = d.project_id
    where v.id = version_id and p.client_id = auth_client_id()
  ));
create policy "client adds review_comments" on review_comments for insert
  with check (author = auth.uid() and exists (
    select 1 from review_versions v
    join deliverables d on d.id = v.deliverable_id
    join projects p on p.id = d.project_id
    where v.id = version_id and p.client_id = auth_client_id()
  ));

-- assets
create policy "admin all asset_folders" on asset_folders for all using (auth_role() = 'admin');
create policy "client reads own asset_folders" on asset_folders for select using (client_id = auth_client_id());
create policy "admin all assets" on assets for all using (auth_role() = 'admin');
create policy "client reads own assets" on assets for select using (client_id = auth_client_id());

-- social
create policy "admin all social_posts" on social_posts for all using (auth_role() = 'admin');
create policy "client rw own social_posts" on social_posts for all
  using (client_id = auth_client_id()) with check (client_id = auth_client_id());
create policy "admin all content_templates" on content_templates for all using (auth_role() = 'admin');
create policy "client reads templates" on content_templates for select
  using (client_id is null or client_id = auth_client_id());

-- analytics
create policy "admin all metric_snapshots" on metric_snapshots for all using (auth_role() = 'admin');
create policy "client reads own metrics" on metric_snapshots for select using (client_id = auth_client_id());

-- ========== Storage buckets ==========

insert into storage.buckets (id, name, public) values
  ('deliverables', 'deliverables', false),
  ('assets', 'assets', false),
  ('documents', 'documents', false)
on conflict (id) do nothing;

create policy "admin storage all" on storage.objects for all
  using (auth_role() = 'admin') with check (auth_role() = 'admin');

-- Clients read files under a folder named by their client_id: <client_id>/...
create policy "client reads own files" on storage.objects for select
  using (
    bucket_id in ('deliverables', 'assets', 'documents')
    and (storage.foldername(name))[1] = auth_client_id()::text
  );

-- ========== updated_at triggers ==========

create or replace function touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger proposals_touch before update on proposals
  for each row execute function touch_updated_at();
create trigger projects_touch before update on projects
  for each row execute function touch_updated_at();

-- ========== Auto-create profile on signup ==========

create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', new.email));
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
