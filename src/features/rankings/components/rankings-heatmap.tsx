"use client"

import React, { useState, useMemo } from "react"
import { useRouter, usePathname } from "next/navigation"
import { ChevronDown, ChevronRight } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import type { HeatmapData, HeatmapColumn, HeatmapSnapshot } from "../queries"

interface Props {
  data: HeatmapData
  properties: { id: string; displayName: string }[]
  propertyId: string
  days: number
}

// ─── Rank chip config ─────────────────────────────────────────────────────────

const CHIPS = [
  { label: "#1",   min: 1,  max: 1,        color: "#10b981", bg: "#0f3d2e" },
  { label: "2–3",  min: 2,  max: 3,        color: "#6ee7b7", bg: "#0d2b19" },
  { label: "4–5",  min: 4,  max: 5,        color: "#fde68a", bg: "#2c2710" },
  { label: "6–7",  min: 6,  max: 7,        color: "#fdba74", bg: "#2c1b09" },
  { label: "8–10", min: 8,  max: 10,       color: "#fca5a5", bg: "#2c0f0f" },
  { label: ">10",  min: 11, max: Infinity, color: "#ef4444", bg: "#1a0808" },
] as const

type ChipLabel = (typeof CHIPS)[number]["label"]

function inRange(pos: number | null, min: number, max: number) {
  if (pos === null) return min === 11
  return pos >= min && pos <= max
}

// ─── Cell ────────────────────────────────────────────────────────────────────

function cellInfo(pos: number | null): { label: string; style: React.CSSProperties } {
  if (pos === null) return { label: "", style: {} }
  if (pos === 1)
    return { label: "1",          style: { background: "#0f3d2e", color: "#10b981" } }
  if (pos <= 3)
    return { label: String(pos),  style: { background: "#0d2b19", color: "#6ee7b7" } }
  if (pos <= 5)
    return { label: String(pos),  style: { background: "#2c2710", color: "#fde68a" } }
  if (pos <= 7)
    return { label: String(pos),  style: { background: "#2c1b09", color: "#fdba74" } }
  if (pos <= 10)
    return { label: String(pos),  style: { background: "#2c0f0f", color: "#fca5a5" } }
  return {
    label: ">10",
    style: { background: "#1a0808", color: "#7f1d1d", border: "1px dashed #7f1d1d66" },
  }
}

