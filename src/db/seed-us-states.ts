import { config } from "dotenv"
config({ path: ".env.local" })

import postgres from "postgres"
import { drizzle } from "drizzle-orm/postgres-js"
import { searchLocations } from "./schema"
import { sql } from "drizzle-orm"

const US_STATES = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California",
  "Colorado", "Connecticut", "Delaware", "Florida", "Georgia",
  "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa",
  "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland",
  "Massachusetts", "Michigan", "Minnesota", "Mississippi", "Missouri",
  "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey",
  "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio",
  "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina",
  "South Dakota", "Tennessee", "Texas", "Utah", "Vermont",
  "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming",
  "District of Columbia",
]

async function seedUsStates() {
  const client = postgres(process.env.DATABASE_URL!, { ssl: "require", prepare: false })
  const db = drizzle(client)

  const rows = US_STATES.map((state) => ({
    id: crypto.randomUUID(),
    name: state,
    serpApiValue: `${state}, United States`,
    countryCode: "us",
    languageCode: "en",
  }))

  await db
    .insert(searchLocations)
    .values(rows)
    .onConflictDoNothing()

  console.log(`Seeded ${rows.length} US states.`)
  await client.end()
}

seedUsStates().catch((e) => { console.error(e); process.exit(1) })
