"use client";

import { useActionState, useState } from "react";
import { savePartner } from "@/app/actions";
import type { Partner } from "@/lib/api";
import { SaveButton } from "./SaveButton";

const field = "h-9 w-full rounded-lg border border-input bg-card px-2 text-sm tabular-nums focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary";

export function PartnerRow({ partner: p }: { partner: Partner }) {
  const [state, action, pending] = useActionState(savePartner, null);
  const [dirty, setDirty] = useState(false);
  const label = (what: string) => `${what}, ${p.name}`;

  return (
    <form
      action={(form) => { setDirty(false); action(form); }}
      onInput={() => setDirty(true)}
      className="grid grid-cols-2 items-center gap-3 border-b border-border px-5 py-4 last:border-0 lg:grid-cols-[minmax(0,2.2fr)_repeat(3,minmax(0,0.8fr))_minmax(0,0.9fr)_minmax(0,0.6fr)_minmax(0,1.1fr)]"
    >
      <input type="hidden" name="partner_id" value={p.partner_id} />
      <div className="col-span-2 lg:col-span-1">
        <p className="font-semibold">{p.name}</p>
        <p className="text-sm text-muted-foreground">
          {p.categories.map((c) => c.replaceAll("_", " ")).join(", ")} · {p.area} · ★ {p.rating}
        </p>
      </div>
      <label className="text-xs text-muted-foreground">
        <span className="lg:sr-only">Min €</span>
        <input name="price_min" type="number" min={0} required defaultValue={p.price_range.min} aria-label={label("Minimum price in euros")} className={field} />
      </label>
      <label className="text-xs text-muted-foreground">
        <span className="lg:sr-only">Max €</span>
        <input name="price_max" type="number" min={0} required defaultValue={p.price_range.max} aria-label={label("Maximum price in euros")} className={field} />
      </label>
      <label className="text-xs text-muted-foreground">
        <span className="lg:sr-only">If discount %</span>
        <input name="tier_discount_percent" type="number" min={0} max={100} required defaultValue={p.tier_discount_percent} aria-label={label("If tier discount percent")} className={field} />
      </label>
      <label className="text-xs text-muted-foreground">
        <span className="lg:sr-only">Listing</span>
        <select name="listing_fee_tier" defaultValue={p.listing_fee_tier} aria-label={label("Listing fee tier")} className={field}>
          <option value="basic">Basic</option>
          <option value="plus">Plus</option>
        </select>
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input name="if_vetted" type="checkbox" defaultChecked={p.if_vetted} aria-label={label("If vetted")} className="h-4 w-4 accent-primary" />
        <span className="lg:sr-only">If vetted</span>
      </label>
      <div className="col-span-2 lg:col-span-1">
        <SaveButton pending={pending} dirty={dirty} state={state} />
      </div>
    </form>
  );
}
