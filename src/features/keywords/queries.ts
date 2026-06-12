import { db } from "@/db"
import { keywords, keywordGroups, keywordGroupMembers, searchLocations, keywordPropertyLocations } from "@/db/schema"
import { eq, inArray } from "drizzle-orm"

export async function getKeywords(realmId: string) {
  const rows = await db.query.keywords.findMany({
    where: eq(keywords.realmId, realmId),
    with: {
      keywordGroupMembers: { with: { group: true } },
      keywordPropertyLocations: { with: { property: true, location: true } },
    },
    orderBy: keywords.createdAt,
  })
  return rows
}

export async function getKeywordGroups(realmId: string) {
  return db.select().from(keywordGroups).where(eq(keywordGroups.realmId, realmId)).orderBy(keywordGroups.name)
}

export async function getSearchLocations() {
  return db.select().from(searchLocations).orderBy(searchLocations.name)
}

export type KeywordWithRelations = Awaited<ReturnType<typeof getKeywords>>[number]
export type KeywordGroup = Awaited<ReturnType<typeof getKeywordGroups>>[number]
export type SearchLocation = Awaited<ReturnType<typeof getSearchLocations>>[number]
