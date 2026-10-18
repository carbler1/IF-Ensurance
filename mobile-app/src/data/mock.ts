// Static UI pieces only. The customer's data (home, insurances, risks, scores, bids, tasks, tiers)
// comes from the backend (src/lib/api.ts), which reads it from the database; its source is
// data/demo-person.json in the repo root.

export type RiskArea =
  | "electricity"
  | "plumbing"
  | "water"
  | "roof"
  | "insulation"
  | "frost"
  | "fire"
  | "engine"
  | "storage"
  | "tyres"
  | "service"
  | "vaccine"
  | "joints"
  | "ventilation";

export type InsuranceId = "house" | "cottage" | "boat" | "car" | "dog";

export type TierId = "bronze" | "silver" | "gold" | "platinum";

export const questions = [
  { id: "q1", options: ["yes", "no", "unsure"] },
  { id: "q2", options: ["yes", "no", "unsure"] },
  { id: "q3", options: ["yes", "no", "unsure"] },
  { id: "q4", options: ["yes", "no", "unsure"] },
] as const;
