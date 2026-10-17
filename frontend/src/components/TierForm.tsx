"use client";

import { useActionState, useState } from "react";
import { saveTier } from "@/app/actions";
import type { Tier } from "@/lib/api";
import { SaveButton } from "./SaveButton";

const field = "mt-1 h-10 w-full rounded-lg border border-input bg-card px-3 text-sm tabular-nums text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary";

export function TierForm({ tier: t, current }: { tier: Tier; current?: boolean }) {
  const [state, action, pending] = useActionState(saveTier, null);
  const [dirty, setDirty] = useState(false);

  return (
    <form
      action={(form) => { setDirty(false); action(form); }}
      onInput={() => setDirty(true)}
      className="rounded-2xl bg-card p-5 shadow-soft"
    >
      <input type="hidden" name="index" value={t.index} />
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-xl font-semibold">Tier {t.index}</h2>
        {current && <span className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">Starting tier</span>}
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="text-sm text-muted-foreground">
          Name
          <input name="name" required maxLength={40} defaultValue={t.name} className={field} />
        </label>
        <label className="text-sm text-muted-foreground">
          Minimum Care Score
          <input name="min_score" type="number" min={0} required defaultValue={t.min_score} className={field} />
        </label>
        <label className="text-sm text-muted-foreground">
          Deductible reduction €
          <input name="deductible_reduction_eur" type="number" min={0} required defaultValue={t.deductible_reduction_eur} className={field} />
        </label>
        <label className="text-sm text-muted-foreground">
          Partner discount %
          <input name="partner_discount_percent" type="number" min={0} max={100} required defaultValue={t.partner_discount_percent} className={field} />
        </label>
        <label className="text-sm text-muted-foreground sm:col-span-2">
          Free checkups (comma-separated)
          <input name="free_checkups" defaultValue={t.free_checkups.join(", ")} placeholder="plumbing, electrical" className={field} />
        </label>
      </div>
      <div className="mt-5">
        <SaveButton pending={pending} dirty={dirty} state={state} />
      </div>
    </form>
  );
}