function RankCell({ pos }: { pos: number | null }) {
  if (pos === null) return <td className="px-2 py-1.5" />
  const { label, style } = cellInfo(pos)
  return (
    <td className="px-2 py-1.5 text-center">
      <div
        className="mx-auto rounded text-xs font-bold py-1 rank-number"
        style={{ minWidth: 52, ...style }}
      >
        {label}
      </div>
    </td>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function RankingsHeatmap({ data, properties, propertyId, days }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const [activeChip, setActiveChip] = useState<ChipLabel | null>(null)
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())

  function navigate(pid: string, d: number) {
    const p = new URLSearchParams()
    p.set("property", pid)
    p.set("days", String(d))
    router.push(`${pathname}?${p}`)
  }

  function toggleDate(date: string) {
    setCollapsed((prev) => {
      const next = new Set(prev)
      next.has(date) ? next.delete(date) : next.add(date)
      return next
    })
  }

  const filteredGroups = useMemo(() => {
    if (!activeChip) return data.groups
    const chip = CHIPS.find((c) => c.label === activeChip)!
    return data.groups
      .map((group) => ({
        ...group,
        snapshots: group.snapshots.filter((snap) =>
          data.columns.some((col) => inRange(snap.positions[col.key], chip.min, chip.max))
        ),
      }))
      .filter((g) => g.snapshots.length > 0)
  }, [data, activeChip])

  function formatDate(s: string) {
    const [y, m, d] = s.split("-")
    return `${m}/${d}/${y}`
  }

  const STICKY_DATE_W = 120
  const STICKY_TIME_W = 80

  return (
    <div className="space-y-4">
      {/* ── Filter bar ── */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Viewing:</span>
          <Select value={propertyId} onValueChange={(id) => navigate(id, days)}>
            <SelectTrigger className="h-8 w-52 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {properties.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.displayName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-1 ml-auto">
          {([7, 14, 30] as const).map((d) => (
            <button
              key={d}
              onClick={() => navigate(propertyId, d)}
              className={cn(
                "h-7 px-3 rounded text-xs font-medium border transition-colors",
                days === d
                  ? "bg-white/10 border-white/20 text-white"
                  : "border-white/10 text-muted-foreground hover:border-white/20 hover:text-white"
              )}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {/* ── Rank chips ── */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Rank:</span>
        {CHIPS.map((chip) => {
          const active = activeChip === chip.label
          return (
            <button
              key={chip.label}
              onClick={() => setActiveChip(active ? null : chip.label)}
              className="h-7 px-3 rounded-full text-xs font-semibold border transition-all rank-number"
              style={
                active
                  ? { background: chip.bg, color: chip.color, borderColor: chip.color }
                  : { background: "transparent", color: chip.color + "66", borderColor: chip.color + "44" }
              }
            >
              {chip.label}
            </button>
          )
        })}
      </div>

      {/* ── Table ── */}
      {data.columns.length === 0 || data.groups.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground text-sm">
          No ranking snapshots yet for this property and time range.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="text-sm border-collapse" style={{ minWidth: "100%" }}>
            <thead>
              <tr style={{ background: "#13101F" }}>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-muted-foreground sticky left-0 z-20 border-b border-r border-border"
                  style={{ background: "#13101F", width: STICKY_DATE_W, minWidth: STICKY_DATE_W }}
                >
                  Date
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-muted-foreground sticky z-20 border-b border-r border-border"
                  style={{
                    background: "#13101F",
                    left: STICKY_DATE_W,
                    width: STICKY_TIME_W,
                    minWidth: STICKY_TIME_W,
                  }}
                >
                  Hour
                </th>
                {data.columns.map((col) => (
                  <th
                    key={col.key}
                    className="px-3 py-2 text-center border-b border-border"
                    style={{ minWidth: 100 }}
                  >
                    <div className="font-semibold text-xs text-white/80 leading-tight truncate max-w-[120px] mx-auto">
                      {col.term}
                    </div>
                    <div className="text-white/30 text-xs font-normal mt-0.5">
                      {col.locationName}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredGroups.map((group) => {
                const isOpen = !collapsed.has(group.date)
                return (
                  <React.Fragment key={group.date}>
                    {/* Date group header */}
                    <tr
                      className="cursor-pointer border-t border-border/60 hover:bg-white/[0.03]"
                      style={{ background: "#0D0B14" }}
                      onClick={() => toggleDate(group.date)}
                    >
                      <td
                        colSpan={2 + data.columns.length}
                        className="px-4 py-2 font-semibold text-white/80 text-sm"
                      >
                        <span className="inline-flex items-center gap-2">
                          {isOpen ? (
                            <ChevronDown size={13} className="text-white/40" />
                          ) : (
                            <ChevronRight size={13} className="text-white/40" />
                          )}
                          {formatDate(group.date)}
                          <span className="text-xs font-normal text-muted-foreground">
                            ({group.snapshots.length}{" "}
                            {group.snapshots.length === 1 ? "snapshot" : "snapshots"})
                          </span>
                        </span>
                      </td>
                    </tr>

                    {/* Snapshot rows */}
                    {isOpen &&
                      group.snapshots.map((snap, i) => {
                        const rowBg = i % 2 === 0 ? "#0f0c1a" : "#0D0B14"
                        return (
                          <tr
                            key={`${snap.time}-${i}`}
                            className="border-t border-border/20"
                            style={{ background: rowBg }}
                          >
                            {/* Empty date cell (sticky) */}
                            <td
                              className="sticky left-0 z-10 border-r border-border/20"
                              style={{ background: rowBg, width: STICKY_DATE_W, minWidth: STICKY_DATE_W }}
                            />
                            {/* Time cell (sticky) */}
                            <td
                              className="sticky z-10 px-4 py-1.5 font-mono text-xs text-muted-foreground border-r border-border/20"
                              style={{
                                background: rowBg,
                                left: STICKY_DATE_W,
                                width: STICKY_TIME_W,
                                minWidth: STICKY_TIME_W,
                              }}
                            >
                              {snap.time}
                            </td>
                            {/* Position cells */}
                            {data.columns.map((col) => (
                              <RankCell key={col.key} pos={snap.positions[col.key] ?? null} />
                            ))}
                          </tr>
                        )
                      })}
                  </React.Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
