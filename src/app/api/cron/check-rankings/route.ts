import { NextResponse } from "next/server"
import { db } from "@/db"
import { keywords, keywordPropertyLocations, rankings, serpBatches } from "@/db/schema"
import { lte, eq, and } from "drizzle-orm"
import { checkKeyword, computeNextCheckAt } from "@/lib/serp"
import { sql } from "drizzle-orm"

const BATCH_SIZE = 50

export async function GET(request: Request) {
  // Verify cron secret
  const auth = request.headers.get("authorization")
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const now = new Date()

  // Find keywords due for a check
  const dueKeywords = await db.query.keywords.findMany({
    where: lte(keywords.nextCheckAt, now),
    with: {
      keywordPropertyLocations: {
        where: eq(keywordPropertyLocations.isActive, true),
        with: { property: true, location: true },
      },
    },
    limit: BATCH_SIZE,
  })

  if (dueKeywords.length === 0) {
    return NextResponse.json({ checked: 0, message: "Nothing due." })
  }

  let checked = 0
  let errors = 0
  const today = now.toISOString().split("T")[0]

  for (const keyword of dueKeywords) {
    for (const kpl of keyword.keywordPropertyLocations) {
      const [batch] = await db
        .insert(serpBatches)
        .values({
          keywordId: keyword.id,
          propertyId: kpl.property.id,
          locationId: kpl.location.id,
          status: "running",
          startedAt: now,
        })
        .returning()

      try {
        const result = await checkKeyword({
          term: keyword.term,
          location: kpl.location.serpApiValue,
          propertyUrl: kpl.property.url,
        })

        // Upsert ranking — one row per (keyword, property, location, date)
        await db
          .insert(rankings)
          .values({
            keywordId: keyword.id,
            propertyId: kpl.property.id,
            locationId: kpl.location.id,
            position: result.position,
            url: result.url,
            title: result.title,
            date: today,
            checkedAt: now,
          })
          .onConflictDoUpdate({
            target: [rankings.keywordId, rankings.propertyId, rankings.locationId, rankings.date],
            set: {
              position: result.position,
              url: result.url,
              title: result.title,
              checkedAt: now,
            },
          })

        await db
          .update(serpBatches)
          .set({ status: "done", completedAt: now })
          .where(eq(serpBatches.id, batch.id))

        checked++
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error"
        await db
          .update(serpBatches)
          .set({ status: "failed", completedAt: now, error: message })
          .where(eq(serpBatches.id, batch.id))
        errors++
      }
    }

    // Update keyword timestamps regardless of individual location errors
    await db
      .update(keywords)
      .set({
        lastCheckedAt: now,
        nextCheckAt: computeNextCheckAt(keyword.checkFrequency),
      })
      .where(eq(keywords.id, keyword.id))
  }

  return NextResponse.json({
    checked,
    errors,
    keywords: dueKeywords.length,
  })
}
