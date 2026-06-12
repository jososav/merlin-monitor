# Merlin — SEO Rank Intelligence

Dark-mode SEO rank tracking platform. Track Google positions for keywords across properties, visualize history, and display live rankings on any screen.

**Stack:** Next.js 16 · Supabase (PostgreSQL) · Drizzle ORM · shadcn/ui · Recharts · Vercel Cron

---

## Features

| Feature | Description |
|---------|-------------|
| **Realms** | Multi-tenant workspaces — all data is scoped per Realm |
| **Properties** | Track multiple websites per Realm |
| **Keywords** | Add/edit/delete keywords with frequency, group, property, and location assignments |
| **Locations** | 15 country/region locations + 51 US states (searchable, grouped) |
| **SERP Checks** | SerpAPI integration — auto-checked on Vercel Cron (every 30 min) |
| **Rankings** | Position history table with current/prev position + delta badges |
| **Position Chart** | Click any ranking row → inverted Y-axis line chart (Recharts) |
| **Dashboard** | Stat cards, top movers, recent activity feed |
| **Live Board** | Public fullscreen TV dashboard — auto-rotating slides, no login needed |

---

## Live Board

Dashboard → **Live Board** button → select property → copy URL → open on any TV or screen.

- Auto-rotates: Overview stats → Top Ranked → 7-Day Trend chart → Rising → Dropping
- Trend slide cycles one keyword per board rotation, showing best/worst positions annotated
- Refreshes data every 30 minutes (Next.js ISR + client router.refresh)
- Fullscreen button built-in
- No authentication required

---

## Setup

### 1. Install

```bash
npm install
```

### 2. Environment variables

Copy `.env.example` to `.env.local` and fill in:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Transaction Pooler (port 6543) — app runtime
DATABASE_URL=postgresql://postgres.ref:password@aws-0-us-east-1.pooler.supabase.com:6543/postgres

# Session Pooler (port 5432) — drizzle-kit migrations only
DIRECT_URL=postgresql://postgres.ref:password@aws-0-us-east-1.pooler.supabase.com:5432/postgres

SERP_API_KEY=        # from serpapi.com
RESEND_API_KEY=      # from resend.com (for alerts — Phase 5)
CRON_SECRET=         # any random string, e.g. openssl rand -hex 32
```

### 3. Push schema

```bash
npx drizzle-kit push
```

### 4. Seed locations

```bash
npm run db:seed          # country/region locations
npm run db:seed:states   # 51 US states (run once)
```

### 5. Dev server

```bash
npm run dev
```

---

## Cron (local testing)

Trigger a ranking check manually:

```bash
curl -H "Authorization: Bearer <CRON_SECRET>" http://localhost:3000/api/cron/check-rankings
```

---

## Project structure

```
src/
  app/
    (app)/          Authenticated routes (dashboard, keywords, rankings, settings)
    board/[token]/  Public live board — no auth
    api/cron/       Vercel Cron endpoints
    api/serp/       On-demand SERP check
  features/
    keywords/       Add/edit/delete keywords, groups, frequency
    properties/     Property management
    rankings/       Rankings table, charts, dashboard stats
    boards/         Live board generation and public display
    realms/         Onboarding, realm creation
  db/
    schema.ts       All 13 Drizzle tables
    relations.ts    Drizzle relations
    seed-locations.ts
    seed-us-states.ts
  lib/
    auth.ts         requireUser, requireRealm helpers
    serp.ts         SerpAPI wrapper + computeNextCheckAt
```

---

## Vocabulary

| Term | Meaning |
|------|---------|
| **Realm** | Tenant workspace (never "organization") |
| **Property** | Tracked website (never "domain" or "site") |
| **Keyword** | Search term monitored for one or more Properties |
| **Ranking** | Position snapshot: keyword × property × location × date |

---

## Deploy

1. Push to GitHub
2. Import in Vercel → set all env vars
3. Vercel reads `vercel.json` and schedules the cron automatically (`*/30 * * * *`)
