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
  severity: number;
  probability: number;
  points: number;
  half_life_years?: number;
  mitigation: { action: string; partner_category: string };
};

export type InsuranceClass = {
  class_id: string;
  name: string;
  fields: Field[];
  risks: Risk[];
  base_annual_premium_eur: number;
  max_reduction_percent: number;
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
  premium_reduction_eur: number;
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
  premium_reduction_eur: number;
};

export type TierRef = { index: number; name: string; min_score: number; deductible_reduction_eur: number } | null;

export type SimObject = {
  object_id: string | null;
  class_id: string;
  class_name: string;
  name: string;
  fixes: SimFix[];
  points: number;
  premium: { base: number; cut_raw: number; cut: number; capped: boolean; max_reduction_percent: number; after: number };
};

export type Simulation = {
  objects: SimObject[];
  score: { start: number; points: number; after: number; tier_before: TierRef; tier_after: TierRef };
  premium: { base: number; cut: number; after: number };
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

export type Tier = {
  index: number;
  name: string;
  min_score: number;
  deductible_reduction_eur: number;
  free_checkups: string[];
  partner_discount_percent: number;
};

export type Overview = {
  customers: number;
  homes: number;
  documents: Record<string, number>;
  work_orders: Record<string, number>;
  active_rules: number;
  classes: number;
};
