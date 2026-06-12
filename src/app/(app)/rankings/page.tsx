import { requireRealm } from "@/lib/auth"
import { getHeatmapData } from "@/features/rankings/queries"
import { RankingsHeatmap } from "@/features/rankings/components/rankings-heatmap"
import { getProperties } from "@/features/properties/queries"

export default async function RankingsPage({
  searchParams,
}: {
  searchParams: Promise<{ property?: string; days?: string }>
}) {
  const { realm } = await requireRealm()
  const { property, days: daysParam } = await searchParams

  const days = [7, 14, 30].includes(Number(daysParam)) ? Number(daysParam) : 7

  const propertiesData = await getProperties(realm.id)
  const propertyId = property ?? propertiesData[0]?.id ?? null

  const data = propertyId ? await getHeatmapData(realm.id, propertyId, days) : null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Rankings</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Position snapshots across your keywords.
        </p>
      </div>

      {propertiesData.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground text-sm">
          No properties yet. Add one in Settings.
        </div>
      ) : !propertyId || !data ? (
        <div className="text-center py-16 text-muted-foreground text-sm">
          Select a property to view rankings.
        </div>
      ) : (
        <RankingsHeatmap
          data={data}
          properties={propertiesData.map((p) => ({ id: p.id, displayName: p.displayName }))}
          propertyId={propertyId}
          days={days}
        />
      )}
    </div>
  )
}
