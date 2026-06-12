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

## Phase 1 — Foundation ✅

- [x] Next.js 16 App Router scaffold with Turbopack
- [x] shadcn/ui (new-york), Drizzle ORM, Supabase Auth, `@supabase/ssr`
- [x] `src/db/schema.ts` — 13 tables + enums
- [x] `drizzle-kit push` via Session Pooler (port 5432, `ssl: require`)
- [x] Google OAuth via Supabase Auth
- [x] `src/proxy.ts` (Next.js 16 middleware rename) — auth guard, public paths
- [x] Dark violet "Tech Wizard" theme in `globals.css` — Tailwind v4 `@theme inline` with `hsl()` wrappers
- [x] App shell: sidebar nav, realm-scoped layout
- [x] Onboarding: create Realm → add first Property
- [x] `.env.example` with all vars

---

## Phase 2 — Data Management (CRUD) ✅

- [x] **Properties**: list in settings, add/remove, URL validation
- [x] **Keywords**: table with frequency inline-select, group sidebar, add/edit/delete
  - Add keyword: term, frequency, property chips, location combobox (grouped: Locations / US States)
  - Edit keyword: same form pre-populated, replaces property-location assignments
  - US States: 51 locations seeded (`npm run db:seed:states`)
- [x] **Search Locations**: 15 country/region + 51 US states, grouped combobox with search
- [x] **Groups**: create/delete groups, filter keywords by group

---

## Phase 3 — SERP Integration & Scheduling ✅

- [x] `src/lib/serp.ts` — SerpAPI wrapper, URL prefix matching, `computeNextCheckAt`
- [x] `GET /api/cron/check-rankings` — Vercel Cron, `Authorization: Bearer CRON_SECRET`, LIMIT 50
- [x] `POST /api/serp/check-now` — marks keyword due immediately
- [x] `vercel.json` cron: `*/30 * * * *`
- [x] `serp_batches` tracking: pending → running → done/failed
- [x] Rankings upsert: `ON CONFLICT (keyword_id, property_id, location_id, date) DO UPDATE`
- [x] DB connection: Transaction Pooler (port 6543, `prepare: false`) for app; Session Pooler for drizzle-kit
- [x] `/api/cron` added to public paths in proxy.ts

---

## Phase 4 — Rankings & Dashboard ✅

- [x] `src/features/rankings/queries.ts`: `getRankingsWithDelta`, `computeDashboardStats`, `computeTopMovers`, `getPositionHistory`, `getRecentActivity`
- [x] **Rankings page**: filter by property + keyword search + 14d/30d toggle; table with current/prev position + delta badges; click row → position history chart (Recharts, inverted Y-axis)
- [x] **Dashboard**: 4 stat cards (keywords, avg position, top 3%, top 10%); top movers grid (rising/dropping); recent SERP batch activity feed
- [x] Recharts `LineChart` with `reversed` Y-axis, violet color, null-gap handling

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

## Phase 7 — Live Public Board

A fullscreen, public TV dashboard — share a URL, open on any screen, auto-rotating slides with live rank data. No auth required.

### URL
`/board/[token]` — publicly accessible, token stored in `report_tokens` with `config.type = "board"`

### Slides (auto-advance every 8s)
1. **Overview** — 4 hero stat cards: keywords tracked · avg position · % top 3 · % top 10
2. **Top Ranked** — up to 10 keywords with position ≤ 20, large rank-number display
3. **7-Day Trend** — Recharts AreaChart showing best position per day for one keyword; cycles one keyword per full board rotation; best/worst day annotated; keyword counter shown (e.g. "3 / 12")
4. **Rising** — biggest positive delta in last 7 days, green arrows
5. **Dropping** — biggest negative delta (only shown if data exists), red arrows

### UI / Design
- Full viewport, dark `#0D0B14` background with subtle animated violet gradient pulse
- Header: property name · pulsing `LIVE` badge · current time · fullscreen button
- Per-slide progress bar at bottom
- Fade + translateY transition between slides
- Slide indicator dots
- `Powered by Merlin` watermark bottom-right
- Large `Geist Mono` position numbers (hero data point)
- Auto-refresh: `export const revalidate = 1800` + client `router.refresh()` every 30 min (cost-efficient)

### Board creation
- Dashboard header → **Live Board** button (client component)
- Dialog: property selector + generated URL + copy-link button
- Server action `getOrCreateBoard(propertyId)` — idempotent, reuses existing token

### Files
```
src/features/boards/
  actions.ts          getOrCreateBoard — creates/fetches report_token with type:"board"
  queries.ts          getBoardConfig, getBoardData
  components/
    live-board-button.tsx   dashboard button + dialog
src/app/board/[token]/
  page.tsx            public server component, revalidate=30
  board-client.tsx    carousel, progress bar, clock, fullscreen, refresh
```

**Done when:** shareable URL opens full-screen TV board with live rotating slides, 7-day trend chart, and 30-min auto-refresh. ✅

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
