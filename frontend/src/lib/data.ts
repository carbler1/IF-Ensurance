import "server-only";
import { asc, count, eq, max } from "drizzle-orm";
import { connection } from "next/server";
import { db, documents, fixRules, homes, insuranceSettings, partners, profiles, referenceData, tiers, workOrders } from "@/db";
import type { Condition, Profile } from "./match";
import type { CatalogueEntry, Rule, Settings, TierRow } from "./math";

// Reads wait for a request, so a build never touches the database.

export class DataError extends Error {}

async function guard<T>(run: () => Promise<T>): Promise<T> {
  await connection();
  try {
    return await run();
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (/relation .* does not exist/.test(msg)) throw new DataError("The tables do not exist yet. Start the backend once; it creates them.");
    throw new DataError(`The database is not reachable (${msg}).`);
  }
}

export type ProfileField = { name: string; description: string; kind: "enum" | "year" | "date"; options: string[] };

async function reference<T>(key: string): Promise<T> {
  const [row] = await db.select().from(referenceData).where(eq(referenceData.key, key));
  if (!row) throw new DataError(`Reference data "${key}" is missing. Start the backend once; it copies it in.`);
  return JSON.parse(row.data) as T;
}

export const getCatalogue = () =>
  guard(async () => (await reference<{ entries: CatalogueEntry[] }>("catalogue")).entries);

export const getProfileFields = () =>
  guard(async () => {
    type Schema = { properties: Record<string, { description: string; properties: { value: { enum?: string[]; $ref?: string } } }> };
    const schema = await reference<Schema>("profile_schema");
    return Object.entries(schema.properties).map(([name, p]): ProfileField => {
      const v = p.properties.value;
      const kind = v.enum ? "enum" : v.$ref?.endsWith("/date") ? "date" : "year";
      return { name, description: p.description, kind, options: (v.enum ?? []).filter((o) => o !== "unknown") };
    });
  });

export const getRules = () =>
  guard(async () =>
    (await db.select().from(fixRules).orderBy(asc(fixRules.riskId), asc(fixRules.priority), asc(fixRules.ruleId))).map(
      (r): Rule => ({
        ruleId: r.ruleId,
        riskId: r.riskId,
        label: r.label,
        context: r.context ? (JSON.parse(r.context) as Condition) : null,
        priority: r.priority,
        points: r.points,
        halfLifeYears: r.halfLifeYears,
        premiumReductionEur: r.premiumReductionEur,
        active: r.active === 1,
      }),
    ),
  );

export const getSettings = () =>
  guard(async (): Promise<Settings> => {
    const [s] = await db.select().from(insuranceSettings).where(eq(insuranceSettings.settingsId, 1));
    if (!s) throw new DataError("Insurance settings are missing. Start the backend once; it seeds them.");
    return { scoreStart: s.scoreStart, baseAnnualPremiumEur: s.baseAnnualPremiumEur, maxReductionPercent: s.maxReductionPercent };
  });

export type Tier = TierRow & { partnerDiscountPercent: number; freeCheckups: string[] };

export const getTiers = () =>
  guard(async () =>
    (await db.select().from(tiers).orderBy(asc(tiers.tierIndex))).map(
      (t): Tier => ({
        index: t.tierIndex,
        name: t.name,
        minScore: t.minScore,
        deductibleReductionEur: t.deductibleReductionEur,
        partnerDiscountPercent: t.partnerDiscountPercent,
        freeCheckups: JSON.parse(t.freeCheckups) as string[],
      }),
    ),
  );

export type Partner = {
  partnerId: string;
  name: string;
  categories: string[];
  area: string;
  priceMin: number;
  priceMax: number;
  rating: number;
  ifVetted: boolean;
  tierDiscountPercent: number;
  listingFeeTier: "basic" | "plus";
};

export const getPartners = () =>
  guard(async () =>
    (await db.select().from(partners).orderBy(asc(partners.partnerId))).map(
      (p): Partner => ({ ...p, categories: JSON.parse(p.categories) as string[], ifVetted: p.ifVetted === 1, listingFeeTier: p.listingFeeTier === "plus" ? "plus" : "basic" }),
    ),
  );

export type Customer = {
  homeId: string;
  street: string;
  postalCode: string;
  city: string;
  createdAt: string;
  profile: Profile;
  documents: number;
  lastUploadAt: string | null;
  booked: number;
  confirmed: number;
};

export const getCustomers = () =>
  guard(async () => {
    const [rows, docs, orders] = await Promise.all([
      db.select().from(homes).leftJoin(profiles, eq(profiles.homeId, homes.homeId)).orderBy(asc(homes.createdAt), asc(homes.homeId)),
      db.select({ homeId: documents.homeId, n: count(), last: max(documents.uploadedAt) }).from(documents).groupBy(documents.homeId),
      db.select({ homeId: workOrders.homeId, status: workOrders.status, n: count() }).from(workOrders).groupBy(workOrders.homeId, workOrders.status),
    ]);
    return rows.map(({ homes: h, profiles: p }): Customer => {
      const d = docs.find((x) => x.homeId === h.homeId);
      const n = (status: string) => orders.find((o) => o.homeId === h.homeId && o.status === status)?.n ?? 0;
      return {
        ...h,
        profile: p ? (JSON.parse(p.profile) as Profile) : {},
        documents: d?.n ?? 0,
        lastUploadAt: d?.last ?? null,
        booked: n("booked"),
        confirmed: n("confirmed"),
      };
    });
  });

export const getCounts = () =>
  guard(async () => {
    const byStatus = async (table: typeof documents | typeof workOrders) =>
      Object.fromEntries((await db.select({ s: table.status, n: count() }).from(table).groupBy(table.status)).map((r) => [r.s, r.n]));
    const [[{ n: customers }], docs, orders, rules] = await Promise.all([
      db.select({ n: count() }).from(homes),
      byStatus(documents),
      byStatus(workOrders),
      db.select({ active: fixRules.active, n: count() }).from(fixRules).groupBy(fixRules.active),
    ]);
    return { customers, docs, orders, activeRules: rules.find((r) => r.active === 1)?.n ?? 0 };
  });
