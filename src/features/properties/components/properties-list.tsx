"use client"

import { Button } from "@/components/ui/button"
import { Trash2, Globe } from "lucide-react"
import { deleteProperty } from "@/features/properties/actions"
import { toast } from "sonner"
import type { Property } from "@/features/properties/queries"

export function PropertiesList({ properties }: { properties: Property[] }) {
  if (properties.length === 0) {
    return <p className="text-sm text-muted-foreground">No properties yet.</p>
  }

  async function handleDelete(id: string, name: string) {
    await deleteProperty(id)
    toast.success(`"${name}" removed.`)
  }

  return (
    <ul className="space-y-2">
      {properties.map((p) => (
        <li key={p.id} className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
          <div className="flex items-center gap-3">
            <Globe size={14} className="text-muted-foreground shrink-0" />
            <div>
              <p className="text-sm font-medium">{p.displayName}</p>
              <p className="text-xs text-muted-foreground">{p.url}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-destructive"
            onClick={() => handleDelete(p.id, p.displayName)}
          >
            <Trash2 size={14} />
          </Button>
        </li>
      ))}
    </ul>
  )
}
