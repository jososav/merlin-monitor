"use server"

import { db } from "@/db"
import { keywords, keywordGroups, keywordGroupMembers, keywordPropertyLocations } from "@/db/schema"
import { requireRealm } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { eq, and } from "drizzle-orm"
import { z } from "zod"

const keywordSchema = z.object({
  term: z.string().min(1, "Keyword is required").max(255),
  checkFrequency: z.enum(["1h", "2h", "6h", "12h", "24h"]).default("24h"),
  groupId: z.string().optional(),
  propertyIds: z.array(z.string()).min(1, "Select at least one property"),
  locationIds: z.array(z.string()).min(1, "Select at least one location"),
})

export async function createKeyword(data: {
  term: string
  checkFrequency: string
  groupId?: string
  propertyIds: string[]
  locationIds: string[]
}) {
  const { realm } = await requireRealm()

  const parsed = keywordSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { term, checkFrequency, groupId, propertyIds, locationIds } = parsed.data

  try {
    const [keyword] = await db
      .insert(keywords)
      .values({ realmId: realm.id, term, checkFrequency: checkFrequency as "1h" | "2h" | "6h" | "12h" | "24h" })
      .returning()

    if (groupId) {
      await db.insert(keywordGroupMembers).values({ keywordId: keyword.id, groupId })
    }

    const kplRows = propertyIds.flatMap((propertyId) =>
      locationIds.map((locationId) => ({ keywordId: keyword.id, propertyId, locationId }))
    )
    if (kplRows.length > 0) {
      await db.insert(keywordPropertyLocations).values(kplRows).onConflictDoNothing()
    }

    revalidatePath("/keywords")
    return { success: true }
  } catch {
    return { error: "A keyword with this term already exists in your Realm." }
  }
}

export async function deleteKeyword(keywordId: string) {
  const { realm } = await requireRealm()
  await db.delete(keywords).where(
    and(eq(keywords.id, keywordId), eq(keywords.realmId, realm.id))
  )
  revalidatePath("/keywords")
}

export async function updateKeywordFrequency(keywordId: string, checkFrequency: string) {
  const { realm } = await requireRealm()
  await db
    .update(keywords)
    .set({ checkFrequency: checkFrequency as "1h" | "2h" | "6h" | "12h" | "24h" })
    .where(and(eq(keywords.id, keywordId), eq(keywords.realmId, realm.id)))
  revalidatePath("/keywords")
}

export async function createKeywordGroup(name: string) {
  const { realm } = await requireRealm()
  if (!name.trim()) return { error: "Group name is required" }

  const [group] = await db
    .insert(keywordGroups)
    .values({ realmId: realm.id, name: name.trim() })
    .returning()

  revalidatePath("/keywords")
  return { group }
}

export async function deleteKeywordGroup(groupId: string) {
  const { realm } = await requireRealm()
  await db.delete(keywordGroups).where(
    and(eq(keywordGroups.id, groupId), eq(keywordGroups.realmId, realm.id))
  )
  revalidatePath("/keywords")
}
