"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { ArrowUp, ArrowDown, Maximize2, Minimize2, Wifi } from "lucide-react"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { cn } from "@/lib/utils"
import type { BoardConfig, BoardData, KeywordHistory } from "@/features/boards/queries"

const SLIDE_DURATION = 8000

interface Props {
  config: BoardConfig
  data: BoardData
}

export function BoardClient({ config, data }: Props) {
  const router = useRouter()
  const [slide, setSlide] = useState(0)
  const [progress, setProgress] = useState(0)
  const [time, setTime] = useState("")
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [refreshPulse, setRefreshPulse] = useState(false)
  const [rotationCount, setRotationCount] = useState(0)
  const prevSlideRef = useRef(-1)

  // Deduplicated keywords for history cycling
  const historyKeywords = [
    ...new Map(data.keywordHistories.map((kh) => [kh.keywordId, kh])).values(),
  ]
  const activeHistory =
    historyKeywords.length > 0
      ? historyKeywords[rotationCount % historyKeywords.length]
      : null

  const slides = buildSlides(data, activeHistory, rotationCount, historyKeywords.length)

  // Detect full rotation (slide wraps from last → 0) → advance keyword
  useEffect(() => {
    if (prevSlideRef.current === slides.length - 1 && slide === 0) {
      setRotationCount((c) => c + 1)
    }
    prevSlideRef.current = slide
  }, [slide, slides.length])

  // Clock
  useEffect(() => {
    function tick() {
      setTime(
        new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      )
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  // Auto-advance + progress bar
  useEffect(() => {
    setProgress(0)
    const start = Date.now()
    const tick = setInterval(() => {
      setProgress(Math.min(((Date.now() - start) / SLIDE_DURATION) * 100, 100))
    }, 80)
    const advance = setTimeout(() => {
      setSlide((s) => (s + 1) % slides.length)
    }, SLIDE_DURATION)
    return () => {
      clearInterval(tick)
      clearTimeout(advance)
    }
  }, [slide, slides.length])

  // Auto-refresh data every 30 min
  useEffect(() => {
    const id = setInterval(() => {
      setRefreshPulse(true)
      router.refresh()
      setTimeout(() => setRefreshPulse(false), 1000)
    }, 30 * 60 * 1000)
    return () => clearInterval(id)
  }, [router])

  // Fullscreen
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }, [])

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener("fullscreenchange", handler)
    return () => document.removeEventListener("fullscreenchange", handler)
  }, [])

  return (
    <div
      className="relative min-h-screen flex flex-col overflow-hidden select-none"
      style={{ background: "#0D0B14" }}
    >
      {/* Animated background glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% -10%, hsl(262 83% 58% / 0.08) 0%, transparent 70%)",
          animation: "pulse-bg 8s ease-in-out infinite alternate",
        }}
      />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-8 py-5 border-b border-white/5">
        <div className="flex items-center gap-4">
          <span className="text-lg font-bold tracking-tight text-white/90">
            {config.propertyName}
          </span>
          <span className="flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
            LIVE
          </span>
        </div>
        <div className="flex items-center gap-5">
          <Wifi
            size={14}
            className={cn(
              "transition-colors duration-500",
              refreshPulse ? "text-emerald-400" : "text-white/20"
            )}
          />
          <span className="rank-number text-sm text-white/40">{time}</span>
          <button
            onClick={toggleFullscreen}
            className="text-white/30 hover:text-white/70 transition-colors"
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </header>

      {/* Slide area */}
      <div className="relative flex-1 overflow-hidden">
        {slides.map((s, i) => (
          <div
            key={s.id}
            className={cn(
              "absolute inset-0 flex flex-col px-8 py-10 transition-all duration-700",
              i === slide
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-6 pointer-events-none"
            )}
          >
            <p className="text-xs font-semibold uppercase tracking-widest text-white/25 mb-8">
              {s.title}
            </p>
            {s.content}
          </div>
        ))}
      </div>

      {/* Footer */}
      <footer className="relative z-10 px-8 pb-6 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex gap-1.5">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setSlide(i)}
                className={cn(
                  "rounded-full transition-all duration-300",
                  i === slide
                    ? "w-6 h-1.5 bg-primary"
                    : "w-1.5 h-1.5 bg-white/15 hover:bg-white/30"
                )}
              />
            ))}
          </div>
          <span className="text-xs text-white/15">Powered by Merlin</span>
        </div>
        <div className="h-px bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary/50 rounded-full transition-none"
            style={{ width: `${progress}%` }}
          />
        </div>
      </footer>

      <style>{`
        @keyframes pulse-bg {
          from { opacity: 0.6; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  )
}

// ─── Slide registry ───────────────────────────────────────────────────────────

function buildSlides(
  data: BoardData,
  activeHistory: KeywordHistory | null,
  rotationCount: number,
  totalHistoryKeywords: number
) {
  return [
    {
      id: "overview",
      title: "Overview",
      content: <OverviewSlide data={data} />,
    },
    ...(data.topRanked.length > 0
      ? [{ id: "top-ranked", title: "Top Ranked", content: <TopRankedSlide rows={data.topRanked} /> }]
      : []),
    ...(activeHistory
      ? [
          {
            id: `history-${rotationCount}`,
            title: "7-Day Trend",
            content: (
              <HistorySlide
                history={activeHistory}
                keywordIndex={rotationCount % totalHistoryKeywords}
                totalKeywords={totalHistoryKeywords}
              />
            ),
          },
        ]
      : []),
    ...(data.rising.length > 0
      ? [{ id: "rising", title: "Rising ↑", content: <MoversSlide rows={data.rising} direction="up" /> }]
      : []),
    ...(data.dropping.length > 0
      ? [{ id: "dropping", title: "Dropping ↓", content: <MoversSlide rows={data.dropping} direction="down" /> }]
      : []),
  ]
}

// ─── Slides ───────────────────────────────────────────────────────────────────

function OverviewSlide({ data }: { data: BoardData }) {
  const { stats } = data
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="grid grid-cols-2 gap-6 w-full max-w-3xl">
        <StatHero label="Keywords Tracked" value={String(stats.keywordCount)} sub="active" />
        <StatHero
          label="Avg Position"
          value={stats.avgPosition != null ? `#${stats.avgPosition}` : "—"}
          mono
          highlight={stats.avgPosition != null && stats.avgPosition <= 10}
        />
        <StatHero
          label="In Top 3"
          value={stats.totalTracked > 0 ? `${stats.top3Pct}%` : "—"}
          sub="of tracked keywords"
          highlight={stats.top3Pct > 0}
        />
        <StatHero
          label="In Top 10"
          value={stats.totalTracked > 0 ? `${stats.top10Pct}%` : "—"}
          sub="of tracked keywords"
          highlight={stats.top10Pct > 20}
        />
      </div>
    </div>
  )
}

