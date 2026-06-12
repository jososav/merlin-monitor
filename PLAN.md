# Merlin — Implementation Plan

SEO rank intelligence platform. Track Google positions for keywords across Properties, visualize rank history, monitor competitors.

**Core vocabulary:** Realm (tenant) → Properties (websites) → Keywords → Rankings

---

## Stack

| Layer | Tech | Why |
|-------|------|-----|
| Framework | Next.js 15 (App Router) | SSR, Server Actions, Vercel Cron, great DX |
| Database | Supabase (PostgreSQL) | Relational data, SQL aggregations for time-series rankings |
| ORM | Drizzle | Type-safe, lightweight, infers TS types from schema |
| Auth | Supabase Auth (Google OAuth) | Same provider as DB, no extra dep |
| SERP API | SerpAPI | Established provider, good location support |
| Scheduling | Vercel Cron (free, built-in) | No paid services, native Vercel support |
| UI | shadcn/ui + Tailwind CSS | Accessible, customizable, dark mode ready |
| Charts | Recharts | Flexible, composable |
| Email | Resend | Simple API, great DX for transactional email |
| Hosting | Vercel | Native Next.js support |

---

## Architecture

### Feature-based folder structure

```
src/
  features/               One folder per product feature
    rankings/
      components/
      actions.ts          Server Actions (mutations)
      queries.ts          DB reads (called from Server Components)
    keywords/
    properties/
    realms/
    competitors/
    import/
    reports/
    alerts/
  app/                    Thin route shells only — no business logic
    api/cron/             Vercel Cron endpoints
    (auth)/login/
    dashboard/
    keywords/
    rankings/
    competitors/
    import/
    reports/[token]/
    settings/
  components/             Shared UI (layout, charts, data-table, etc.)
  db/
    schema.ts
    index.ts
  lib/
    serp.ts
    auth.ts
    utils.ts
```

### Mutation pattern
All data mutations → Server Actions in `feature/actions.ts`. API routes only for cron, webhooks, public endpoints.

### Query pattern
Server Components call `feature/queries.ts` directly. No client-side data fetching for initial renders.

### Multi-tenancy
Every table has `realm_id`. Every query filters by `realm_id`. Supabase RLS enforces this at DB level as a safety net.

---

## Data Model

```sql
-- Tenancy
realms
  id, name, slug, created_at

realm_members
  id, realm_id (FK), user_id (FK), role (owner|admin|member), created_at

-- Core SEO entities
properties
  id, realm_id (FK), url, display_name, created_at

keywords
  id, realm_id (FK), term,
  check_frequency (1h|2h|6h|12h|24h),
  next_check_at,
  last_checked_at,
  created_at

keyword_groups
  id, realm_id (FK), name

keyword_group_members
  keyword_id (FK), group_id (FK)

-- keyword → property → location is the unit of tracking
keyword_property_locations
  id, keyword_id (FK), property_id (FK), location_id (FK),
  is_active (bool)

search_locations
  id, name, serp_api_value, country_code, language_code

-- Time-series ranking data (main table — will grow large)
rankings
  id, keyword_id (FK), property_id (FK), location_id (FK),
  position (int, nullable — null = not found in results),
  url, title,
  date (date),
  checked_at (timestamptz)
  UNIQUE (keyword_id, property_id, location_id, date)  -- upsert target

-- Job queue (SERP batch runs)
serp_batches
  id, keyword_id (FK), property_id (FK), location_id (FK),
  status (pending|running|done|failed),
  scheduled_at, started_at, completed_at, error

-- Competitor tracking
competitors
  id, property_id (FK), competitor_url, created_at

-- Alerts
alert_rules
  id, realm_id (FK), keyword_id (FK), property_id (FK),
  threshold (int),
  direction (up|down|both),
  channel (email),
  target (email address),
  is_active (bool)

-- Shareable reports
report_tokens
  id, realm_id (FK), token (unique),
  config (jsonb — which property/keywords/date range),
  expires_at (nullable),
  created_at
```

**Rankings table scale note:** Index on `(keyword_id, property_id, location_id, date DESC)` and `(realm_id, date DESC)`. Partition by month if volume grows.

---

## Pages / Routes

```
/                         → redirect to /dashboard (authed) or /login
/login                    → Google OAuth via Supabase
/onboarding               → create Realm + first Property after signup
/dashboard                → Realm overview: top movers, avg position, recent activity
/keywords                 → keyword list, groups, add/edit/delete, frequency, locations
/rankings                 → position history table + charts, filter by property/keyword/date
/competitors              → competitor domains, gap analysis
/import                   → CSV import with column mapping + preview
/settings                 → Realm settings, members, Properties management
/reports/[token]          → public read-only shareable report
```

---

## Phase 1 — Foundation

- [ ] `npx create-next-app@latest . --typescript --tailwind --app --src-dir`
- [ ] Install: `shadcn/ui` (new-york, violet), `drizzle-orm`, `drizzle-kit`, `@supabase/supabase-js`, `@supabase/ssr`
- [ ] `src/db/schema.ts` — all tables above
- [ ] `drizzle-kit push` → apply schema to Supabase
- [ ] Supabase Auth with Google OAuth configured
- [ ] Middleware: protect all routes except `/login` and `/reports/[token]`
- [ ] `globals.css` — dark violet theme vars (bg `#0D0B14`, primary `#7C3AED`, cyan `#06B6D4`)
- [ ] App shell: sidebar nav + realm switcher header
- [ ] Onboarding flow: create Realm → add first Property
- [ ] `.env.example` with all required vars

**Done when:** can sign in with Google, complete onboarding, see empty dashboard.

---

## Phase 2 — Data Management (CRUD)

- [ ] **Properties** (`src/features/properties/`):
  - List in settings, add/remove
  - Display name + URL validation
