"use server"

import { db } from "@/db"
import { properties } from "@/db/schema"
import { requireRealm } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { eq, and } from "drizzle-orm"
import { z } from "zod"

const propertySchema = z.object({
  url: z.string().url("Must be a valid URL"),
  displayName: z.string().min(1, "Display name is required").max(100),
})

export async function createProperty(formData: FormData) {
  const { realm } = await requireRealm()

  const parsed = propertySchema.safeParse({
    url: formData.get("url"),
    displayName: formData.get("displayName"),
  })

  if (!parsed.success) return { error: parsed.error.issues[0].message }

  try {
    await db.insert(properties).values({ realmId: realm.id, ...parsed.data })
    revalidatePath("/settings")
    return { success: true }
  } catch {
    return { error: "A property with this URL already exists." }
  }
}

export async function deleteProperty(propertyId: string) {
  const { realm } = await requireRealm()
  await db.delete(properties).where(
    and(eq(properties.id, propertyId), eq(properties.realmId, realm.id))
  )
  revalidatePath("/settings")
}
