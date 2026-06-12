"use server"

import { db } from "@/db"
import { reportTokens, properties } from "@/db/schema"
import { requireRealm } from "@/lib/auth"
import { eq, and } from "drizzle-orm"

export async function getOrCreateBoard(
  propertyId: string
): Promise<{ token?: string; error?: string }> {
  const { realm } = await requireRealm()

  const [property] = await db
    .select()
    .from(properties)
    .where(and(eq(properties.id, propertyId), eq(properties.realmId, realm.id)))

  if (!property) return { error: "Property not found" }

  // Look for an existing board token for this property
  const existing = await db
    .select()
    .from(reportTokens)
    .where(eq(reportTokens.realmId, realm.id))

  const existingBoard = existing.find((t) => {
    try {
      const config = JSON.parse(t.config)
      return config.type === "board" && config.propertyId === propertyId
    } catch {
      return false
    }
  })

  if (existingBoard) return { token: existingBoard.token }

  const token = crypto.randomUUID().replace(/-/g, "")
  await db.insert(reportTokens).values({
    realmId: realm.id,
    token,
    config: JSON.stringify({
      type: "board",
      propertyId,
      propertyName: property.displayName,
      realmName: realm.name,
    }),
  })

  return { token }
}
