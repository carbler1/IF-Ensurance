import type { Metadata } from "next";
import { Star } from "lucide-react";
import { savePartner } from "@/app/actions";
import { Data } from "@/components/Data";
import { Label, SaveForm, Switch } from "@/components/form";
import { Card, Disclosure, PageHeader, Pill, humanize, inputClass } from "@/components/ui";
import { getPartners } from "@/lib/api";

export const metadata: Metadata = { title: "Partners · If Ensurance Staff" };

async function List() {
  const partners = await getPartners();
  if (partners.length === 0) return <Card className="text-sm text-muted-foreground">No partners yet.</Card>;
  const groups = [
    { title: "Shown to customers", list: partners.filter((p) => p.if_vetted) },
    { title: "Hidden from customers", list: partners.filter((p) => !p.if_vetted) },
  ].filter((g) => g.list.length > 0);
  return groups.map((g) => (
    <section key={g.title} className="mb-10">
      <h2 className="mb-3 text-lg font-semibold">{g.title} <span className="font-normal text-muted-foreground tabular-nums">{g.list.length}</span></h2>
      <div className="grid gap-4 lg:grid-cols-2">
      {g.list.map((p) => (
        <Card key={p.partner_id} className={p.if_vetted ? "" : "border-dashed border-input"}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="font-semibold">{p.name}</h2>
              <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                <span className="flex items-center gap-1 tabular-nums"><Star className="h-3.5 w-3.5 fill-warning text-warning" aria-hidden />{p.rating}</span>
                <span>{p.area}</span>
                <span>{p.partner_id}</span>
              </p>
            </div>
            {p.if_vetted ? <Pill>Vetted</Pill> : <Pill>Not vetted</Pill>}
          </div>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {p.categories.map((c) => <Pill key={c}>{humanize(c)}</Pill>)}
          </div>
          <Disclosure inline title="Price, discount and visibility" meta={`${p.price_range.min}–${p.price_range.max} € · ${p.tier_discount_percent} % off · ${p.listing_fee_tier}`}>
          <SaveForm action={savePartner}>
            <input type="hidden" name="partner_id" value={p.partner_id} />
            <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Label text="Min €"><input name="price_min" type="number" min={0} required defaultValue={p.price_range.min} className={inputClass} /></Label>
              <Label text="Max €"><input name="price_max" type="number" min={0} required defaultValue={p.price_range.max} className={inputClass} /></Label>
              <Label text="If discount %"><input name="tier_discount_percent" type="number" min={0} max={100} required defaultValue={p.tier_discount_percent} className={inputClass} /></Label>
              <Label text="Listing">
                <select name="listing_fee_tier" defaultValue={p.listing_fee_tier} className={inputClass}>
                  <option value="basic">Basic</option>
                  <option value="plus">Plus</option>
                </select>
              </Label>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <Switch name="if_vetted" defaultChecked={p.if_vetted} label={`${p.name} is vetted`}>Show to customers (vetted)</Switch>
            </div>
          </SaveForm>
          </Disclosure>
        </Card>
      ))}
      </div>
    </section>
  ));
}

export default function PartnersPage() {
  return (
    <>
      <PageHeader title="Partners" sub="Customers see the price range and the If discount on each risk. Only vetted partners are shown to customers." />
      <Data load={() => List()} />
    </>
  );
}
