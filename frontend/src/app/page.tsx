import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Data } from "@/components/Data";
import { Card, PageHeader, eur } from "@/components/ui";
import { getClasses, getOverview } from "@/lib/api";

function Stat({ label, value, sub }: { label: string; value: string | number; sub: string }) {
  return (
    <div className="bg-card px-5 py-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-[1.75rem] leading-tight font-light tabular-nums">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}

async function Tiles() {
  const [c, classes] = await Promise.all([getOverview(), getClasses()]);
  const total = (o: Record<string, number>) => Object.values(o).reduce((a, b) => a + b, 0);
  const premiums = classes.reduce((a, k) => a + k.base_annual_premium_eur, 0);
  return (
    // One strip; the 1 px gaps over the border colour draw the dividers in any column count.
    <Card tone="line" flush className="grid gap-px overflow-hidden sm:grid-cols-2 lg:grid-cols-4">
      <Stat label="Customers" value={c.customers} sub={`${c.classes} insurance classes`} />
      <Stat label="Documents" value={total(c.documents)} sub={`${c.documents.processed ?? 0} processed · ${c.documents.failed ?? 0} failed`} />
      <Stat label="App bookings" value={c.bookings.open + c.bookings.confirmed} sub={`${c.bookings.open} in progress · ${c.bookings.confirmed} confirmed`} />
      <Stat label="Base premiums" value={eur(premiums)} sub={`All five classes per year · ${c.active_rules} active fix rules`} />
    </Card>
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
      <PageHeader title="Overview" sub="Good to see you. This is what is happening across If Ensurance right now." />
      <Data load={() => Tiles()} />
      <Card flush className="mt-6 divide-y overflow-hidden">
        {sections.map((s) => (
          <Link key={s.href} href={s.href} className="group flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-secondary/60">
            <span>
              <span className="block font-medium">{s.title}</span>
              <span className="mt-0.5 block text-sm text-muted-foreground">{s.text}</span>
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" aria-hidden />
          </Link>
        ))}
      </Card>
    </>
  );
}
