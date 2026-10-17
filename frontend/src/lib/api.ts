import "server-only";
import { connection } from "next/server";
import type { Band, Customer, InsuranceClass, Overview, Partner, Rule, Settings, Simulation, Tier } from "./types";

// Every read and write goes through the backend's /v1/admin API; the dashboard never touches the
// database. Calls run on the dashboard's server, so the admin token never reaches the browser.
const BASE = process.env.BACKEND_URL ?? "http://localhost:8000";

export class ApiError extends Error {}

export async function call<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE}/v1/admin${path}`, {
      ...init,
      cache: "no-store",
      headers: { "Content-Type": "application/json", "X-Admin-Token": process.env.ADMIN_TOKEN ?? "", ...init?.headers },
    });
  } catch {
    throw new ApiError(`The backend at ${BASE} is not reachable.`);
  }
  if (res.status === 204) return undefined as T;
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(body?.error?.message ?? `The backend answered ${res.status}.`);
  return body as T;
}

// Reads wait for a request, so a build never calls the backend.
async function read<T>(path: string): Promise<T> {
  await connection();
  return call<T>(path);
}

export const getOverview = () => read<Overview>("/overview");
export const getCustomers = () => read<{ customers: Customer[] }>("/customers").then((r) => r.customers);
export const getClasses = () => read<{ classes: InsuranceClass[] }>("/classes").then((r) => r.classes);
export const getRules = () => read<{ rules: Rule[] }>("/rules").then((r) => r.rules);
export const getSettings = () => read<Settings>("/settings");
export const getBands = () => read<{ bands: Band[]; max_score: number }>("/bands");
export const getPartners = () => read<{ partners: Partner[] }>("/partners").then((r) => r.partners);
export const getTiers = () => read<{ tiers: Tier[] }>("/tiers").then((r) => r.tiers);

const send = <T>(method: "POST" | "PATCH" | "PUT" | "DELETE", path: string, body?: unknown) =>
  call<T>(path, { method, body: body === undefined ? undefined : JSON.stringify(body) });

export const api = {
  patchSettings: (body: { insurance_score_start: number }) => send("PATCH", "/settings", body),
  putBands: (bands: Band[]) => send("PUT", "/bands", { bands }),
  patchClass: (id: string, body: { base_annual_premium_eur: number }) => send("PATCH", `/classes/${encodeURIComponent(id)}`, body),
  createRule: (body: unknown) => send<Rule>("POST", "/rules", body),
  patchRule: (id: string, body: unknown) => send<Rule>("PATCH", `/rules/${encodeURIComponent(id)}`, body),
  deleteRule: (id: string) => send<void>("DELETE", `/rules/${encodeURIComponent(id)}`),
  patchPartner: (id: string, body: unknown) => send<Partner>("PATCH", `/partners/${encodeURIComponent(id)}`, body),
  patchTier: (index: number, body: unknown) => send<Tier>("PATCH", `/tiers/${index}`, body),
  simulate: (objects: unknown) => send<Simulation>("POST", "/simulate", { objects }),
};
