import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { db } from "@/db"
import { realmMembers, realms } from "@/db/schema"
import { eq } from "drizzle-orm"

export async function getUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function requireUser() {
  const user = await getUser()
  if (!user) redirect("/login")
  return user
}

export async function getCurrentRealm(userId: string) {
  const member = await db.query.realmMembers.findFirst({
    where: eq(realmMembers.userId, userId),
    with: { realm: true },
  })
  return member?.realm ?? null
}

export async function requireRealm() {
  const user = await requireUser()
  const realm = await getCurrentRealm(user.id)
  if (!realm) redirect("/onboarding")
  return { user, realm }
}
