import { defineConfig } from "drizzle-kit"
import { config } from "dotenv"

config({ path: ".env.local" })

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    // Use Session Pooler (port 5432) or direct URL for migrations — not Transaction Pooler
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL!,
    ssl: true,
  },
})
