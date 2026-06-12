"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { ArrowUp, ArrowDown, Maximize2, Minimize2, Wifi } from "lucide-react"
import { cn } from "@/lib/utils"
import type { BoardConfig, BoardData } from "@/features/boards/queries"

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

  const slides = buildSlides(data)

  // Clock
  useEffect(() => {
    function tick() {
      setTime(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }))
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  // Auto-advance slides
  useEffect(() => {
    setProgress(0)
    const start = Date.now()
    const tick = setInterval(() => {
      const elapsed = Date.now() - start
      setProgress(Math.min((elapsed / SLIDE_DURATION) * 100, 100))
    }, 80)
    const advance = setTimeout(() => {
      setSlide((s) => (s + 1) % slides.length)
    }, SLIDE_DURATION)
    return () => { clearInterval(tick); clearTimeout(advance) }
  }, [slide, slides.length])

  // Auto-refresh data from server every 30s
  useEffect(() => {
    const id = setInterval(() => {
      setRefreshPulse(true)
      router.refresh()
      setTimeout(() => setRefreshPulse(false), 1000)
    }, 30_000)
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
      {/* Animated background */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: "radial-gradient(ellipse 80% 60% at 50% -10%, hsl(262 83% 58% / 0.08) 0%, transparent 70%)",
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
              "transition-colors",
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

      {/* Footer: dots + progress bar + watermark */}
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

// ─── Slide definitions ────────────────────────────────────────────────────────

function buildSlides(data: BoardData) {
  const slides = [
    {
      id: "overview",
      title: "Overview",
      content: <OverviewSlide data={data} />,
    },
    ...(data.topRanked.length > 0
      ? [{ id: "top-ranked", title: "Top Ranked", content: <TopRankedSlide rows={data.topRanked} /> }]
      : []),
    ...(data.rising.length > 0
      ? [{ id: "rising", title: "Rising ↑", content: <MoversSlide rows={data.rising} direction="up" /> }]
      : []),
    ...(data.dropping.length > 0
      ? [{ id: "dropping", title: "Dropping ↓", content: <MoversSlide rows={data.dropping} direction="down" /> }]
      : []),
  ]
  return slides
}

function OverviewSlide({ data }: { data: BoardData }) {
  const { stats } = data
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="grid grid-cols-2 gap-6 w-full max-w-3xl">
        <StatHero
          label="Keywords Tracked"
          value={String(stats.keywordCount)}
          sub="active"
        />
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
      {rows.map((r, i) => (
        <div
          key={`${r.keywordId}:${r.locationName}`}
          className="flex items-center gap-5 rounded-xl px-6 py-3.5 border border-white/5"
          style={{
            background: "hsl(258 30% 9% / 0.7)",
            animationDelay: `${i * 60}ms`,
          }}
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
