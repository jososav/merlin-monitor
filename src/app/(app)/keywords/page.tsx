import { requireRealm } from "@/lib/auth"
import { getKeywords, getKeywordGroups, getSearchLocations } from "@/features/keywords/queries"
import { getProperties } from "@/features/properties/queries"
import { KeywordsPageClient } from "@/features/keywords/components/keywords-page-client"

export default async function KeywordsPage() {
  const { realm } = await requireRealm()

  const [keywords, groups, properties, locations] = await Promise.all([
    getKeywords(realm.id),
    getKeywordGroups(realm.id),
    getProperties(realm.id),
    getSearchLocations(),
  ])

  return (
    <KeywordsPageClient
      keywords={keywords}
      groups={groups}
      properties={properties}
      locations={locations}
    />
  )
}
