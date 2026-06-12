import { NextResponse } from "next/server"
import { db } from "@/db"
import { keywords } from "@/db/schema"
import { eq, and } from "drizzle-orm"
import { createClient } from "@/lib/supabase/server"
import { getCurrentRealm } from "@/lib/auth"

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const realm = await getCurrentRealm(user.id)
  if (!realm) return NextResponse.json({ error: "No realm" }, { status: 403 })

  const { keywordId } = await request.json()
  if (!keywordId) return NextResponse.json({ error: "keywordId required" }, { status: 400 })

  // Mark keyword as due now so next cron tick picks it up
  await db
    .update(keywords)
    .set({ nextCheckAt: new Date() })
    .where(and(eq(keywords.id, keywordId), eq(keywords.realmId, realm.id)))

  return NextResponse.json({ queued: true })
}
