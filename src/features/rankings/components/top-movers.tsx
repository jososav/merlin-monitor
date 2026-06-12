import { ArrowUp, ArrowDown } from "lucide-react"
import type { RankingRow } from "../queries"

interface Props {
  improved: RankingRow[]
  dropped: RankingRow[]
}

export function TopMovers({ improved, dropped }: Props) {
  const hasData = improved.length > 0 || dropped.length > 0

  if (!hasData) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        No rank changes yet — keep the cron running.
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <MoversList title="Rising" icon={<ArrowUp size={14} />} color="rank-up" rows={improved} />
      <MoversList title="Dropping" icon={<ArrowDown size={14} />} color="rank-down" rows={dropped} />
    </div>
  )
}

function MoversList({
  title,
  icon,
  color,
  rows,
}: {
  title: string
  icon: React.ReactNode
  color: string
  rows: RankingRow[]
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-3">
      <div className={`flex items-center gap-1.5 text-sm font-medium ${color}`}>
        {icon}
        {title}
      </div>
      {rows.length === 0 ? (
        <p className="text-muted-foreground text-xs">No movers.</p>
      ) : (
        <div className="space-y-2">
          {rows.map((r) => (
            <div
              key={`${r.keywordId}:${r.propertyId}:${r.locationId}`}
              className="flex items-center justify-between"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{r.term}</p>
                <p className="text-xs text-muted-foreground">{r.propertyName}</p>
              </div>
              <div className="text-right ml-3 shrink-0">
                <span className={`rank-number font-semibold text-sm ${color}`}>
                  {r.delta! > 0 ? `+${r.delta}` : r.delta}
                </span>
                <p className="text-xs text-muted-foreground">
                  {r.previousPosition != null ? `#${r.previousPosition}` : "—"} → #{r.currentPosition}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
