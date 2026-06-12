import { db } from "@/db"
import { properties } from "@/db/schema"
import { eq } from "drizzle-orm"

export async function getProperties(realmId: string) {
  return db.select().from(properties).where(eq(properties.realmId, realmId)).orderBy(properties.createdAt)
}

export type Property = Awaited<ReturnType<typeof getProperties>>[number]
