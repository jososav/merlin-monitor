"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { Plus, Trash2, Tag } from "lucide-react"
import { createKeywordGroup, deleteKeywordGroup } from "@/features/keywords/actions"
import { toast } from "sonner"
import type { KeywordGroup } from "@/features/keywords/queries"

interface Props {
  groups: KeywordGroup[]
  activeGroupId: string | null
  onGroupChange: (id: string | null) => void
}

export function GroupSidebar({ groups, activeGroupId, onGroupChange }: Props) {
  const [newGroupName, setNewGroupName] = useState("")
  const [adding, setAdding] = useState(false)
  const [showInput, setShowInput] = useState(false)

  async function handleAddGroup(e: React.FormEvent) {
    e.preventDefault()
    if (!newGroupName.trim()) return
    setAdding(true)
    const result = await createKeywordGroup(newGroupName)
    setAdding(false)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(`Group "${newGroupName}" created.`)
      setNewGroupName("")
      setShowInput(false)
    }
  }

  async function handleDeleteGroup(id: string, name: string) {
    await deleteKeywordGroup(id)
    if (activeGroupId === id) onGroupChange(null)
    toast.success(`Group "${name}" deleted.`)
  }

  return (
    <aside className="w-44 shrink-0 space-y-1">
      <button
        onClick={() => onGroupChange(null)}
        className={cn(
          "w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all text-left",
          activeGroupId === null
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:bg-accent hover:text-foreground"
        )}
      >
        <Tag size={14} /> All Keywords
      </button>

      {groups.map((group) => (
        <div key={group.id} className="group flex items-center gap-1">
          <button
            onClick={() => onGroupChange(group.id)}
            className={cn(
              "flex-1 flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-all text-left truncate",
              activeGroupId === group.id
                ? "bg-primary/10 text-primary font-medium"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            )}
          >
            <Tag size={14} className="shrink-0" />
            <span className="truncate">{group.name}</span>
          </button>
          <button
            onClick={() => handleDeleteGroup(group.id, group.name)}
            className="opacity-0 group-hover:opacity-100 p-1 rounded text-muted-foreground hover:text-destructive transition-all"
          >
            <Trash2 size={12} />
          </button>
        </div>
      ))}

      {showInput ? (
        <form onSubmit={handleAddGroup} className="px-1">
          <Input
            autoFocus
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            placeholder="Group name"
            className="h-7 text-xs"
            onBlur={() => { if (!newGroupName) setShowInput(false) }}
          />
          <Button type="submit" size="sm" className="w-full mt-1 h-7 text-xs" disabled={adding}>
            {adding ? "Creating…" : "Create"}
          </Button>
        </form>
      ) : (
        <button
          onClick={() => setShowInput(true)}
          className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <Plus size={12} /> New Group
        </button>
      )}
    </aside>
  )
}
