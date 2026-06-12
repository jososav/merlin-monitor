"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MoreHorizontal, Trash2, RefreshCw, Pencil } from "lucide-react"
import { deleteKeyword, updateKeywordFrequency } from "@/features/keywords/actions"
import { toast } from "sonner"
import type { KeywordWithRelations, KeywordGroup, SearchLocation } from "@/features/keywords/queries"
import type { Property } from "@/features/properties/queries"
import { formatDistanceToNow } from "@/lib/utils"
import { EditKeywordDialog } from "./add-keyword-dialog"

interface Props {
  keywords: KeywordWithRelations[]
  activeGroupId: string | null
  properties: Property[]
  groups: KeywordGroup[]
  locations: SearchLocation[]
}

const FREQUENCY_LABELS: Record<string, string> = {
  "1h": "1h", "2h": "2h", "6h": "6h", "12h": "12h", "24h": "24h",
}

export function KeywordsTable({ keywords, activeGroupId, properties, groups, locations }: Props) {
  const filtered = activeGroupId
    ? keywords.filter((k) => k.keywordGroupMembers.some((m) => m.group.id === activeGroupId))
    : keywords

  if (filtered.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground text-sm">
        No keywords yet. Cast your first spell.
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="border-border hover:bg-transparent">
          <TableHead>Keyword</TableHead>
          <TableHead>Properties</TableHead>
          <TableHead>Locations</TableHead>
          <TableHead>Frequency</TableHead>
          <TableHead>Last checked</TableHead>
          <TableHead className="w-10" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {filtered.map((kw) => (
          <KeywordRow
            key={kw.id}
            keyword={kw}
            properties={properties}
            groups={groups}
            locations={locations}
          />
        ))}
      </TableBody>
    </Table>
  )
}

function KeywordRow({
  keyword,
  properties,
  groups,
  locations,
}: {
  keyword: KeywordWithRelations
  properties: Property[]
  groups: KeywordGroup[]
  locations: SearchLocation[]
}) {
  const [freq, setFreq] = useState(keyword.checkFrequency)
  const [checking, setChecking] = useState(false)
  const [editOpen, setEditOpen] = useState(false)

  const uniqueProperties = [
    ...new Map(keyword.keywordPropertyLocations.map((kpl) => [kpl.property.id, kpl.property])).values(),
  ]
  const uniqueLocations = [
    ...new Map(keyword.keywordPropertyLocations.map((kpl) => [kpl.location.id, kpl.location])).values(),
  ]

  async function handleFrequencyChange(value: string) {
    setFreq(value as typeof freq)
    await updateKeywordFrequency(keyword.id, value)
    toast.success("Frequency updated.")
  }

  async function handleCheckNow() {
    setChecking(true)
    try {
      const res = await fetch("/api/serp/check-now", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keywordId: keyword.id }),
      })
      if (res.ok) toast.success("Check queued — results in next cron tick.")
      else toast.error("Failed to queue check.")
    } finally {
      setChecking(false)
    }
  }

  async function handleDelete() {
    await deleteKeyword(keyword.id)
    toast.success(`"${keyword.term}" removed.`)
  }

  return (
    <>
      <TableRow className="border-border">
        <TableCell className="font-medium">{keyword.term}</TableCell>
        <TableCell>
          <div className="flex flex-wrap gap-1">
            {uniqueProperties.map((p) => (
              <Badge key={p.id} variant="outline" className="text-xs">{p.displayName}</Badge>
            ))}
          </div>
        </TableCell>
        <TableCell>
          <div className="flex flex-wrap gap-1">
            {uniqueLocations.map((l) => (
              <Badge key={l.id} variant="secondary" className="text-xs">{l.name}</Badge>
            ))}
          </div>
        </TableCell>
        <TableCell>
          <Select value={freq} onValueChange={handleFrequencyChange}>
            <SelectTrigger className="h-7 w-20 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(FREQUENCY_LABELS).map(([v, l]) => (
                <SelectItem key={v} value={v} className="text-xs">{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </TableCell>
        <TableCell className="text-muted-foreground text-xs">
          {keyword.lastCheckedAt ? formatDistanceToNow(keyword.lastCheckedAt) : "Never"}
        </TableCell>
        <TableCell>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <MoreHorizontal size={14} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => setEditOpen(true)}>
                <Pencil size={14} className="mr-2" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleCheckNow} disabled={checking}>
                <RefreshCw size={14} className="mr-2" /> Check now
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={handleDelete}
              >
                <Trash2 size={14} className="mr-2" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>

      <EditKeywordDialog
        keyword={keyword}
        open={editOpen}
        onOpenChange={setEditOpen}
        properties={properties}
        groups={groups}
        locations={locations}
      />
    </>
  )
}
