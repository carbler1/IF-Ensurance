import type { Metadata } from "next";
import Link from "next/link";
import { MapPin } from "lucide-react";
import { Data } from "@/components/Data";
import { Card, PageHeader, eur, formatDate } from "@/components/ui";
import { UNKNOWN, profileValue } from "@/lib/match";
import { simulate } from "@/lib/math";
import { getCatalogue, getCustomers, getProfileFields, getRules, getSettings, getTiers } from "@/lib/data";

export const metadata: Metadata = { title: "Customers · If Life Partner Staff" };

async function List() {
  const [customers, catalogue, rules, settings, tiers, fields] = await Promise.all([
    getCustomers(), getCatalogue(), getRules(), getSettings(), getTiers(), getProfileFields(),
  ]);
  if (customers.length === 0) return <Card className="text-muted-foreground">No customers yet.</Card>;
  return (
    <div className="space-y-4">
      {customers.map((c) => {
        const known = fields.filter((f) => profileValue(c.profile, f.name) !== UNKNOWN).length;
        const pct = Math.round((known / fields.length) * 100);
        const sim = simulate(c.profile, catalogue, rules, settings, tiers);
        return (
          <Card key={c.homeId}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="flex items-center gap-2 text-lg font-semibold"><MapPin className="h-5 w-5 text-primary" aria-hidden />{c.street}</p>
                <p className="text-muted-foreground">{c.postalCode} {c.city} · {c.homeId} · joined {formatDate(c.createdAt)}</p>
              </div>
              <div className="text-right">
                <p className="font-display text-3xl font-semibold text-primary-light tabular-nums">+{sim.totalPoints}</p>
                <p className="text-sm text-muted-foreground">points open · −{eur(sim.premiumCut)} / year</p>
              </div>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <div>
                <p className="text-sm text-muted-foreground">Profile</p>
                <div className="mt-2 flex items-center gap-3">
                  <div className="h-2 flex-1 rounded-full bg-muted" role="img" aria-label={`${pct}% of profile fields known`}>
                    <div className="h-2 rounded-full bg-primary" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-sm tabular-nums text-muted-foreground">{known} / {fields.length}</span>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Documents</p>
                <p className="font-semibold">{c.documents} · last {formatDate(c.lastUploadAt)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Work orders</p>
                <p className="font-semibold">{c.booked} booked · {c.confirmed} confirmed</p>
              </div>
            </div>
            <Link href="/simulator" className="mt-4 inline-flex h-11 items-center rounded-xl px-2 font-medium text-primary hover:bg-accent">
              {sim.fixes.length} fixes apply · open the simulator
            </Link>
          </Card>
        );
      })}
    </div>
  );
}

export default function CustomersPage() {
  return (
    <>
      <PageHeader title="Customers" sub="Every home in If Life Partner, and what it could still gain with the current rules." />
      <Data load={() => List()} />
    </>
  );
}
