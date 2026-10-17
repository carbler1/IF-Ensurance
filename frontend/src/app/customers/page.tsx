import type { Metadata } from "next";
import Link from "next/link";
import { Data } from "@/components/Data";
import { Card, PageHeader, classIcon, eur, formatDate, tierColor } from "@/components/ui";
import { getCustomers } from "@/lib/api";

export const metadata: Metadata = { title: "Customers · If Life Partner Staff" };

async function List() {
  const customers = await getCustomers();
  if (customers.length === 0) return <Card className="text-muted-foreground">No customers yet.</Card>;
  return (
    <div className="space-y-6">
      {customers.map((c) => (
        <Card key={c.customer_id}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold">{c.name}</h2>
              <p className="text-muted-foreground">{c.customer_id} · customer since {formatDate(c.created_at)} · {c.objects.length} insurances</p>
            </div>
            <div className="flex gap-6 text-right">
              <div>
                <p className="text-sm text-muted-foreground">Care Score now</p>
                <p className="flex items-center justify-end gap-2 font-display text-3xl font-semibold tabular-nums">
                  {c.score.tier_before && <span className={`h-3 w-3 rounded-full ${tierColor[c.score.tier_before.index] ?? "bg-primary"}`} />}
                  {c.score.start}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Premiums per year</p>
                <p className="font-display text-3xl font-semibold tabular-nums">{eur(c.premium.base)}</p>
              </div>
            </div>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            {c.objects.map((o) => {
              const Icon = classIcon[o.class_id] ?? classIcon.house;
              const pct = Math.round((o.profile_known / Math.max(1, o.profile_total)) * 100);
              return (
                <div key={o.object_id} className="rounded-2xl bg-background p-4">
                  <p className="flex items-center gap-2 font-semibold"><Icon className="h-5 w-5 text-primary" aria-hidden />{o.class_name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{o.name}</p>
                  <div className="mt-3 flex items-center gap-2">
                    <div className="h-2 flex-1 rounded-full bg-muted" role="img" aria-label={`${pct}% of profile fields known`}>
                      <div className="h-2 rounded-full bg-primary" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs tabular-nums text-muted-foreground">{o.profile_known}/{o.profile_total}</span>
                  </div>
                  <p className="mt-3 font-display text-2xl font-semibold text-primary-light tabular-nums">+{o.points}</p>
                  <p className="text-sm text-muted-foreground">{o.fixes.length} fixes open · −{eur(o.premium.cut)} / year</p>
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-success-soft p-4">
            <p className="text-success">
              With every fix done: Care Score <span className="font-semibold">{c.score.after}</span>
              {c.score.tier_after && <> ({c.score.tier_after.name})</>} and premiums <span className="font-semibold">{eur(c.premium.after)}</span> a year.
            </p>
            <Link href="/simulator" className="inline-flex h-11 items-center rounded-xl px-3 font-medium text-primary hover:bg-card">Open the simulator</Link>
          </div>
        </Card>
      ))}
    </div>
  );
}

export default function CustomersPage() {
  return (
    <>
      <PageHeader title="Customers" sub="Every customer with their insured objects, and what they could still gain with the current rules." />
      <Data load={() => List()} />
    </>
  );
}
