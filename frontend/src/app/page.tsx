import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Data } from "@/components/Data";
import { Card, PageHeader, eur } from "@/components/ui";
import { getClasses, getOverview } from "@/lib/api";

function Tile({ label, value, sub }: { label: string; value: string | number; sub: string }) {
  return (
    <Card>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-3xl font-semibold tabular-nums">{value}</p>
      <p className="mt-1 text-sm text-muted-foreground">{sub}</p>
    </Card>
  );
}

async function Tiles() {
  const [c, classes] = await Promise.all([getOverview(), getClasses()]);
  const total = (o: Record<string, number>) => Object.values(o).reduce((a, b) => a + b, 0);
  const premiums = classes.reduce((a, k) => a + k.base_annual_premium_eur, 0);
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Tile label="Customers" value={c.customers} sub={`${c.classes} insurance classes`} />
      <Tile label="Documents" value={total(c.documents)} sub={`${c.documents.processed ?? 0} processed · ${c.documents.failed ?? 0} failed`} />
      <Tile label="App bookings" value={c.bookings.open + c.bookings.confirmed} sub={`${c.bookings.open} in progress · ${c.bookings.confirmed} confirmed`} />
      <Tile label="Base premiums" value={eur(premiums)} sub={`All five classes per year · ${c.active_rules} active fix rules`} />
    </div>
  );
}

const sections = [
  { href: "/scoring", title: "Score & pricing", text: "Set the insurance scores, the discount bands and the points of each fix, per insurance and context." },
  { href: "/simulator", title: "Simulator", text: "Try a customer and see each insurance score, discount and premium, and their Care Score tier, with every fix confirmed." },
  { href: "/customers", title: "Customers", text: "Each customer, their insured objects and what they could still gain." },
  { href: "/partners", title: "Partners", text: "Price ranges, the If discount and vetting for each partner." },
  { href: "/tiers", title: "Tiers & rewards", text: "Care Score thresholds and the reward of each tier." },
];

export default function OverviewPage() {
  return (
    <>
      <PageHeader title="Overview" sub="Good to see you. This is what is happening across If Life Partner right now." />
      <Data load={() => Tiles()} />
      <div className="mt-6 space-y-3">
        {sections.map((s) => (
          <Link key={s.href} href={s.href} className="flex items-center justify-between gap-4 rounded-2xl bg-card p-5 shadow-soft transition-shadow hover:shadow-lg">
            <span>
              <span className="block font-display text-xl font-semibold">{s.title}</span>
              <span className="mt-1 block text-muted-foreground">{s.text}</span>
            </span>
            <ChevronRight className="h-5 w-5 shrink-0 text-primary" aria-hidden />
          </Link>
        ))}
      </div>
    </>
  );
}
