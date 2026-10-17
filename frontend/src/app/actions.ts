"use server";

import { randomBytes } from "node:crypto";
import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db, fixRules, insuranceSettings, partners, tiers } from "@/db";
import type { Condition } from "@/lib/match";

export type SaveState = { ok: boolean; message: string } | null;

const now = () => new Date().toISOString().replace(/\.\d{3}Z$/, "Z");

class Invalid extends Error {}

function int(form: FormData, key: string, min = 0, max = Number.MAX_SAFE_INTEGER): number {
  const raw = String(form.get(key) ?? "").trim();
  const n = Number(raw);
  if (raw === "" || !Number.isInteger(n) || n < min || n > max) throw new Invalid(`Enter a whole number from ${min} to ${max === Number.MAX_SAFE_INTEGER ? "up" : max}.`);
  return n;
}

async function save(run: () => Promise<unknown>, ...paths: string[]): Promise<SaveState> {
  try {
    await run();
  } catch (e) {
    return { ok: false, message: e instanceof Invalid ? e.message : "Saving failed. Check that the database is running." };
  }
  paths.forEach((p) => revalidatePath(p));
  return { ok: true, message: "Saved" };
}

export async function savePartner(_: SaveState, form: FormData): Promise<SaveState> {
  return save(async () => {
    const priceMin = int(form, "price_min");
    const priceMax = int(form, "price_max");
    if (priceMin > priceMax) throw new Invalid("The minimum price is above the maximum price.");
    await db
      .update(partners)
      .set({
        priceMin,
        priceMax,
        tierDiscountPercent: int(form, "tier_discount_percent", 0, 100),
        ifVetted: form.get("if_vetted") === "on" ? 1 : 0,
        listingFeeTier: form.get("listing_fee_tier") === "plus" ? "plus" : "basic",
        updatedAt: now(),
      })
      .where(eq(partners.partnerId, String(form.get("partner_id"))));
  }, "/partners");
}

export async function saveTier(_: SaveState, form: FormData): Promise<SaveState> {
  return save(async () => {
    const index = int(form, "index");
    const minScore = int(form, "min_score");
    const name = String(form.get("name") ?? "").trim();
    if (!name || name.length > 40) throw new Invalid("Give the tier a name of 1 to 40 characters.");
    // Tiers are a ladder: each one starts above the tier below it.
    const others = await db.select({ index: tiers.tierIndex, minScore: tiers.minScore }).from(tiers).where(ne(tiers.tierIndex, index));
    const below = others.filter((t) => t.index < index).map((t) => t.minScore);
    const above = others.filter((t) => t.index > index).map((t) => t.minScore);
    if ((below.length && minScore <= Math.max(...below)) || (above.length && minScore >= Math.min(...above)))
      throw new Invalid("The minimum score must sit between the tiers below and above.");
    await db
      .update(tiers)
      .set({
        name,
        minScore,
        deductibleReductionEur: int(form, "deductible_reduction_eur"),
        partnerDiscountPercent: int(form, "partner_discount_percent", 0, 100),
        freeCheckups: JSON.stringify(String(form.get("free_checkups") ?? "").split(",").map((c) => c.trim()).filter(Boolean)),
        updatedAt: now(),
      })
      .where(eq(tiers.tierIndex, index));
  }, "/tiers", "/simulator");
}

export async function saveSettings(_: SaveState, form: FormData): Promise<SaveState> {
  return save(async () => {
    await db
      .update(insuranceSettings)
      .set({
        scoreStart: int(form, "score_start"),
        baseAnnualPremiumEur: int(form, "base_annual_premium_eur"),
        maxReductionPercent: int(form, "max_reduction_percent", 0, 100),
        updatedAt: now(),
      })
      .where(eq(insuranceSettings.settingsId, 1));
  }, "/scoring", "/simulator", "/");
}

function ruleNumbers(form: FormData) {
  return {
    points: int(form, "points", 0, 10000),
    halfLifeYears: int(form, "half_life_years", 1, 100),
    premiumReductionEur: int(form, "premium_reduction_eur", 0, 100000),
  };
}

export async function saveRule(_: SaveState, form: FormData): Promise<SaveState> {
  return save(async () => {
    const ruleId = String(form.get("rule_id"));
    const isDefault = ruleId.startsWith("default.");
    await db
      .update(fixRules)
      .set({
        ...ruleNumbers(form),
        // The default rule always applies last, so its priority stays 0.
        ...(isDefault ? {} : { priority: int(form, "priority", 1, 1000) }),
        active: form.get("active") === "on" ? 1 : 0,
        updatedAt: now(),
      })
      .where(eq(fixRules.ruleId, ruleId));
  }, "/scoring", "/simulator");
}

const FIELD = /^[a-z_]+$/;

function parseContext(raw: string): Condition {
  let c: unknown;
  try {
    c = JSON.parse(raw);
  } catch {
    throw new Invalid("The context is not valid.");
  }
  const ok = (n: unknown): boolean => {
    if (!n || typeof n !== "object") return false;
    const x = n as Record<string, unknown>;
    if (x.op === "and" || x.op === "or") return Array.isArray(x.args) && x.args.length > 0 && x.args.every(ok);
    if (x.op === "not") return Array.isArray(x.args) && x.args.length === 1 && ok(x.args[0]);
    if (typeof x.field !== "string" || !FIELD.test(x.field)) return false;
    if (x.op === "exists") return true;
    if (x.op === "in") return Array.isArray(x.value) && x.value.length > 0;
    return (x.op === "lt" || x.op === "gt" || x.op === "eq") && (typeof x.value === "number" || typeof x.value === "string");
  };
  if (!ok(c)) throw new Invalid("Add at least one complete condition.");
  return c as Condition;
}

export async function addRule(_: SaveState, form: FormData): Promise<SaveState> {
  return save(async () => {
    const label = String(form.get("label") ?? "").trim();
    if (!label || label.length > 80) throw new Invalid("Name the context in 1 to 80 characters.");
    const context = parseContext(String(form.get("context") ?? ""));
    await db.insert(fixRules).values({
      ruleId: `rule_${randomBytes(4).toString("hex")}`,
      riskId: String(form.get("risk_id")),
      label,
      context: JSON.stringify(context),
      priority: int(form, "priority", 1, 1000),
      ...ruleNumbers(form),
      active: 1,
      updatedAt: now(),
    });
  }, "/scoring", "/simulator");
}

export async function deleteRule(form: FormData): Promise<void> {
  const ruleId = String(form.get("rule_id"));
  // Default rules are the fallback for every home; they can be switched off but not deleted.
  if (ruleId.startsWith("default.")) return;
  await db.delete(fixRules).where(and(eq(fixRules.ruleId, ruleId), ne(fixRules.priority, 0)));
  revalidatePath("/scoring");
  revalidatePath("/simulator");
}
