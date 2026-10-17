import "server-only";
import { connection } from "next/server";

// The dashboard talks to the backend from the server only, so the admin token never reaches the browser.
const BASE = process.env.BACKEND_URL ?? "http://localhost:8000";

export type Overview = {
  customers: number;
  documents: Record<string, number>;
  jobs: Record<string, number>;
  work_orders: Record<string, number>;
  partners: { total: number; vetted: number };
};

export type Customer = {
  home_id: string;
  address: { street: string; postal_code: string; city: string };
  created_at: string;
  profile_known: number;
  profile_total: number;
  documents: number;
  last_upload_at: string | null;
  open_risks: number;
  work_orders: { booked: number; confirmed: number };
};

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

export class BackendError extends Error {}

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE}/v1/admin${path}`, {
      ...init,
      cache: "no-store",
      headers: { "Content-Type": "application/json", "X-Admin-Token": process.env.ADMIN_TOKEN ?? "", ...init?.headers },
    });
  } catch {
    throw new BackendError(`The backend at ${BASE} is not reachable.`);
  }
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new BackendError(body?.error?.message ?? `The backend answered ${res.status}.`);
  return body as T;
}

// Reads wait for a request, so builds never call the backend.
async function read<T>(path: string): Promise<T> {
  await connection();
  return call<T>(path);
}

export const getOverview = () => read<Overview>("/overview");
export const getCustomers = () => read<{ customers: Customer[] }>("/customers").then((r) => r.customers);
export const getPartners = () => read<{ partners: Partner[] }>("/partners").then((r) => r.partners);
export const getTiers = () => read<{ tiers: Tier[] }>("/tiers").then((r) => r.tiers);

export const patchPartner = (id: string, body: Partial<Pick<Partner, "if_vetted" | "tier_discount_percent" | "listing_fee_tier">> & { price_min?: number; price_max?: number }) =>
  call<Partner>(`/partners/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(body) });

export const patchTier = (index: number, body: Partial<Omit<Tier, "index">>) =>
  call<Tier>(`/tiers/${index}`, { method: "PATCH", body: JSON.stringify(body) });
