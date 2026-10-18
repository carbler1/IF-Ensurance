import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";
import { Data } from "@/components/Data";
import { Card, PageHeader, classIcon, eur, formatDate, tierColor } from "@/components/ui";
import { getCustomers } from "@/lib/api";

export const metadata: Metadata = { title: "Customers · If Ensurance Staff" };

const off = (pct: number) => (pct ? `${pct} % off` : "No discount yet");

async function List() {
  const customers = await getCustomers();
  if (customers.length === 0) return <Card className="text-sm text-muted-foreground">No customers yet.</Card>;
  return (
    <div className="space-y-4">
      {customers.map((c) => (
        <Card key={c.customer_id}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">{c.name}</h2>
              <p className="text-sm text-muted-foreground">{c.customer_id} · customer since {formatDate(c.created_at)} · {c.objects.length} insurances</p>
            </div>
            <div className="flex gap-8 sm:text-right">
              <div>
                <p className="text-sm text-muted-foreground">Care Score (average)</p>
                <p className="flex items-center gap-2 text-[2.25rem] sm:justify-end leading-tight font-light tabular-nums">
                  {c.aggregate.tier_now && <span className={`h-2.5 w-2.5 rounded-full ${tierColor[c.aggregate.tier_now.index] ?? "bg-primary"}`} />}
                  {c.aggregate.now}
                </p>
                <p className="text-sm text-muted-foreground">
                  {c.aggregate.tier_now?.name ?? "—"}{c.aggregate.next_tier && ` · ${c.aggregate.next_tier.points_to} to ${c.aggregate.next_tier.name}`}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Premiums per year</p>
                <p className="text-[2.25rem] leading-tight font-light tabular-nums">{eur(c.premium.now)}</p>
                <p className="text-sm text-muted-foreground">Base {eur(c.premium.base)}</p>
              </div>
            </div>
          </div>
          <div className="mt-5 grid gap-px overflow-hidden rounded-lg border bg-border md:grid-cols-2 xl:grid-cols-5">
            {c.objects.map((o) => {
              const Icon = classIcon[o.class_id] ?? classIcon.house;
              const pct = Math.round((o.profile_known / Math.max(1, o.profile_total)) * 100);
              return (
                <div key={o.object_id} className="bg-card p-4">
                  <p className="flex items-center gap-2 font-semibold"><Icon className="h-[18px] w-[18px] text-muted-foreground" strokeWidth={1.75} aria-hidden />{o.class_name}</p>
                  <p className="mt-0.5 truncate text-sm text-muted-foreground">{o.name}</p>
                  <p className="mt-3 text-[1.75rem] leading-tight font-light tabular-nums">{o.score.now}</p>
                  <p className={`text-sm font-medium ${o.band.now ? "text-success" : "text-muted-foreground"}`}>{off(o.band.now)} · {eur(o.premium.now)} / year</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {o.fixes.length} fixes open{o.points > 0 && ` · +${o.points} → ${o.score.after}`}
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    <div className="h-1 flex-1 rounded-full bg-muted" role="img" aria-label={`${pct}% of profile fields known`}>
                      <div className="h-1 rounded-full bg-primary" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-sm tabular-nums text-muted-foreground">{o.profile_known}/{o.profile_total}</span>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-success-soft px-4 py-3">
            <div className="text-sm text-success">
              <p>
                With every fix done: Care Score <span className="font-semibold">{c.aggregate.after}</span>
                {c.aggregate.tier_after && <> ({c.aggregate.tier_after.name})</>} and premiums <span className="font-semibold">{eur(c.premium.after)}</span> a year.
              </p>
              {c.aggregate.tier_after && c.aggregate.tier_after.bonuses.length > 0 && (
                <p className="mt-1 flex flex-wrap gap-x-3 text-sm">
                  {c.aggregate.tier_after.bonuses.map((b) => <span key={b} className="flex items-center gap-1"><Check className="h-3.5 w-3.5" aria-hidden />{b}</span>)}
                </p>
              )}
            </div>
            <Link href="/simulator" className="inline-flex h-9 items-center rounded-lg px-3 text-sm font-medium text-primary hover:bg-card">Open the simulator</Link>
          </div>
        </Card>
      ))}
    </div>
  );
}

export default function CustomersPage() {
  return (
    <>
      <PageHeader title="Customers" sub="Every customer with their insurance scores, discounts and Care Score, and what they could still gain. The demo customer is the person in the mobile app; bookings made in the app show up here." />
      <Data load={() => List()} />
    </>
  );
}
