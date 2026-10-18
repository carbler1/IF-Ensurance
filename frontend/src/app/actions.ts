"use server";

import { revalidatePath } from "next/cache";
import { ApiError, api } from "@/lib/api";
import type { ProfileValue, Simulation } from "@/lib/types";

// Server actions: each one calls the backend.

export type SaveState = { ok: boolean; message: string } | null;

class Invalid extends Error {}

function int(form: FormData, key: string): number {
  const raw = String(form.get(key) ?? "").trim();
  const n = Number(raw);
  if (raw === "" || !Number.isInteger(n)) throw new Invalid("Enter whole numbers only.");
  return n;
}

async function save(run: () => Promise<unknown>, ...paths: string[]): Promise<SaveState> {
  try {
    await run();
  } catch (e) {
    if (e instanceof Invalid || e instanceof ApiError) return { ok: false, message: e.message };
    return { ok: false, message: "Saving failed." };
  }
  paths.forEach((p) => revalidatePath(p));
  return { ok: true, message: "Saved" };
}

const SCORE_PAGES = ["/scoring", "/simulator", "/customers", "/tiers"];

export async function saveSettings(_: SaveState, form: FormData): Promise<SaveState> {
  return save(() => api.patchSettings({ insurance_score_start: int(form, "insurance_score_start") }), ...SCORE_PAGES);
}

export async function saveBands(_: SaveState, form: FormData): Promise<SaveState> {
  return save(async () => {
    const mins = form.getAll("min_score").map(String);
    const pcts = form.getAll("percent").map(String);
    const bands = mins
      .map((m, i) => ({ min: m.trim(), pct: (pcts[i] ?? "").trim() }))
      .filter((b) => b.min !== "" || b.pct !== "")
      .map((b) => {
        const min_score = Number(b.min), percent = Number(b.pct);
        if (!Number.isInteger(min_score) || !Number.isInteger(percent)) throw new Invalid("Enter whole numbers only.");
        return { min_score, percent };
      });
    if (bands.length === 0) throw new Invalid("Keep at least one band.");
    await api.putBands(bands);
  }, ...SCORE_PAGES);
}

export async function saveClass(_: SaveState, form: FormData): Promise<SaveState> {
  return save(
    () => api.patchClass(String(form.get("class_id")), { base_annual_premium_eur: int(form, "base_annual_premium_eur") }),
    ...SCORE_PAGES,
  );
}

const ruleNumbers = (form: FormData) => ({
  points: int(form, "points"),
  half_life_years: int(form, "half_life_years"),
});

export async function saveRule(_: SaveState, form: FormData): Promise<SaveState> {
  return save(
    () => api.patchRule(String(form.get("rule_id")), {
      ...ruleNumbers(form),
      priority: form.has("priority") ? int(form, "priority") : null,
      active: form.get("active") === "on",
    }),
    "/scoring", "/simulator", "/customers",
  );
}

export async function addRule(_: SaveState, form: FormData): Promise<SaveState> {
  return save(async () => {
    let context: unknown;
    try {
      context = JSON.parse(String(form.get("context") ?? ""));
    } catch {
      throw new Invalid("Add at least one complete condition.");
    }
    await api.createRule({
      risk_id: String(form.get("risk_id")),
      label: String(form.get("label") ?? "").trim(),
      context,
      priority: int(form, "priority"),
      ...ruleNumbers(form),
    });
  }, "/scoring", "/simulator", "/customers");
}

export async function deleteRule(form: FormData): Promise<void> {
  await api.deleteRule(String(form.get("rule_id")));
  revalidatePath("/scoring");
  revalidatePath("/simulator");
  revalidatePath("/customers");
}

export async function savePartner(_: SaveState, form: FormData): Promise<SaveState> {
  return save(
    () => api.patchPartner(String(form.get("partner_id")), {
      price_min: int(form, "price_min"),
      price_max: int(form, "price_max"),
      tier_discount_percent: int(form, "tier_discount_percent"),
      if_vetted: form.get("if_vetted") === "on",
      listing_fee_tier: form.get("listing_fee_tier") === "plus" ? "plus" : "basic",
    }),
    "/partners",
  );
}

export async function saveTier(_: SaveState, form: FormData): Promise<SaveState> {
  return save(
    () => api.patchTier(int(form, "index"), {
      name: String(form.get("name") ?? "").trim(),
      min_score: int(form, "min_score"),
      partner_discount_percent: int(form, "partner_discount_percent"),
      bonuses: String(form.get("bonuses") ?? "").split("\n"),
    }),
    "/tiers", "/simulator", "/customers",
  );
}

/** Clear the demo customer's app bookings and reminders before the next demo run. */
export async function resetDemo(): Promise<void> {
  await api.resetDemo();
  ["/", "/customers", "/simulator"].forEach((p) => revalidatePath(p));
}

export type SimInput = { object_id: string | null; class_id: string; name: string; profile: Record<string, ProfileValue>; history: { label: string; points: number }[] };

/** The simulator asks the backend for the numbers; nothing is saved. */
export async function runSimulation(objects: SimInput[]): Promise<{ ok: true; result: Simulation } | { ok: false; message: string }> {
  try {
    return { ok: true, result: await api.simulate(objects) };
  } catch (e) {
    return { ok: false, message: e instanceof ApiError ? e.message : "The simulation failed." };
  }
}
