// Shapes of the backend's /v1/admin responses (docs/systemdesign/api-contract.md, "Admin").
// Plain types, safe to use in client components.

export type Condition =
  | { op: "lt" | "gt" | "eq"; field: string; value: number | string }
  | { op: "in"; field: string; value: (number | string)[] }
  | { op: "exists"; field: string }
  | { op: "and" | "or"; args: Condition[] }
  | { op: "not"; args: [Condition] };

export type FieldKind = "enum" | "year" | "date";
export type Field = { name: string; kind: FieldKind; description: string; options: string[] };

export type Risk = {
  id: string;
  category: string;
  title: string;
  severity?: number;
  probability?: number;
  points: number | null;
  /** Set for a risk assigned to one customer's object (the app's risks). */
  assigned?: boolean;
  object_name?: string;
  why?: string;
  half_life_years?: number;
  mitigation: { action: string; partner_category: string };
};

export type InsuranceClass = {
  class_id: string;
  name: string;
  fields: Field[];
  risks: Risk[];
  base_annual_premium_eur: number;
};

export type Rule = {
  rule_id: string;
  risk_id: string;
  class_id: string | null;
  label: string;
  context: Condition | null;
  priority: number;
  points: number;
  half_life_years: number;
  active: boolean;
  is_default: boolean;
};

export type ProfileValue = number | string;

export type SimFix = {
  risk_id: string;
  title: string;
  category: string;
  action: string;
  rule_id: string | null;
  rule_label: string | null;
  rule_context: Condition | null;
  points: number;
  half_life_years: number | null;
};

export type Band = { min_score: number; percent: number };

export type TierRow = { index: number; name: string; min_score: number; partner_discount_percent: number; bonuses: string[] };

export type SimObject = {
  object_id: string | null;
  class_id: string;
  class_name: string;
  name: string;
  history: { label: string; points: number }[];
  fixes: SimFix[];
  points: number;
  score: { now: number; after: number; next_band: (Band & { points_to: number }) | null };
  band: { now: number; after: number };
  premium: { base: number; now: number; after: number };
};

export type Simulation = {
  objects: SimObject[];
  aggregate: {
    now: number;
    after: number;
    tier_now: TierRow | null;
    tier_after: TierRow | null;
    next_tier: { name: string; min_score: number; points_to: number } | null;
  };
  premium: { base: number; now: number; after: number };
  model: { insurance_score_start: number; max_score: number; bands: Band[]; tiers: TierRow[] };
};

export type CustomerObject = SimObject & { profile: Record<string, ProfileValue>; profile_known: number; profile_total: number };
export type Customer = Omit<Simulation, "objects"> & { customer_id: string; name: string; created_at: string; objects: CustomerObject[] };

export type Partner = {
  partner_id: string;
  name: string;
  categories: string[];
  area: string;
  price_range: { min: number; max: number };
  rating: number;
  if_vetted: boolean;
  tier_discount_percent: number;
  listing_fee_tier: "basic" | "plus";
};

export type Tier = TierRow;

export type Settings = { insurance_score_start: number; max_score: number };

export type Overview = {
  customers: number;
  homes: number;
  documents: Record<string, number>;
  work_orders: Record<string, number>;
  bookings: { open: number; confirmed: number };
  active_rules: number;
  classes: number;
};
