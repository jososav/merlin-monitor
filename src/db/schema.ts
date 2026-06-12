import {
  pgTable,
  text,
  timestamp,
  integer,
  boolean,
  date,
  uniqueIndex,
  index,
  pgEnum,
} from "drizzle-orm/pg-core"

// ─── Enums ───────────────────────────────────────────────────────────────────

export const realmMemberRoleEnum = pgEnum("realm_member_role", [
  "owner",
  "admin",
  "member",
])

export const checkFrequencyEnum = pgEnum("check_frequency", [
  "1h",
  "2h",
  "6h",
  "12h",
  "24h",
])

export const serpBatchStatusEnum = pgEnum("serp_batch_status", [
  "pending",
  "running",
  "done",
  "failed",
])

export const alertDirectionEnum = pgEnum("alert_direction", [
  "up",
  "down",
  "both",
])

// ─── Tenancy ─────────────────────────────────────────────────────────────────

export const realms = pgTable("realms", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

export const realmMembers = pgTable(
  "realm_members",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    realmId: text("realm_id")
      .notNull()
      .references(() => realms.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull(),
    role: realmMemberRoleEnum("role").notNull().default("member"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [uniqueIndex("realm_members_realm_user_idx").on(t.realmId, t.userId)]
)

// ─── Properties ──────────────────────────────────────────────────────────────

export const properties = pgTable(
  "properties",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    realmId: text("realm_id")
      .notNull()
      .references(() => realms.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    displayName: text("display_name").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [uniqueIndex("properties_realm_url_idx").on(t.realmId, t.url)]
)

// ─── Keywords ────────────────────────────────────────────────────────────────

export const keywords = pgTable(
  "keywords",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    realmId: text("realm_id")
      .notNull()
      .references(() => realms.id, { onDelete: "cascade" }),
    term: text("term").notNull(),
    checkFrequency: checkFrequencyEnum("check_frequency").notNull().default("24h"),
    nextCheckAt: timestamp("next_check_at").notNull().defaultNow(),
    lastCheckedAt: timestamp("last_checked_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("keywords_realm_term_idx").on(t.realmId, t.term),
    index("keywords_next_check_idx").on(t.nextCheckAt),
  ]
)

export const keywordGroups = pgTable(
  "keyword_groups",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    realmId: text("realm_id")
      .notNull()
      .references(() => realms.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  }
)

export const keywordGroupMembers = pgTable(
  "keyword_group_members",
  {
    keywordId: text("keyword_id")
      .notNull()
      .references(() => keywords.id, { onDelete: "cascade" }),
    groupId: text("group_id")
      .notNull()
      .references(() => keywordGroups.id, { onDelete: "cascade" }),
  },
  (t) => [uniqueIndex("keyword_group_members_idx").on(t.keywordId, t.groupId)]
)

// ─── Locations ────────────────────────────────────────────────────────────────

export const searchLocations = pgTable("search_locations", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  serpApiValue: text("serp_api_value").notNull().unique(),
  countryCode: text("country_code").notNull(),
  languageCode: text("language_code").notNull().default("en"),
})

// ─── Keyword → Property → Location (tracking unit) ───────────────────────────

export const keywordPropertyLocations = pgTable(
  "keyword_property_locations",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    keywordId: text("keyword_id")
      .notNull()
      .references(() => keywords.id, { onDelete: "cascade" }),
    propertyId: text("property_id")
      .notNull()
      .references(() => properties.id, { onDelete: "cascade" }),
    locationId: text("location_id")
      .notNull()
      .references(() => searchLocations.id, { onDelete: "restrict" }),
    isActive: boolean("is_active").notNull().default(true),
  },
  (t) => [
    uniqueIndex("kpl_unique_idx").on(t.keywordId, t.propertyId, t.locationId),
  ]
)

// ─── Rankings (main time-series table) ───────────────────────────────────────

export const rankings = pgTable(
  "rankings",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    keywordId: text("keyword_id")
      .notNull()
      .references(() => keywords.id, { onDelete: "cascade" }),
    propertyId: text("property_id")
      .notNull()
      .references(() => properties.id, { onDelete: "cascade" }),
    locationId: text("location_id")
      .notNull()
      .references(() => searchLocations.id, { onDelete: "restrict" }),
    // null = keyword not found in top 100 results
    position: integer("position"),
    url: text("url"),
    title: text("title"),
    date: date("date").notNull(),
    checkedAt: timestamp("checked_at").notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("rankings_unique_day_idx").on(
      t.keywordId,
      t.propertyId,
      t.locationId,
      t.date
    ),
    index("rankings_keyword_date_idx").on(t.keywordId, t.date),
    index("rankings_property_date_idx").on(t.propertyId, t.date),
  ]
)

// ─── SERP Batches (job queue) ────────────────────────────────────────────────

export const serpBatches = pgTable(
  "serp_batches",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    keywordId: text("keyword_id")
      .notNull()
      .references(() => keywords.id, { onDelete: "cascade" }),
    propertyId: text("property_id")
      .notNull()
      .references(() => properties.id, { onDelete: "cascade" }),
    locationId: text("location_id")
      .notNull()
      .references(() => searchLocations.id, { onDelete: "restrict" }),
    status: serpBatchStatusEnum("status").notNull().default("pending"),
    scheduledAt: timestamp("scheduled_at").notNull().defaultNow(),
    startedAt: timestamp("started_at"),
    completedAt: timestamp("completed_at"),
    error: text("error"),
  },
  (t) => [index("serp_batches_status_idx").on(t.status)]
)

// ─── Competitors ─────────────────────────────────────────────────────────────

export const competitors = pgTable(
  "competitors",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    propertyId: text("property_id")
      .notNull()
      .references(() => properties.id, { onDelete: "cascade" }),
    competitorUrl: text("competitor_url").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("competitors_property_url_idx").on(
      t.propertyId,
      t.competitorUrl
    ),
  ]
)

// ─── Alert Rules ─────────────────────────────────────────────────────────────

export const alertRules = pgTable("alert_rules", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  realmId: text("realm_id")
    .notNull()
    .references(() => realms.id, { onDelete: "cascade" }),
  keywordId: text("keyword_id")
    .notNull()
    .references(() => keywords.id, { onDelete: "cascade" }),
  propertyId: text("property_id")
    .notNull()
    .references(() => properties.id, { onDelete: "cascade" }),
  threshold: integer("threshold").notNull(),
  direction: alertDirectionEnum("direction").notNull().default("both"),
  targetEmail: text("target_email").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

// ─── Report Tokens ────────────────────────────────────────────────────────────

export const reportTokens = pgTable("report_tokens", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  realmId: text("realm_id")
    .notNull()
    .references(() => realms.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  config: text("config").notNull(), // JSON string: { propertyId, keywordIds, dateRange }
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})