function StatHero({
  label,
  value,
  sub,
  mono,
  highlight,
}: {
  label: string
  value: string
  sub?: string
  mono?: boolean
  highlight?: boolean
}) {
  return (
    <div
      className="rounded-2xl border p-8 flex flex-col gap-3"
      style={{
        background: "linear-gradient(135deg, hsl(258 30% 9% / 1), hsl(258 25% 11% / 1))",
        borderColor: "hsl(258 20% 18% / 1)",
        boxShadow: highlight ? "0 0 40px -10px hsl(262 83% 58% / 0.25)" : undefined,
      }}
    >
      <span className="text-xs font-medium uppercase tracking-widest text-white/30">{label}</span>
      <span
        className={cn(
          "text-6xl font-bold leading-none tracking-tight",
          mono && "rank-number",
          highlight ? "text-emerald-400" : "text-white"
        )}
      >
        {value}
      </span>
      {sub && <span className="text-sm text-white/25">{sub}</span>}
    </div>
  )
}

function TopRankedSlide({ rows }: { rows: BoardData["topRanked"] }) {
  return (
    <div className="flex-1 flex flex-col gap-3 max-w-3xl mx-auto w-full">
      {rows.map((r) => (
        <div
          key={`${r.keywordId}:${r.locationName}`}
          className="flex items-center gap-5 rounded-xl px-6 py-3.5 border border-white/5"
          style={{ background: "hsl(258 30% 9% / 0.7)" }}
        >
          <span
            className={cn(
              "rank-number text-3xl font-bold w-16 shrink-0 text-right",
              r.currentPosition === 1 && "text-amber-400",
              r.currentPosition !== null && r.currentPosition <= 3 && r.currentPosition > 1 && "text-emerald-400",
              r.currentPosition !== null && r.currentPosition > 3 && "text-white/70"
            )}
          >
            #{r.currentPosition}
          </span>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-white text-lg truncate">{r.term}</p>
            <p className="text-sm text-white/30">{r.locationName}</p>
          </div>
          {r.delta !== null && r.delta !== 0 && (
            <span
              className={cn(
                "rank-number text-sm font-medium flex items-center gap-1",
                r.delta > 0 ? "text-emerald-400" : "text-rose-400"
              )}
            >
              {r.delta > 0 ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
              {Math.abs(r.delta)}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}

function HistorySlide({
  history,
  keywordIndex,
  totalKeywords,
}: {
  history: KeywordHistory
  keywordIndex: number
  totalKeywords: number
}) {
  const nonNull = history.points.filter((p) => p.position !== null)
  const best = nonNull.length
    ? nonNull.reduce((a, b) => (a.position! < b.position! ? a : b))
    : null
  const worst = nonNull.length
    ? nonNull.reduce((a, b) => (a.position! > b.position! ? a : b))
    : null
  const maxPos = nonNull.length ? Math.max(...nonNull.map((p) => p.position!)) + 3 : 20

  const data = history.points.map((p) => ({
    date: formatDate(p.date),
    position: p.position,
  }))

  return (
    <div className="flex flex-col max-w-4xl mx-auto w-full gap-5">
      {/* Keyword header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white truncate">{history.term}</h2>
          <p className="text-white/35 text-sm mt-1">Position over the last 7 days</p>
        </div>
        <span className="rank-number text-xs text-white/20 mt-1 shrink-0 ml-4">
          {keywordIndex + 1} / {totalKeywords}
        </span>
      </div>

      {/* Chart */}
      <div className="w-full" style={{ height: 320 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis
              dataKey="date"
              tick={{ fill: "#94A3B8", fontSize: 13 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              reversed
              domain={[maxPos, 0]}
              tick={{ fill: "#94A3B8", fontSize: 13 }}
              tickCount={6}
              axisLine={false}
              tickLine={false}
              width={36}
            />
            <Tooltip
              contentStyle={{
                background: "#13101F",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 8,
                fontSize: 13,
              }}
              labelStyle={{ color: "#94A3B8" }}
              formatter={(value) => [
                value == null ? "Not ranked" : `#${value}`,
                "Position",
              ]}
            />
            <Area
              type="monotone"
              dataKey="position"
              stroke="#7C3AED"
              strokeWidth={3}
              fill="url(#areaGradient)"
              dot={{ fill: "#7C3AED", r: 5, strokeWidth: 0 }}
              activeDot={{ fill: "#7C3AED", r: 7, strokeWidth: 0 }}
              connectNulls={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Best / Worst callouts */}
      {nonNull.length > 0 && (
        <div className="flex gap-8 pb-1">
          {best && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-white/30 uppercase tracking-wider">Best</span>
              <span className="rank-number font-bold text-xl text-emerald-400">
                #{best.position}
              </span>
              <span className="text-xs text-white/25">{formatDate(best.date)}</span>
            </div>
          )}
          {worst && worst.date !== best?.date && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-white/30 uppercase tracking-wider">Worst</span>
              <span className="rank-number font-bold text-xl text-rose-400">
                #{worst.position}
              </span>
              <span className="text-xs text-white/25">{formatDate(worst.date)}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function MoversSlide({
  rows,
  direction,
}: {
  rows: BoardData["rising"] | BoardData["dropping"]
  direction: "up" | "down"
}) {
  const isUp = direction === "up"
  return (
    <div className="flex-1 flex flex-col gap-3 max-w-3xl mx-auto w-full">
      {rows.map((r) => (
        <div
          key={`${r.keywordId}:${r.locationName}`}
          className="flex items-center gap-5 rounded-xl px-6 py-3.5 border border-white/5"
          style={{ background: "hsl(258 30% 9% / 0.7)" }}
        >
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-white text-lg truncate">{r.term}</p>
            <p className="text-sm text-white/30">{r.locationName}</p>
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <span className="rank-number text-sm text-white/25">
              {r.previousPosition != null ? `#${r.previousPosition}` : "—"} → #{r.currentPosition}
            </span>
            <span
              className={cn(
                "rank-number text-2xl font-bold flex items-center gap-1",
                isUp ? "text-emerald-400" : "text-rose-400"
              )}
              style={{
                textShadow: isUp
                  ? "0 0 20px hsl(160 84% 39% / 0.6)"
                  : "0 0 20px hsl(346 77% 60% / 0.6)",
              }}
            >
              {isUp ? <ArrowUp size={20} /> : <ArrowDown size={20} />}
              {Math.abs(r.delta!)}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00")
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}
