"use server";

import { revalidatePath } from "next/cache";
import { BackendError, patchPartner, patchTier } from "@/lib/api";

export type SaveState = { ok: boolean; message: string } | null;

const int = (form: FormData, key: string) => Number.parseInt(String(form.get(key) ?? ""), 10);

async function save(run: () => Promise<unknown>, path: string): Promise<SaveState> {
  try {
    await run();
  } catch (e) {
    return { ok: false, message: e instanceof BackendError ? e.message : "Saving failed." };
  }
  revalidatePath(path);
  return { ok: true, message: "Saved" };
}

export async function savePartner(_: SaveState, form: FormData): Promise<SaveState> {
  const id = String(form.get("partner_id"));
  return save(
    () =>
      patchPartner(id, {
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
    () =>
      patchTier(int(form, "index"), {
        name: String(form.get("name") ?? "").trim(),
        min_score: int(form, "min_score"),
        deductible_reduction_eur: int(form, "deductible_reduction_eur"),
        partner_discount_percent: int(form, "partner_discount_percent"),
        free_checkups: String(form.get("free_checkups") ?? "").split(","),
      }),
    "/tiers",
  );
}
