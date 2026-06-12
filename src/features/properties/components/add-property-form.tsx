"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createProperty } from "@/features/properties/actions"
import { toast } from "sonner"
import { Plus } from "lucide-react"

export function AddPropertyForm() {
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPending(true)
    const formData = new FormData(e.currentTarget)
    const result = await createProperty(formData)
    setPending(false)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("Property added.")
      setOpen(false)
      ;(e.target as HTMLFormElement).reset()
    }
  }

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Plus size={14} className="mr-1.5" /> Add Property
      </Button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border border-border bg-card p-4">
      <div className="space-y-1.5">
        <Label htmlFor="url">URL</Label>
        <Input id="url" name="url" type="url" placeholder="https://example.com" required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="displayName">Display name</Label>
        <Input id="displayName" name="displayName" placeholder="Example.com" required />
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={pending} className="glow-primary-sm">
          {pending ? "Adding…" : "Add Property"}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
      </div>
    </form>
  )
}
