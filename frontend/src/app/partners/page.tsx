import type { Metadata } from "next";
import { Star } from "lucide-react";
import { savePartner } from "@/app/actions";
import { Data } from "@/components/Data";
import { Label, SaveForm, Switch, smallInputClass } from "@/components/form";
import { Card, PageHeader, Pill, humanize } from "@/components/ui";
import { getPartners } from "@/lib/api";

export const metadata: Metadata = { title: "Partners · If Ensurance Staff" };

async function List() {
  const partners = await getPartners();
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {partners.map((p) => (
        <Card key={p.partner_id} className={p.if_vetted ? "" : "opacity-80"}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-lg font-semibold">{p.name}</p>
              <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><Star className="h-4 w-4 fill-warning text-warning" aria-hidden />{p.rating}</span>
                <span>{p.area}</span>
                <span>{p.partner_id}</span>
              </p>
            </div>
            {p.if_vetted ? <Pill tone="success">If vetted</Pill> : <Pill>Not vetted</Pill>}
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {p.categories.map((c) => <Pill key={c}>{humanize(c)}</Pill>)}
          </div>
          <SaveForm action={savePartner}>
            <input type="hidden" name="partner_id" value={p.partner_id} />
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Label text="Min €"><input name="price_min" type="number" min={0} required defaultValue={p.price_range.min} className={smallInputClass} /></Label>
              <Label text="Max €"><input name="price_max" type="number" min={0} required defaultValue={p.price_range.max} className={smallInputClass} /></Label>
              <Label text="If discount %"><input name="tier_discount_percent" type="number" min={0} max={100} required defaultValue={p.tier_discount_percent} className={smallInputClass} /></Label>
              <Label text="Listing">
                <select name="listing_fee_tier" defaultValue={p.listing_fee_tier} className={smallInputClass}>
                  <option value="basic">Basic</option>
                  <option value="plus">Plus</option>
                </select>
              </Label>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <Switch name="if_vetted" defaultChecked={p.if_vetted} label={`${p.name} is If vetted`}>Show to customers (If vetted)</Switch>
            </div>
          </SaveForm>
        </Card>
      ))}
    </div>
  );
}

export default function PartnersPage() {
  return (
    <>
      <PageHeader title="Partners" sub="Customers see the price range and the If discount on each risk. Only vetted partners are shown to customers." />
      <Data load={() => List()} />
    </>
  );
}
