import { requireRealm } from "@/lib/auth"
import { getRankingsWithDelta, getPositionHistory } from "@/features/rankings/queries"
import { RankingsPageClient } from "@/features/rankings/components/rankings-page-client"
import { getProperties } from "@/features/properties/queries"

export default async function RankingsPage({
  searchParams,
}: {
  searchParams: Promise<{ k?: string; p?: string; l?: string; days?: string }>
}) {
  const { realm } = await requireRealm()
  const { k, p, l, days: daysParam } = await searchParams
  const days = daysParam === "14" ? 14 : 30

  const [rankingsData, propertiesData] = await Promise.all([
    getRankingsWithDelta(realm.id, days),
    getProperties(realm.id),
  ])

  let history: { date: string; position: number | null }[] = []
  if (k && p && l) {
    history = await getPositionHistory(k, p, l, days)
  }

  const selectedKey = k && p && l ? `${k}:${p}:${l}` : null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Rankings</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Position history across your properties.
        </p>
      </div>

      {rankingsData.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground text-sm">
          No rankings yet. The cron will check once keywords are added.
        </div>
      ) : (
        <RankingsPageClient
          rankings={rankingsData}
          properties={propertiesData.map((p) => ({ id: p.id, displayName: p.displayName }))}
          history={history}
          selectedKey={selectedKey}
          days={days}
        />
      )}
    </div>
  )
}
