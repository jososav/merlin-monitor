import { requireRealm } from "@/lib/auth"
import {
  getRankingsWithDelta,
  computeDashboardStats,
  computeTopMovers,
  getRecentActivity,
} from "@/features/rankings/queries"
import { getProperties } from "@/features/properties/queries"
import { DashboardStatsCards } from "@/features/rankings/components/dashboard-stats"
import { TopMovers } from "@/features/rankings/components/top-movers"
import { RecentActivity } from "@/features/rankings/components/recent-activity"
import { LiveBoardButton } from "@/features/boards/components/live-board-button"

export default async function DashboardPage() {
  const { realm } = await requireRealm()

  const [rankings, activity, properties] = await Promise.all([
    getRankingsWithDelta(realm.id, 7),
    getRecentActivity(realm.id, 10),
    getProperties(realm.id),
  ])

  const stats = computeDashboardStats(rankings)
  const { improved, dropped } = computeTopMovers(rankings)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {realm.name} — your realm at a glance.
          </p>
        </div>
        {properties.length > 0 && <LiveBoardButton properties={properties} />}
      </div>

      <DashboardStatsCards stats={stats} />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Top Movers (7d)
          </h2>
          <TopMovers improved={improved} dropped={dropped} />
        </div>

        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Recent Activity
          </h2>
          <div className="rounded-lg border border-border bg-card p-4">
            <RecentActivity items={activity} />
          </div>
        </div>
      </div>
    </div>
  )
}
