"use server"

import { db } from "@/db"
import { realms, realmMembers, properties } from "@/db/schema"
import { requireUser } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"

const onboardingSchema = z.object({
  realmName: z.string().min(1).max(100),
  propertyUrl: z.string().url(),
  propertyDisplayName: z.string().min(1).max(100),
})

export async function createRealmWithProperty(formData: FormData) {
  const user = await requireUser()

  const parsed = onboardingSchema.safeParse({
    realmName: formData.get("realmName"),
    propertyUrl: formData.get("propertyUrl"),
    propertyDisplayName: formData.get("propertyDisplayName"),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const { realmName, propertyUrl, propertyDisplayName } = parsed.data

  const slug = realmName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")

  const [realm] = await db.insert(realms).values({ name: realmName, slug }).returning()

  await db.insert(realmMembers).values({
    realmId: realm.id,
    userId: user.id,
    role: "owner",
  })

  await db.insert(properties).values({
    realmId: realm.id,
    url: propertyUrl,
    displayName: propertyDisplayName,
  })

  revalidatePath("/dashboard")
  redirect("/dashboard")
}
