"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tv, Copy, ExternalLink, Check } from "lucide-react"
import { getOrCreateBoard } from "@/features/boards/actions"
import type { Property } from "@/features/properties/queries"

export function LiveBoardButton({ properties }: { properties: Property[] }) {
  const [open, setOpen] = useState(false)
  const [propertyId, setPropertyId] = useState(properties[0]?.id ?? "")
  const [boardUrl, setBoardUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  async function generate() {
    setLoading(true)
    const result = await getOrCreateBoard(propertyId)
    setLoading(false)
    if (result.token) {
      setBoardUrl(`${window.location.origin}/board/${result.token}`)
    }
  }

  function copyUrl() {
    if (!boardUrl) return
    navigator.clipboard.writeText(boardUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleOpen(v: boolean) {
    setOpen(v)
    if (!v) {
      setBoardUrl(null)
      setCopied(false)
    }
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="gap-2 border-primary/30 text-primary hover:bg-primary/10 hover:border-primary"
        onClick={() => setOpen(true)}
      >
        <Tv size={14} />
        Live Board
      </Button>

      <Dialog open={open} onOpenChange={handleOpen}>
        <DialogContent className="bg-card border-border max-w-sm" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Tv size={16} className="text-primary" /> Live Board
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <Label>Property</Label>
              <Select value={propertyId} onValueChange={(v) => { setPropertyId(v); setBoardUrl(null) }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {properties.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.displayName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {!boardUrl ? (
              <Button
                className="w-full glow-primary-sm"
                onClick={generate}
                disabled={loading || !propertyId}
              >
                {loading ? "Generating…" : "Generate Board URL"}
              </Button>
            ) : (
              <div className="space-y-2">
                <Label>Board URL</Label>
                <div className="flex gap-2">
                  <Input value={boardUrl} readOnly className="text-xs" />
                  <Button size="icon" variant="outline" onClick={copyUrl} className="shrink-0">
                    {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  </Button>
                  <Button size="icon" variant="outline" asChild className="shrink-0">
                    <a href={boardUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink size={14} />
                    </a>
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Open on any TV or screen. No login required. Updates every 30s.
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
