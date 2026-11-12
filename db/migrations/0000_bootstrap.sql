-- Platform pieces the schema relies on: extensions, the two request roles that
-- Row Level Security runs under, and the `auth` schema (users, sessions,
-- password-reset tokens) that the app's own login uses.
--
-- How RLS works here: the app connects as the database owner, which bypasses
-- RLS (that's the "admin" client used by server-only code). For a logged-in
-- user's queries, src/lib/db wraps each query in a transaction that switches to
-- the `authenticated` role and sets `app.user_id`, so `auth.uid()` returns that
-- user and every policy in 0001+ applies exactly as written.

create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin noinherit;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin noinherit;
  end if;
end $$;

-- The connecting (owner) role must be allowed to switch into both.
do $$
begin
  execute format('grant anon to %I', current_user);
  execute format('grant authenticated to %I', current_user);
end $$;

create schema if not exists auth;

create table if not exists auth.users (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  -- bcrypt hash. Hashes copied from the old hosted auth are bcrypt too, so
  -- existing passwords keep working.
  encrypted_password text,
  raw_user_meta_data jsonb not null default '{}'::jsonb,
  last_sign_in_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists users_email_key on auth.users (lower(email));

create table if not exists auth.sessions (
  -- sha256 of the cookie token; the token itself is never stored.
  id text primary key,
  user_id uuid not null references auth.users on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);
create index if not exists sessions_user_idx on auth.sessions (user_id);

create table if not exists auth.password_resets (
  id text primary key, -- sha256 of the emailed token
  user_id uuid not null references auth.users on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  used_at timestamptz
);

-- The current request's user, or null. Policies call this.
create or replace function auth.uid() returns uuid
language sql stable as
$$ select nullif(current_setting('app.user_id', true), '')::uuid $$;

grant usage on schema auth to anon, authenticated;
grant execute on function auth.uid() to anon, authenticated;

-- Like the old hosted setup: both request roles get table privileges and RLS
-- decides which rows they actually see. Tables without a policy for a role
-- return nothing to it.
grant usage on schema public to anon, authenticated;
alter default privileges in schema public
  grant select, insert, update, delete on tables to anon, authenticated;
alter default privileges in schema public
  grant execute on functions to anon, authenticated;
