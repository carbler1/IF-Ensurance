import { integer, pgTable, real, text } from "drizzle-orm/pg-core";

// The tables the dashboard uses. backend/models.py owns them and creates them on start;
// keep each table here in step with its model there. Times are ISO strings, JSON columns are text.

export const homes = pgTable("homes", {
  homeId: text("home_id").primaryKey(),
  street: text("street").notNull(),
  postalCode: text("postal_code").notNull(),
  city: text("city").notNull(),
  createdAt: text("created_at").notNull(),
});

export const profiles = pgTable("profiles", {
  homeId: text("home_id").primaryKey(),
  profile: text("profile").notNull(), // JSON, the 20 fields of data/home-profile.schema.json
  updatedAt: text("updated_at").notNull(),
});

export const documents = pgTable("documents", {
  documentId: text("document_id").primaryKey(),
  homeId: text("home_id").notNull(),
  type: text("type").notNull(),
  uploadedAt: text("uploaded_at").notNull(),
  status: text("status").notNull(),
});

export const workOrders = pgTable("work_orders", {
  workOrderId: text("work_order_id").primaryKey(),
  homeId: text("home_id").notNull(),
  riskId: text("risk_id").notNull(),
  partnerId: text("partner_id").notNull(),
  status: text("status").notNull(),
  createdAt: text("created_at").notNull(),
  confirmedAt: text("confirmed_at"),
});

export const partners = pgTable("partners", {
  partnerId: text("partner_id").primaryKey(),
  name: text("name").notNull(),
  categories: text("categories").notNull(), // JSON list
  area: text("area").notNull(),
  priceMin: integer("price_min").notNull(),
  priceMax: integer("price_max").notNull(),
  rating: real("rating").notNull(),
  ifVetted: integer("if_vetted").notNull(),
  tierDiscountPercent: integer("tier_discount_percent").notNull(),
  listingFeeTier: text("listing_fee_tier").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const tiers = pgTable("tiers", {
  tierIndex: integer("tier_index").primaryKey(),
  name: text("name").notNull(),
  minScore: integer("min_score").notNull(),
  deductibleReductionEur: integer("deductible_reduction_eur").notNull(),
  freeCheckups: text("free_checkups").notNull(), // JSON list
  partnerDiscountPercent: integer("partner_discount_percent").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const fixRules = pgTable("fix_rules", {
  ruleId: text("rule_id").primaryKey(),
  riskId: text("risk_id").notNull(),
  label: text("label").notNull(),
  context: text("context"), // JSON condition, or null for any home
  priority: integer("priority").notNull(),
  points: integer("points").notNull(),
  halfLifeYears: integer("half_life_years").notNull(),
  premiumReductionEur: integer("premium_reduction_eur").notNull(),
  active: integer("active").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const insuranceSettings = pgTable("insurance_settings", {
  settingsId: integer("settings_id").primaryKey(),
  scoreStart: integer("score_start").notNull(),
  baseAnnualPremiumEur: integer("base_annual_premium_eur").notNull(),
  maxReductionPercent: integer("max_reduction_percent").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const referenceData = pgTable("reference_data", {
  key: text("key").primaryKey(),
  data: text("data").notNull(),
  updatedAt: text("updated_at").notNull(),
});
