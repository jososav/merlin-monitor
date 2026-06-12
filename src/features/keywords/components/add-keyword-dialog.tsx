"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Plus, X } from "lucide-react"
import { createKeyword } from "@/features/keywords/actions"
import type { KeywordGroup, SearchLocation } from "@/features/keywords/queries"
import type { Property } from "@/features/properties/queries"
import { toast } from "sonner"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { Check } from "lucide-react"

interface Props {
  properties: Property[]
  groups: KeywordGroup[]
  locations: SearchLocation[]
}

export function AddKeywordDialog({ properties, groups, locations }: Props) {
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)
  const [term, setTerm] = useState("")
  const [frequency, setFrequency] = useState("24h")
  const [groupId, setGroupId] = useState<string | undefined>()
  const [selectedPropertyIds, setSelectedPropertyIds] = useState<string[]>(
    properties.length === 1 ? [properties[0].id] : []
  )
  const [selectedLocationIds, setSelectedLocationIds] = useState<string[]>([])
  const [locationOpen, setLocationOpen] = useState(false)

  function toggleProperty(id: string) {
    setSelectedPropertyIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    )
  }

  function toggleLocation(id: string) {
    setSelectedLocationIds((prev) =>
      prev.includes(id) ? prev.filter((l) => l !== id) : [...prev, id]
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setPending(true)
    const result = await createKeyword({
      term,
      checkFrequency: frequency,
      groupId,
      propertyIds: selectedPropertyIds,
      locationIds: selectedLocationIds,
    })
    setPending(false)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(`"${term}" added.`)
      setOpen(false)
      setTerm("")
      setFrequency("24h")
      setGroupId(undefined)
      setSelectedPropertyIds(properties.length === 1 ? [properties[0].id] : [])
      setSelectedLocationIds([])
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="glow-primary-sm">
          <Plus size={14} className="mr-1.5" /> Add Keyword
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border max-w-md" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Add Keyword</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label>Keyword</Label>
            <Input
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="e.g. best sportsbooks"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label>Check frequency</Label>
            <Select value={frequency} onValueChange={setFrequency}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {[["1h","Every hour"],["2h","Every 2 hours"],["6h","Every 6 hours"],["12h","Every 12 hours"],["24h","Every 24 hours"]].map(([v,l]) => (
                  <SelectItem key={v} value={v}>{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Group <span className="text-muted-foreground text-xs">(optional)</span></Label>
            <Select value={groupId ?? "none"} onValueChange={(v) => setGroupId(v === "none" ? undefined : v)}>
              <SelectTrigger><SelectValue placeholder="No group" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No group</SelectItem>
                {groups.map((g) => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Properties</Label>
            <div className="flex flex-wrap gap-1.5">
              {properties.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => toggleProperty(p.id)}
                  className={cn(
                    "text-xs px-2.5 py-1 rounded-full border transition-all",
                    selectedPropertyIds.includes(p.id)
                      ? "bg-primary/20 border-primary text-primary"
                      : "border-border text-muted-foreground hover:border-primary/50"
                  )}
                >
                  {p.displayName}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Locations</Label>
            <Popover open={locationOpen} onOpenChange={setLocationOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="w-full justify-start font-normal">
                  {selectedLocationIds.length === 0
                    ? "Select locations…"
                    : `${selectedLocationIds.length} selected`}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-0 w-64" align="start">
                <Command>
                  <CommandInput placeholder="Search locations…" />
                  <CommandList>
                    <CommandEmpty>No locations found.</CommandEmpty>
                    <CommandGroup>
                      {locations.map((loc) => (
                        <CommandItem key={loc.id} onSelect={() => toggleLocation(loc.id)}>
                          <Check className={cn("mr-2 h-4 w-4", selectedLocationIds.includes(loc.id) ? "opacity-100" : "opacity-0")} />
                          {loc.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {selectedLocationIds.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {selectedLocationIds.map((id) => {
                  const loc = locations.find((l) => l.id === id)
                  return loc ? (
                    <Badge key={id} variant="secondary" className="text-xs gap-1">
                      {loc.name}
                      <button type="button" onClick={() => toggleLocation(id)}><X size={10} /></button>
                    </Badge>
                  ) : null
                })}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              type="submit"
              disabled={pending || !term || selectedPropertyIds.length === 0 || selectedLocationIds.length === 0}
              className="glow-primary-sm"
            >
              {pending ? "Adding…" : "Add Keyword"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
