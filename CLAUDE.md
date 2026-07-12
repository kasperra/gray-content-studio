# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Gray Content Studio — a video production company's website **and** agency operating system in one Next.js app. The public marketing site generates leads; a passcode-free, auth-gated `/admin` runs the studio (CRM, proposals, projects, invoices, assets, social, analytics); and `/portal` gives each client an isolated view of their projects, deliverables, files, and numbers. Built in phases; all six roadmap phases plus a pricing→intake integration are shipped and live on Vercel.

## Commands

```bash
npm run dev      # dev server on :3000 (used by .claude/launch.json preview)
npm run build    # production build — RUN THIS before committing; it type-checks all routes
npm run lint     # eslint (flat config, eslint-config-next)
```

There is **no test suite**. Verification is done by building (`npm run build` catches all type errors) and by driving the running app in a browser against the real Supabase project. When verifying features that touch the database, seed data via the Supabase REST API with the service-role key, exercise the UI, assert against the DB, then delete the test rows.

## Stack & non-obvious conventions

- **Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS v4.** No `tailwind.config.js` — the entire design system lives in `@theme { … }` inside `src/app/globals.css` (colors like `--color-bg`, `--color-accent`, fonts, and keyframe animations). Use semantic Tailwind classes (`bg-bg`, `text-accent`, `border-rule`) rather than hex values.
- **Middleware is `src/proxy.ts`, not `middleware.ts`.** Next 16 renamed the convention; the file exports `default async function proxy` and its `config.matcher` gates `/admin`, `/portal`, `/review`, and `/login`. Add any new authed route prefix to **both** `PROTECTED_PREFIXES` and `config.matcher`.
- **Fonts:** Fraunces (display) + Inter (body) via `next/font` in `src/app/layout.tsx`. Fraunces must use `weight: "variable"` (it's a variable font with the `opsz` axis) — a numeric weight breaks the build.
- **Design language:** cinematic dark editorial — near-black `#0b0b0c`, off-white text, single warm gold accent `#d4a24e`, Fraunces headlines. Preserve this when adding UI.

## Architecture

### Route groups (`src/app`)
- `(public)/` — marketing site: home (`page.tsx`), `/work` + `/work/[slug]` case studies, `/industries/[slug]`, `/pricing`, `/process`, `/blog` + `/blog/[slug]`, `/faq`. Mostly static/SSG with JSON-LD structured data. Shares a Nav+Footer layout.
- `(admin)/admin/` — studio OS, admin-role only. Its `layout.tsx` calls `requireAdmin()` and renders the tab bar. Subroutes: dashboard (leads + computed follow-ups), `crm`, `clients` + `clients/[id]`, `proposals` + `proposals/new`, `invoices`, `assets`, `social`, `templates`, `analytics`, `projects/[id]`.
- `(portal)/portal/` — client-facing dashboard, any authed user. Projects, `projects/[id]`, `assets`, `social`. Read-mostly mirror of the admin data the client owns.
- `/review/[deliverableId]` — shared video review room used by **both** roles (HTML5 player, timestamped comments, versions, approve/request-changes).
- `/p/[id]` — public, unguessable proposal page a prospect opens without logging in (print-to-PDF). Fetched by `public_id` via the **service-role** client because proposals aren't publicly readable under RLS.
- `/login` — email/password auth; redirects admins to `/admin`, clients to `/portal`.

### Business logic: `src/modules/<domain>/`
Each domain (`leads`, `proposals`, `clients`, `projects`, `crm`, `assets`, `social`, `pricing`, `review`) owns its server actions and pure logic, imported by the route components. Key patterns:
- **Server Actions** (`"use server"`) are the primary write path — not API routes. A `"use server"` file may export **only async functions**; put shared sync helpers/types in a sibling non-action file (e.g. `pricing/data.ts`, `pricing/compute.ts`, `assets/kinds.ts`, `social/platforms.ts`).
- **`src/modules/pricing/`** is the canonical rate card (86 services, ported from `Pricing strategy.xlsx`). `computeEstimate()` in `compute.ts` is a **pure, server-trusted** totals function — always recompute estimates/proposals server-side rather than trusting client-sent numbers. `EstimateBuilder.tsx` is the shared calculator UI used by both the public `/pricing` page and the admin proposal builder.

### Supabase (`src/lib/`)
- `lib/supabase/server.ts` exposes three clients: `createSupabaseServer()` (cookie-scoped, respects the logged-in user's RLS), `createSupabaseAdmin()` (**service-role, bypasses RLS** — server-only; used for lead inserts, public proposal reads, cross-client name lookups, and privileged writes clients can't do themselves), and `supabaseConfigured()` (env guard — the app degrades gracefully to a "portal not connected" state when keys are absent).
- `lib/supabase/client.ts` — browser client for auth and Storage signed-URL/upload calls made from Client Components.
- `lib/auth.ts` — `requireUser()` / `requireAdmin()` do the session+profile lookup and redirect; call them at the top of every protected server component.
- `lib/storage.ts` — client-side helpers. **All uploads go under a `<client_id>/…` path prefix** because the Storage RLS policies key off the first path segment; never break that convention or clients lose access to their own files.

### Data model & security
- One migration dir: `supabase/migrations/`. `0001_init.sql` creates the full schema (17 tables across identity/CRM/sales/production/review/assets/social/analytics), all RLS policies, three private Storage buckets (`deliverables`, `assets`, `documents`), and triggers (auto-create `profiles` on signup, `updated_at` touch). Later numbered files are incremental `alter`s. **Migrations are applied by hand in the Supabase SQL editor**, not by a CLI — server actions that use a newly-added column should tolerate its absence (see the estimate-column fallback in `modules/leads/actions.ts`).
- **RLS is the security boundary.** The universal pattern: admins (`profiles.role = 'admin'`) see everything; clients see only rows where `client_id` matches their profile, enforced by the `auth_role()` / `auth_client_id()` SQL helper functions. When adding a table, add matching policies or clients will be locked out (or worse, over-exposed).
- **Roles:** `profiles.role` is `admin` or `client`, with `client_id` linking a client login to its `clients` row. New client logins are provisioned admin-side via `createSupabaseAdmin().auth.admin.createUser()` (returns a one-time temp password to share).

## Data flow worth knowing

- **Lead capture is dual-channel.** The public contact form's server action (`modules/leads/actions.ts`) writes a `leads` row (CRM) **and** POSTs to a hardcoded Formspree endpoint (email notification) — either succeeding counts as success, so the form never silently drops an inquiry.
- **Pricing → intake → proposal is one connected pipeline.** The `/pricing` calculator stashes a draft estimate in `sessionStorage` (`modules/pricing/estimate-link.ts`), the contact form attaches it (recomputed server-side into `leads.estimate` jsonb), the CRM board shows an `est. $X` chip, and "Proposal from estimate →" preloads the proposal builder with the visitor's exact selections. Touching any link in this chain means checking the others.

## Deploying

Push to `main` → Vercel auto-builds and deploys. Environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SITE_URL`) live in Vercel project settings **and** local `.env.local` (git-ignored; `.env.example` documents them). Env-var changes only take effect on builds created *after* they're saved — redeploy after editing them. The Vercel project's Framework Preset must be **Next.js**.

## Explicitly out of scope (flagged, not built)

Per the project's cost guardrails (free tiers only, no paid APIs/AI/realtime): outbound email automation, e-signatures, Stripe/payments, social-publishing APIs, and video transcoding are intentionally **not** implemented. The schema and module boundaries accommodate them, but do not add them without the user's explicit approval. Follow-up "reminders" and analytics are computed/in-app only — there is no email side effect.
