"use client"

import { useState, useMemo } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowUp, ArrowDown, Minus, ChevronDown, ChevronUp, ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils"
import { PositionChart } from "./position-chart"
import type { RankingRow } from "../queries"

interface Props {
  rankings: RankingRow[]
  properties: { id: string; displayName: string }[]
  history: { date: string; position: number | null }[]
  selectedKey: string | null
  days: number
}

export function RankingsPageClient({ rankings, properties, history, selectedKey, days }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const [search, setSearch] = useState("")
  const [propertyFilter, setPropertyFilter] = useState("all")

  const filtered = useMemo(() => {
    return rankings.filter((r) => {
      if (propertyFilter !== "all" && r.propertyId !== propertyFilter) return false
      if (search && !r.term.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [rankings, propertyFilter, search])

  function setDays(d: number) {
    const params = new URLSearchParams()
    params.set("days", String(d))
    router.push(`${pathname}?${params}`)
  }

  function selectRow(r: RankingRow) {
    const key = `${r.keywordId}:${r.propertyId}:${r.locationId}`
    const params = new URLSearchParams()
    params.set("days", String(days))
    params.set("k", r.keywordId)
    params.set("p", r.propertyId)
    params.set("l", r.locationId)
    if (selectedKey === key) {
      // Deselect
      router.push(`${pathname}?days=${days}`)
    } else {
      router.push(`${pathname}?${params}`)
    }
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Search keywords…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-8 w-52 text-sm"
        />
        <Select value={propertyFilter} onValueChange={setPropertyFilter}>
          <SelectTrigger className="h-8 w-44 text-sm">
            <SelectValue placeholder="All properties" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All properties</SelectItem>
            {properties.map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.displayName}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="ml-auto flex gap-1">
          {[14, 30].map((d) => (
            <Button
              key={d}
              size="sm"
              variant={days === d ? "default" : "outline"}
              className={cn("h-8 text-xs", days === d && "glow-primary-sm")}
              onClick={() => setDays(d)}
            >
              {d}d
            </Button>
          ))}
        </div>
      </div>

      {/* Chart for selected row */}
      {selectedKey && history.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground mb-3">
            Position history — {history.length} data points
          </p>
          <PositionChart history={history} />
        </div>
      )}

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground text-sm">
          No rankings match your filters.
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead>Keyword</TableHead>
              <TableHead>Property</TableHead>
              <TableHead>Location</TableHead>
              <TableHead className="text-right">Position</TableHead>
              <TableHead className="text-right">Change</TableHead>
              <TableHead className="text-right">URL</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((r) => {
              const key = `${r.keywordId}:${r.propertyId}:${r.locationId}`
              const isSelected = selectedKey === key
              return (
                <TableRow
                  key={key}
                  className={cn(
                    "border-border cursor-pointer",
                    isSelected && "bg-primary/5"
                  )}
                  onClick={() => selectRow(r)}
                >
                  <TableCell className="font-medium">{r.term}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">{r.propertyName}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">{r.locationName}</TableCell>
                  <TableCell className="text-right">
                    <PositionBadge position={r.currentPosition} />
                  </TableCell>
                  <TableCell className="text-right">
                    <DeltaBadge delta={r.delta} />
                  </TableCell>
                  <TableCell className="text-right">
                    {r.url ? (
                      <a
                        href={r.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 text-xs text-cyan-400 hover:underline"
                      >
                        <ExternalLink size={10} />
                      </a>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      )}
    </div>
  )
}

function PositionBadge({ position }: { position: number | null }) {
  if (position === null) {
    return <span className="text-muted-foreground text-xs rank-number">—</span>
  }
  return (
    <span
      className={cn(
        "rank-number font-semibold text-sm",
        position <= 3 && "text-emerald-400",
        position > 3 && position <= 10 && "text-foreground",
        position > 10 && "text-muted-foreground"
      )}
    >
      #{position}
    </span>
  )
}

function DeltaBadge({ delta }: { delta: number | null }) {
  if (delta === null) return <span className="text-muted-foreground text-xs">—</span>
  if (delta === 0) return <span className="text-muted-foreground text-xs flex items-center justify-end gap-0.5"><Minus size={10} /> 0</span>
  if (delta > 0) {
    return (
      <span className="rank-up text-xs flex items-center justify-end gap-0.5 font-medium">
        <ArrowUp size={10} /> {delta}
      </span>
    )
  }
  return (
    <span className="rank-down text-xs flex items-center justify-end gap-0.5 font-medium">
      <ArrowDown size={10} /> {Math.abs(delta)}
    </span>
  )
}
