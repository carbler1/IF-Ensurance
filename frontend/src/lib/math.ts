// Score and premium math. The same rule choice as fix_value() in backend/engine.py: among the
// active rules of a fix, the highest priority (ties by rule id) whose context matches wins.
import { matches, type Condition, type Profile } from "./match";

export type CatalogueEntry = {
  id: string;
  category: string;
  title: string;
  applies_when: Condition;
  severity: number;
  probability: number;
  points: number;
  half_life_years?: number;
  check_interval_years: number;
  mitigation: { action: string; partner_category: string };
};

export type Rule = {
  ruleId: string;
  riskId: string;
  label: string;
  context: Condition | null;
  priority: number;
  points: number;
  halfLifeYears: number;
  premiumReductionEur: number;
  active: boolean;
};

export type Settings = { scoreStart: number; baseAnnualPremiumEur: number; maxReductionPercent: number };
export type TierRow = { index: number; name: string; minScore: number; deductibleReductionEur: number };

export type FixValue = { rule: Rule | null; points: number; halfLifeYears: number | null; premiumReductionEur: number };

export function sortRules(rules: Rule[]): Rule[] {
  return [...rules].sort((a, b) => b.priority - a.priority || (a.ruleId < b.ruleId ? -1 : a.ruleId > b.ruleId ? 1 : 0));
}

/** rules must be sorted by sortRules. */
export function fixValue(rules: Rule[], entry: CatalogueEntry, profile: Profile): FixValue {
  for (const r of rules) {
    if (r.active && r.riskId === entry.id && (r.context === null || matches(r.context, profile))) {
      return { rule: r, points: r.points, halfLifeYears: r.halfLifeYears, premiumReductionEur: r.premiumReductionEur };
    }
  }
  return { rule: null, points: entry.points, halfLifeYears: entry.half_life_years ?? null, premiumReductionEur: 0 };
}

/** Points left after decay: points × 0.5 ^ (years / half-life), as in fixtures/score-tiers.json. */
export const decayed = (points: number, years: number, halfLife: number) => Math.round(points * 0.5 ** (years / halfLife));

export function tierFor(score: number, tiers: TierRow[]): TierRow | undefined {
  return [...tiers].sort((a, b) => a.minScore - b.minScore).filter((t) => score >= t.minScore).at(-1);
}

export type Simulation = {
  fixes: (FixValue & { entry: CatalogueEntry })[];
  totalPoints: number;
  scoreAfter: number;
  premiumCutRaw: number;
  premiumCut: number; // after the cap
  capped: boolean;
  premiumAfter: number;
  tierBefore?: TierRow;
  tierAfter?: TierRow;
};

/** Every fix that applies to this home, and what the home gains when all of them are confirmed. */
export function simulate(profile: Profile, catalogue: CatalogueEntry[], rules: Rule[], settings: Settings, tiers: TierRow[]): Simulation {
  const sorted = sortRules(rules);
  const fixes = catalogue
    .filter((e) => matches(e.applies_when, profile))
    .map((entry) => ({ entry, ...fixValue(sorted, entry, profile) }))
    .sort((a, b) => b.points - a.points || (a.entry.id < b.entry.id ? -1 : 1));
  const totalPoints = fixes.reduce((s, f) => s + f.points, 0);
  const premiumCutRaw = fixes.reduce((s, f) => s + f.premiumReductionEur, 0);
  const cap = Math.round((settings.baseAnnualPremiumEur * settings.maxReductionPercent) / 100);
  const premiumCut = Math.min(premiumCutRaw, cap);
  const scoreAfter = settings.scoreStart + totalPoints;
  return {
    fixes,
    totalPoints,
    scoreAfter,
    premiumCutRaw,
    premiumCut,
    capped: premiumCutRaw > cap,
    premiumAfter: settings.baseAnnualPremiumEur - premiumCut,
    tierBefore: tierFor(settings.scoreStart, tiers),
    tierAfter: tierFor(scoreAfter, tiers),
  };
}
