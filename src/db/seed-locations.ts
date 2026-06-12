import { db } from "./index"
import { searchLocations } from "./schema"
import { sql } from "drizzle-orm"

const LOCATIONS = [
  { name: "United States", serpApiValue: "United States", countryCode: "us", languageCode: "en" },
  { name: "United Kingdom", serpApiValue: "United Kingdom", countryCode: "uk", languageCode: "en" },
  { name: "Canada", serpApiValue: "Canada", countryCode: "ca", languageCode: "en" },
  { name: "Australia", serpApiValue: "Australia", countryCode: "au", languageCode: "en" },
  { name: "India", serpApiValue: "India", countryCode: "in", languageCode: "en" },
  { name: "Germany", serpApiValue: "Germany", countryCode: "de", languageCode: "de" },
  { name: "France", serpApiValue: "France", countryCode: "fr", languageCode: "fr" },
  { name: "Spain", serpApiValue: "Spain", countryCode: "es", languageCode: "es" },
  { name: "Mexico", serpApiValue: "Mexico", countryCode: "mx", languageCode: "es" },
  { name: "Brazil", serpApiValue: "Brazil", countryCode: "br", languageCode: "pt" },
  { name: "Netherlands", serpApiValue: "Netherlands", countryCode: "nl", languageCode: "nl" },
  { name: "Italy", serpApiValue: "Italy", countryCode: "it", languageCode: "it" },
  { name: "Japan", serpApiValue: "Japan", countryCode: "jp", languageCode: "ja" },
  { name: "New Zealand", serpApiValue: "New Zealand", countryCode: "nz", languageCode: "en" },
  { name: "South Africa", serpApiValue: "South Africa", countryCode: "za", languageCode: "en" },
]

async function seed() {
  console.log("Seeding search locations…")
  await db
    .insert(searchLocations)
    .values(LOCATIONS)
    .onConflictDoNothing({ target: searchLocations.serpApiValue })
  console.log(`Seeded ${LOCATIONS.length} locations.`)
  process.exit(0)
}

seed().catch((e) => { console.error(e); process.exit(1) })