- [ ] **Keywords** (`src/features/keywords/`):
  - Table: keyword | frequency | locations | group | last checked | actions
  - Add keyword modal: term + frequency + property assignments + locations + group
  - Edit / delete / bulk actions
  - Group sidebar (All Keywords + group chips)
- [ ] **Search Locations**: pre-seeded from SerpAPI canonical list, searchable combobox
- [ ] **Competitors** (`src/features/competitors/`): add competitor URLs per Property
- [ ] **Realm Members** (`src/features/realms/`): invite by email, assign roles

**Done when:** can add a keyword with locations, frequency, and group assignment.

---

## Phase 3 — SERP Integration & Scheduling

- [ ] `src/lib/serp.ts` — SerpAPI wrapper
  - `checkKeyword({ term, location, propertyUrl })` → `{ position, url, title } | null`
- [ ] `src/app/api/cron/check-rankings/route.ts` — Vercel Cron (GET, secured with `CRON_SECRET`)
  - Query: `keyword_property_locations` JOIN `keywords` WHERE `next_check_at <= now()` LIMIT 50
  - Run SerpAPI calls, upsert to `rankings`
  - Update `last_checked_at`, compute `next_check_at = now() + check_frequency`
  - Mark batch status in `serp_batches`
- [ ] `vercel.json` cron: `*/30 * * * *`
- [ ] `POST /api/serp/check-now` — marks keyword due immediately for next cron tick
- [ ] Status indicator in keywords table: idle / pending / running / last checked timestamp

**Done when:** keyword check runs end-to-end, ranking row appears in DB.

---

## Phase 4 — Rankings & Dashboard

- [ ] **Rankings page** (`src/features/rankings/`):
  - Filter bar: property, keyword, location, date range (14d / 30d / custom)
  - Table: keyword | current position | prev position | Δ change (colored arrow) | URL | last checked
  - Expandable row → sparkline of position history
- [ ] **Rankings chart**:
  - Line chart: position over time, inverted Y-axis (1 = top)
  - Toggle multiple keywords on same chart
  - Area chart: position bucket distribution (1, 2–3, 4–5, 6–7, 8–10, >10)
  - 14d / 30d / custom range toggle
- [ ] **Dashboard** (`src/features/rankings/`):
  - Summary cards: keywords tracked, avg position, % in top 3, % in top 10
  - Top movers: biggest Δ in last 24h (up and down)
  - Recent SERP batch activity feed

**Done when:** after a few checks, dashboard shows real data, charts render with history.

---

## Phase 5 — Import, Alerts, Reports

- [ ] **CSV Import** (`src/features/import/`):
  - Drag & drop zone (PapaParse)
  - Column mapping UI (keyword col, property col, location col)
  - Preview table with validation errors highlighted
  - Confirm → bulk upsert keywords, trigger initial checks
- [ ] **Rank change alerts** (`src/features/alerts/`):
  - Alert rule form: keyword + property + threshold + direction + email
  - Cron post-check hook: compare new ranking to previous → send email via Resend if threshold crossed
- [ ] **Shareable reports** (`src/features/reports/`):
  - Generate signed token for a property/keyword/date-range view
  - Public `/reports/[token]` page: charts + table, no auth
  - Expiry: 7d / 30d / never

**Done when:** CSV import works, alert fires on rank drop, shareable link renders publicly.

---

## Phase 6 — Polish & Deploy

- [ ] Mobile responsive (sidebar → bottom nav on mobile)
- [ ] Loading skeletons on all data-heavy pages
- [ ] Error boundaries with wizard-flavored empty states
- [ ] `vercel.json` finalized with cron config
- [ ] Supabase RLS policies verified end-to-end
- [ ] Deploy to Vercel, connect Supabase prod project
- [ ] Smoke test all cron + alert paths in prod

**Done when:** deployed, all features work in production.

---

## Future Modules (post-MVP)

These are not planned yet — listed to inform architectural decisions today.

| Module | What it adds |
|--------|-------------|
| **GSC Integration** | Pull real clicks/impressions from Google Search Console per property |
| **GA4 Integration** | Correlate rank changes with traffic changes |
| **Site Audit** | Crawl properties for technical SEO issues |
| **Backlink Monitor** | Track backlink count/quality changes over time |
| **SERP Features** | Track featured snippets, PAA boxes, local pack presence |
| **Content Gap** | Keywords competitors rank for that you don't |
| **API Access** | Programmatic access to rankings data (API keys per Realm) |
| **White-label Reports** | Custom domain + logo for agency client reports |
| **Billing / Plans** | Usage limits per plan tier (keywords, check frequency, history retention) |
| **Notifications** | Slack / webhook channels for alerts in addition to email |

---

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SERP_API_KEY=
RESEND_API_KEY=
CRON_SECRET=
```

---

## Key Technical Notes

- **Y-axis inversion**: position 1 = best. All charts invert Y-axis so moving up visually = better rank.
- **Upsert rankings**: `INSERT ... ON CONFLICT (keyword_id, property_id, location_id, date) DO UPDATE` — one row per day per combination.
- **Cron batch size**: process 50 due keywords per cron tick to stay within Vercel function timeout (10s Hobby / 60s Pro). Staggered frequencies mean not everything runs at once.
- **null position**: if a keyword doesn't appear in top 100 results, store `position = null`, not 0 or 101. Query as `IS NULL` for "not found" state.
- **Realm isolation**: every Drizzle query includes `.where(eq(table.realmId, realmId))`. RLS is backup, not primary guard.
- **next_check_at**: computed as `last_checked_at + interval`. Cron queries `WHERE next_check_at <= now()`. New keywords get `next_check_at = now()` so they run on first cron tick.
