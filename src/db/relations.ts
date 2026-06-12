import { relations } from "drizzle-orm"
import {
  realms,
  realmMembers,
  properties,
  keywords,
  keywordGroups,
  keywordGroupMembers,
  searchLocations,
  keywordPropertyLocations,
  rankings,
  serpBatches,
  competitors,
  alertRules,
  reportTokens,
} from "./schema"

export const realmsRelations = relations(realms, ({ many }) => ({
  members: many(realmMembers),
  properties: many(properties),
  keywords: many(keywords),
  keywordGroups: many(keywordGroups),
}))

export const realmMembersRelations = relations(realmMembers, ({ one }) => ({
  realm: one(realms, { fields: [realmMembers.realmId], references: [realms.id] }),
}))

export const propertiesRelations = relations(properties, ({ one, many }) => ({
  realm: one(realms, { fields: [properties.realmId], references: [realms.id] }),
  keywordPropertyLocations: many(keywordPropertyLocations),
  competitors: many(competitors),
  rankings: many(rankings),
}))

export const keywordsRelations = relations(keywords, ({ one, many }) => ({
  realm: one(realms, { fields: [keywords.realmId], references: [realms.id] }),
  keywordGroupMembers: many(keywordGroupMembers),
  keywordPropertyLocations: many(keywordPropertyLocations),
  rankings: many(rankings),
}))

export const keywordGroupsRelations = relations(keywordGroups, ({ one, many }) => ({
  realm: one(realms, { fields: [keywordGroups.realmId], references: [realms.id] }),
  members: many(keywordGroupMembers),
}))

export const keywordGroupMembersRelations = relations(keywordGroupMembers, ({ one }) => ({
  keyword: one(keywords, { fields: [keywordGroupMembers.keywordId], references: [keywords.id] }),
  group: one(keywordGroups, { fields: [keywordGroupMembers.groupId], references: [keywordGroups.id] }),
}))

export const searchLocationsRelations = relations(searchLocations, ({ many }) => ({
  keywordPropertyLocations: many(keywordPropertyLocations),
}))

export const keywordPropertyLocationsRelations = relations(keywordPropertyLocations, ({ one }) => ({
  keyword: one(keywords, { fields: [keywordPropertyLocations.keywordId], references: [keywords.id] }),
  property: one(properties, { fields: [keywordPropertyLocations.propertyId], references: [properties.id] }),
  location: one(searchLocations, { fields: [keywordPropertyLocations.locationId], references: [searchLocations.id] }),
}))

export const rankingsRelations = relations(rankings, ({ one }) => ({
  keyword: one(keywords, { fields: [rankings.keywordId], references: [keywords.id] }),
  property: one(properties, { fields: [rankings.propertyId], references: [properties.id] }),
  location: one(searchLocations, { fields: [rankings.locationId], references: [searchLocations.id] }),
}))

export const serpBatchesRelations = relations(serpBatches, ({ one }) => ({
  keyword: one(keywords, { fields: [serpBatches.keywordId], references: [keywords.id] }),
  property: one(properties, { fields: [serpBatches.propertyId], references: [properties.id] }),
  location: one(searchLocations, { fields: [serpBatches.locationId], references: [searchLocations.id] }),
}))

export const competitorsRelations = relations(competitors, ({ one }) => ({
  property: one(properties, { fields: [competitors.propertyId], references: [properties.id] }),
}))

export const alertRulesRelations = relations(alertRules, ({ one }) => ({
  realm: one(realms, { fields: [alertRules.realmId], references: [realms.id] }),
  keyword: one(keywords, { fields: [alertRules.keywordId], references: [keywords.id] }),
  property: one(properties, { fields: [alertRules.propertyId], references: [properties.id] }),
}))

export const reportTokensRelations = relations(reportTokens, ({ one }) => ({
  realm: one(realms, { fields: [reportTokens.realmId], references: [realms.id] }),
}))
