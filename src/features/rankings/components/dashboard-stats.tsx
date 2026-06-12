import { Card, CardContent } from "@/components/ui/card"
import { Hash, TrendingUp, Trophy, Target } from "lucide-react"
import type { DashboardStats } from "../queries"

export function DashboardStatsCards({ stats }: { stats: DashboardStats }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        icon={<Hash size={16} />}
        label="Keywords Tracked"
        value={String(stats.keywordCount)}
      />
      <StatCard
        icon={<TrendingUp size={16} />}
        label="Avg Position"
        value={stats.avgPosition != null ? `#${stats.avgPosition}` : "—"}
        mono
      />
      <StatCard
        icon={<Trophy size={16} />}
        label="In Top 3"
        value={stats.totalTracked > 0 ? `${stats.top3Pct}%` : "—"}
        highlight={stats.top3Pct > 0}
      />
      <StatCard
        icon={<Target size={16} />}
        label="In Top 10"
        value={stats.totalTracked > 0 ? `${stats.top10Pct}%` : "—"}
        highlight={stats.top10Pct > 0}
      />
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  mono,
  highlight,
}: {
  icon: React.ReactNode
  label: string
  value: string
  mono?: boolean
  highlight?: boolean
}) {
  return (
    <Card className="gradient-border bg-card">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2">
          {icon}
          {label}
        </div>
        <div
          className={`text-2xl font-bold ${mono ? "rank-number" : ""} ${highlight ? "text-emerald-400" : ""}`}
        >
          {value}
        </div>
      </CardContent>
    </Card>
  )
}
