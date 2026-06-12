import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as schema from "./schema"
import * as relations from "./relations"

const client = postgres(process.env.DATABASE_URL!, {
  ssl: "require",
  prepare: false, // required for Supabase Transaction Pooler (pgbouncer)
  max: 1,         // serverless: one connection per function instance
})

export const db = drizzle(client, { schema: { ...schema, ...relations } })
