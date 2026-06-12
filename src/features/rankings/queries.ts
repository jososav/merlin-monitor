import { db } from "@/db"
import { rankings, keywords, properties, searchLocations, serpBatches } from "@/db/schema"
import { eq, desc, gte, and } from "drizzle-orm"

// ─── Shared Types ─────────────────────────────────────────────────────────────

export interface RankingRow {
  keywordId: string
  propertyId: string
  locationId: string
  term: string
  propertyName: string
  locationName: string
  currentPosition: number | null
  previousPosition: number | null
  /** positive = improved (rank number went down), negative = dropped */
  delta: number | null
  url: string | null
  checkedAt: Date
  date: string
}

export interface DashboardStats {
  keywordCount: number
  avgPosition: number | null
  top3Pct: number
  top10Pct: number
  totalTracked: number
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function getRankingsWithDelta(
  realmId: string,
  days: number = 30
): Promise<RankingRow[]> {
  const since = new Date()
  since.setDate(since.getDate() - days)
  const sinceStr = since.toISOString().split("T")[0]

  const rows = await db
    .select({
      keywordId: rankings.keywordId,
      propertyId: rankings.propertyId,
      locationId: rankings.locationId,
      position: rankings.position,
      url: rankings.url,
      date: rankings.date,
      checkedAt: rankings.checkedAt,
      term: keywords.term,
      propertyName: properties.displayName,
      locationName: searchLocations.name,
    })
    .from(rankings)
    .innerJoin(keywords, eq(rankings.keywordId, keywords.id))
    .innerJoin(properties, eq(rankings.propertyId, properties.id))
    .innerJoin(searchLocations, eq(rankings.locationId, searchLocations.id))
    .where(and(eq(keywords.realmId, realmId), gte(rankings.date, sinceStr)))
    .orderBy(desc(rankings.date))

  // Group by composite key, take two most recent per combination
  const grouped = new Map<string, typeof rows>()
  for (const row of rows) {
    const key = `${row.keywordId}:${row.propertyId}:${row.locationId}`
    const group = grouped.get(key) ?? []
    if (group.length < 2) {
      group.push(row)
      grouped.set(key, group)
    }
  }

  return Array.from(grouped.values()).map(([current, previous]) => ({
    keywordId: current.keywordId,
    propertyId: current.propertyId,
    locationId: current.locationId,
    term: current.term,
    propertyName: current.propertyName,
    locationName: current.locationName,
    currentPosition: current.position,
    previousPosition: previous?.position ?? null,
    delta:
      current.position != null && previous?.position != null
        ? previous.position - current.position
        : null,
    url: current.url,
    checkedAt: current.checkedAt,
    date: current.date,
  }))
}

export function computeDashboardStats(rows: RankingRow[]): DashboardStats {
  const positions = rows.map((r) => r.currentPosition)
  const nonNull = positions.filter((p): p is number => p !== null)

  return {
    keywordCount: new Set(rows.map((r) => r.keywordId)).size,
    avgPosition: nonNull.length
      ? Math.round((nonNull.reduce((a, b) => a + b, 0) / nonNull.length) * 10) / 10
      : null,
    top3Pct: positions.length
      ? Math.round((positions.filter((p) => p !== null && p <= 3).length / positions.length) * 100)
      : 0,
    top10Pct: positions.length
      ? Math.round((positions.filter((p) => p !== null && p <= 10).length / positions.length) * 100)
      : 0,
    totalTracked: positions.length,
  }
}

export function computeTopMovers(
  rows: RankingRow[],
  limit: number = 5
): { improved: RankingRow[]; dropped: RankingRow[] } {
  const withDelta = rows.filter((r) => r.delta !== null)
  return {
    improved: withDelta
      .filter((r) => r.delta! > 0)
      .sort((a, b) => b.delta! - a.delta!)
      .slice(0, limit),
    dropped: withDelta
      .filter((r) => r.delta! < 0)
      .sort((a, b) => a.delta! - b.delta!)
      .slice(0, limit),
  }
}

export async function getPositionHistory(
  keywordId: string,
  propertyId: string,
  locationId: string,
  days: number = 30
): Promise<{ date: string; position: number | null }[]> {
  const since = new Date()
  since.setDate(since.getDate() - days)
  const sinceStr = since.toISOString().split("T")[0]

  return db
    .select({ date: rankings.date, position: rankings.position })
    .from(rankings)
    .where(
      and(
        eq(rankings.keywordId, keywordId),
        eq(rankings.propertyId, propertyId),
        eq(rankings.locationId, locationId),
        gte(rankings.date, sinceStr)
      )
    )
    .orderBy(rankings.date)
}

export interface ActivityItem {
  id: string
  status: string
  completedAt: Date | null
  error: string | null
  term: string
  displayName: string
}

export async function getRecentActivity(
  realmId: string,
  limit: number = 10
): Promise<ActivityItem[]> {
  const rows = await db
    .select({
      id: serpBatches.id,
      status: serpBatches.status,
      completedAt: serpBatches.completedAt,
      error: serpBatches.error,
      term: keywords.term,
      displayName: properties.displayName,
    })
    .from(serpBatches)
    .innerJoin(keywords, eq(serpBatches.keywordId, keywords.id))
    .innerJoin(properties, eq(serpBatches.propertyId, properties.id))
    .where(eq(keywords.realmId, realmId))
    .orderBy(desc(serpBatches.completedAt))
    .limit(limit)

  return rows
}
