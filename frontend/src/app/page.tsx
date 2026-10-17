import Link from "next/link";
import { Card, Data, PageHeader, sum } from "@/components/ui";
import { getOverview } from "@/lib/api";

function Tile({ label, value, sub }: { label: string; value: number | string; sub: string }) {
  return (
    <Card className="p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 font-display text-4xl font-semibold tabular-nums">{value}</p>
      <p className="mt-1 text-sm text-muted-foreground">{sub}</p>
    </Card>
  );
}

async function Tiles() {
  const o = await getOverview();
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Tile label="Customers" value={o.customers} sub="Homes with a profile" />
      <Tile label="Documents" value={sum(o.documents)} sub={`${o.documents.processed ?? 0} processed · ${o.documents.failed ?? 0} failed`} />
      <Tile label="Work orders" value={sum(o.work_orders)} sub={`${o.work_orders.booked ?? 0} booked · ${o.work_orders.confirmed ?? 0} confirmed`} />
      <Tile label="Vetted partners" value={`${o.partners.vetted} / ${o.partners.total}`} sub="Shown to customers" />
    </div>
  );
}

const sections = [
  { href: "/customers", title: "Customers", text: "See each home, how complete its profile is and its open risks." },
  { href: "/partners", title: "Partners & prices", text: "Set price ranges, the If tier discount and vetting for each partner." },
  { href: "/tiers", title: "Tiers & rewards", text: "Set the Care Score thresholds and the reward for each tier." },
];

export default function OverviewPage() {
  return (
    <>
      <PageHeader title="Overview" sub="What is happening across If Life Partner customers right now." />
      <Data load={() => Tiles()} />
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {sections.map((s) => (
          <Link key={s.href} href={s.href} className="group">
            <Card className="h-full p-5 transition-shadow group-hover:shadow-lg">
              <h2 className="text-xl font-semibold">{s.title}</h2>
              <p className="mt-2 text-muted-foreground">{s.text}</p>
              <p className="mt-4 text-sm font-semibold text-primary">Open →</p>
            </Card>
          </Link>
        ))}
      </div>
    </>
  );
}
