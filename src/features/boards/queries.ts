import { db } from "@/db"
import { reportTokens, rankings, keywords, searchLocations } from "@/db/schema"
import { eq, gte, and, desc } from "drizzle-orm"

export interface BoardConfig {
  type: "board"
  propertyId: string
  propertyName: string
  realmName: string
}

export interface BoardRankingRow {
  keywordId: string
  term: string
  locationName: string
  currentPosition: number | null
  previousPosition: number | null
  delta: number | null
}

export interface KeywordHistory {
  keywordId: string
  term: string
  points: { date: string; position: number | null }[]
}

export interface BoardData {
  stats: {
    keywordCount: number
    avgPosition: number | null
    top3Pct: number
    top10Pct: number
    totalTracked: number
  }
  topRanked: BoardRankingRow[]
  rising: BoardRankingRow[]
  dropping: BoardRankingRow[]
  /** Per-keyword 7-day history — best position per day across all locations */
  keywordHistories: KeywordHistory[]
}

export async function getBoardConfig(token: string): Promise<BoardConfig | null> {
  const [row] = await db
    .select()
    .from(reportTokens)
    .where(eq(reportTokens.token, token))

  if (!row) return null
  if (row.expiresAt && row.expiresAt < new Date()) return null

  try {
    const config = JSON.parse(row.config) as BoardConfig
    if (config.type !== "board") return null
    return config
  } catch {
    return null
  }
}

export async function getBoardData(propertyId: string): Promise<BoardData> {
  const since = new Date()
  since.setDate(since.getDate() - 7)
  const sinceStr = since.toISOString().split("T")[0]

  const rows = await db
    .select({
      keywordId: rankings.keywordId,
      locationId: rankings.locationId,
      position: rankings.position,
      date: rankings.date,
      term: keywords.term,
      locationName: searchLocations.name,
    })
    .from(rankings)
    .innerJoin(keywords, eq(rankings.keywordId, keywords.id))
    .innerJoin(searchLocations, eq(rankings.locationId, searchLocations.id))
    .where(and(eq(rankings.propertyId, propertyId), gte(rankings.date, sinceStr)))
    .orderBy(desc(rankings.date))

  // ── Build full 7-day history per keyword (best position per day) ──────────
  // Must be done on ALL rows before the 2-row grouping below
  const historyAccum = new Map<string, { term: string; days: Map<string, number | null> }>()
  for (const row of rows) {
    const kh = historyAccum.get(row.keywordId) ?? { term: row.term, days: new Map() }
    const existing = kh.days.get(row.date)
    if (
      existing === undefined ||
      (row.position !== null && (existing === null || row.position < existing))
    ) {
      kh.days.set(row.date, row.position)
    }
    historyAccum.set(row.keywordId, kh)
  }

  const keywordHistories: KeywordHistory[] = Array.from(historyAccum.entries()).map(
    ([keywordId, { term, days }]) => ({
      keywordId,
      term,
      points: Array.from(days.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([date, position]) => ({ date, position })),
    })
  )

  // ── Two most recent per (keyword, location) for delta computation ─────────
  const grouped = new Map<string, typeof rows>()
  for (const row of rows) {
    const key = `${row.keywordId}:${row.locationId}`
    const group = grouped.get(key) ?? []
    if (group.length < 2) {
      group.push(row)
      grouped.set(key, group)
    }
  }

  const rankingRows: BoardRankingRow[] = Array.from(grouped.values()).map(([current, previous]) => ({
    keywordId: current.keywordId,
    term: current.term,
    locationName: current.locationName,
    currentPosition: current.position,
    previousPosition: previous?.position ?? null,
    delta:
      current.position != null && previous?.position != null
        ? previous.position - current.position
        : null,
  }))

  const positions = rankingRows.map((r) => r.currentPosition)
  const nonNull = positions.filter((p): p is number => p !== null)

  return {
    stats: {
      keywordCount: new Set(rankingRows.map((r) => r.keywordId)).size,
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
    },
    topRanked: rankingRows
      .filter((r) => r.currentPosition !== null && r.currentPosition <= 20)
      .sort((a, b) => (a.currentPosition ?? 999) - (b.currentPosition ?? 999))
      .slice(0, 10),
    rising: rankingRows
      .filter((r) => r.delta !== null && r.delta > 0)
      .sort((a, b) => b.delta! - a.delta!)
      .slice(0, 8),
    dropping: rankingRows
      .filter((r) => r.delta !== null && r.delta < 0)
      .sort((a, b) => a.delta! - b.delta!)
      .slice(0, 8),
    keywordHistories,
  }
}
