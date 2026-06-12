import { CheckCircle2, XCircle, Clock, Loader2 } from "lucide-react"
import { formatDistanceToNow } from "@/lib/utils"
import type { ActivityItem } from "../queries"

const STATUS_ICON: Record<string, React.ReactNode> = {
  done: <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />,
  failed: <XCircle size={14} className="text-rose-400 shrink-0" />,
  running: <Loader2 size={14} className="text-cyan-400 animate-spin shrink-0" />,
  pending: <Clock size={14} className="text-muted-foreground shrink-0" />,
}

export function RecentActivity({ items }: { items: ActivityItem[] }) {
  if (items.length === 0) {
    return (
      <div className="text-muted-foreground text-sm text-center py-6">
        No checks run yet.
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item.id} className="flex items-center gap-2.5 text-sm">
          {STATUS_ICON[item.status] ?? STATUS_ICON.pending}
          <span className="flex-1 truncate">
            <span className="font-medium">{item.term}</span>
            <span className="text-muted-foreground"> · {item.displayName}</span>
          </span>
          <span className="text-xs text-muted-foreground shrink-0">
            {item.completedAt ? formatDistanceToNow(item.completedAt) : "—"}
          </span>
        </div>
      ))}
    </div>
  )
}
