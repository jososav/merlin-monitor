# Merlin — Claude Instructions

SEO rank intelligence platform. Next.js 16, Supabase (PostgreSQL), Drizzle, shadcn/ui, Vercel.

## Key Concepts

| Term | Meaning |
|------|---------|
| **Realm** | Tenant workspace. All data is scoped to a Realm. Equivalent to "organization" or "team" in other SaaS tools. |
| **Property** | A tracked website (e.g. `example.com`). Belongs to a Realm. Equivalent to "domain" or "site". |
| **Keyword** | A search term monitored for one or more Properties. |
| **Ranking** | A position snapshot: keyword × property × location × date. |

Never use "organization", "domain", or "site" in code or UI — always use Realm / Property.

## Architecture Principles

This is a growing SEO platform. Architecture must support adding new SEO modules (audits, backlinks, GSC integration, etc.) without touching existing features.

### Feature-based structure — strictly enforced

```
src/features/<feature-name>/
  components/     UI components scoped to this feature
  actions.ts      Server Actions (all mutations live here)
  queries.ts      DB read functions (called from Server Components)
  types.ts        Feature-local types (if needed)
```

App Router pages in `src/app/` are thin shells — they import from `src/features/`, never contain business logic directly.

### Mutations → Server Actions, not API routes

Use Next.js Server Actions (`'use server'`) for all data mutations (create, update, delete). Reserve API routes (`src/app/api/`) for:
- Vercel Cron endpoints
- Webhooks (inbound)
- Public/shareable endpoints (e.g. report tokens)

### Queries → Server Components

Fetch data in Server Components using functions from `feature/queries.ts`. Pass data down as props. Use `'use client'` only when interactivity or browser APIs are required.

### DB access rules

- Always filter by `realm_id` in every query — never return cross-realm data
- Supabase RLS is the safety net, but app-layer filtering is required too
- One ranking row per `(keyword_id, property_id, location_id, date)` — upsert on conflict
- `next_check_at` drives cron scheduling: `WHERE next_check_at <= now() ORDER BY next_check_at LIMIT 50`
- Never write raw SQL — use Drizzle query builder

### Cron / Scheduling

All scheduling lives in `src/app/api/cron/`. No external job queues, no paid services (no Upstash, no Firebase Cloud Functions). Vercel Cron is the only scheduler. Each cron endpoint is secured with `Authorization: Bearer <CRON_SECRET>`.

## Key Files

- `PLAN.md` — phased implementation plan, source of truth for what to build next
- `src/db/schema.ts` — Drizzle schema, all tables
- `src/lib/serp.ts` — SerpAPI client wrapper
- `src/app/api/cron/` — Vercel Cron endpoints
- `src/features/` — all product features

## Branch

Default branch: `main`

## Tech Stack Notes

- **Next.js 16 App Router** — Server Components by default, Client Components only when necessary
- **Drizzle ORM** — never raw SQL; always Drizzle query builder
- **Supabase Auth** — use `@supabase/ssr` for server-side auth; never expose service role key to client
- **shadcn/ui** — add components via `npx shadcn@latest add <component>`, never copy-paste
- **TypeScript** — no `any` types; infer types from Drizzle schema using `typeof schema.$inferSelect`

## UI Design — "Tech Wizard"

Dark mode only. No light mode.

| Token | Value |
|-------|-------|
| Background | `#0D0B14` |
| Surface (cards) | `#13101F`, `#1A1628` |
| Primary accent | `#7C3AED` (electric violet) |
| Secondary accent | `#06B6D4` (cyan) |
| Rank up | `#10B981` (emerald) + subtle glow |
| Rank down | `#F43F5E` (rose) + subtle glow |
| Muted text | `#94A3B8` |

- shadcn/ui style: `new-york`, base color: `violet`
- Rank position numbers: `Geist Mono` (monospace) — they are the hero data point
- Glow/halo on primary buttons and active nav items
- Gradient borders on cards: `linear-gradient(135deg, #7C3AED22, #06B6D422)`
- Empty states use wizard-flavored copy ("No keywords yet. Cast your first spell.")

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
SUPABASE_SERVICE_ROLE_KEY
DATABASE_URL
SERP_API_KEY
RESEND_API_KEY
CRON_SECRET
```

## Do Not

- Use "organization", "domain", or "site" — always Realm / Property
- Add Upstash, Firebase, or any paid scheduling service
- Use `any` in TypeScript
- Write raw SQL
- Add light mode styles
- Put business logic directly in `src/app/` route files
- Use API routes for CRUD mutations (use Server Actions)
