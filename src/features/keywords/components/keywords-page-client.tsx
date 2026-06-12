"use client"

import { useState } from "react"
import { GroupSidebar } from "./group-sidebar"
import { KeywordsTable } from "./keywords-table"
import { AddKeywordDialog } from "./add-keyword-dialog"
import type { KeywordWithRelations, KeywordGroup, SearchLocation } from "@/features/keywords/queries"
import type { Property } from "@/features/properties/queries"

interface Props {
  keywords: KeywordWithRelations[]
  groups: KeywordGroup[]
  properties: Property[]
  locations: SearchLocation[]
}

export function KeywordsPageClient({ keywords, groups, properties, locations }: Props) {
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Keywords</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {keywords.length} keyword{keywords.length !== 1 ? "s" : ""} tracked
          </p>
        </div>
        <AddKeywordDialog properties={properties} groups={groups} locations={locations} />
      </div>

      <div className="flex gap-6">
        <GroupSidebar
          groups={groups}
          activeGroupId={activeGroupId}
          onGroupChange={setActiveGroupId}
        />
        <div className="flex-1 min-w-0">
          <KeywordsTable keywords={keywords} activeGroupId={activeGroupId} />
        </div>
      </div>
    </div>
  )
}
