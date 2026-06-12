"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  KeyRound,
  TrendingUp,
  Swords,
  Upload,
  Settings,
} from "lucide-react"
import { cn } from "@/lib/utils"

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/keywords", label: "Keywords", icon: KeyRound },
  { href: "/rankings", label: "Rankings", icon: TrendingUp },
  { href: "/competitors", label: "Competitors", icon: Swords },
  { href: "/import", label: "Import", icon: Upload },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex h-screen w-56 flex-col border-r border-border bg-card">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-border">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/15 glow-primary-sm">
          <span className="text-lg">🔮</span>
        </div>
        <span className="font-semibold tracking-tight text-foreground">Merlin</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 px-2 py-3">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                active
                  ? "bg-primary/10 text-primary border-l-2 border-primary glow-primary-sm"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground border-l-2 border-transparent"
              )}
            >
              <Icon size={16} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Settings + user */}
      <div className="border-t border-border px-2 py-3">
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all border-l-2 border-transparent",
            pathname.startsWith("/settings")
              ? "bg-primary/10 text-primary border-primary"
              : "text-muted-foreground hover:bg-accent hover:text-foreground"
          )}
        >
          <Settings size={16} />
          Settings
        </Link>
      </div>
    </aside>
  )
}
