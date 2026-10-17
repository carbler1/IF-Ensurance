import type { Metadata } from "next";
import { Card, Data, PageHeader, formatDate } from "@/components/ui";
import { getCustomers } from "@/lib/api";

export const metadata: Metadata = { title: "Customers · If Life Partner Staff" };

async function Table() {
  const customers = await getCustomers();
  if (customers.length === 0) return <Card className="p-5 text-muted-foreground">No customers yet.</Card>;
  return (
    <Card className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="border-b border-border text-muted-foreground">
          <tr>
            <th className="px-5 py-3 font-medium">Home</th>
            <th className="px-5 py-3 font-medium">Profile</th>
            <th className="px-5 py-3 text-right font-medium">Documents</th>
            <th className="px-5 py-3 font-medium">Last upload</th>
            <th className="px-5 py-3 text-right font-medium">Open risks</th>
            <th className="px-5 py-3 text-right font-medium">Work orders</th>
            <th className="px-5 py-3 font-medium">Joined</th>
          </tr>
        </thead>
        <tbody>
          {customers.map((c) => {
            const pct = c.profile_total ? Math.round((c.profile_known / c.profile_total) * 100) : 0;
            return (
              <tr key={c.home_id} className="border-b border-border last:border-0">
                <td className="px-5 py-4">
                  <p className="font-semibold">{c.address.street}</p>
                  <p className="text-muted-foreground">{c.address.postal_code} {c.address.city} · {c.home_id}</p>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-24 rounded-full bg-muted" role="img" aria-label={`${pct}% of profile fields known`}>
                      <div className="h-2 rounded-full bg-primary" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="tabular-nums text-muted-foreground">{c.profile_known} / {c.profile_total}</span>
                  </div>
                </td>
                <td className="px-5 py-4 text-right tabular-nums">{c.documents}</td>
                <td className="px-5 py-4 text-muted-foreground">{formatDate(c.last_upload_at)}</td>
                <td className="px-5 py-4 text-right tabular-nums">{c.open_risks}</td>
                <td className="px-5 py-4 text-right tabular-nums">{c.work_orders.booked} booked · {c.work_orders.confirmed} done</td>
                <td className="px-5 py-4 text-muted-foreground">{formatDate(c.created_at)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Card>
  );
}

export default function CustomersPage() {
  return (
    <>
      <PageHeader title="Customers" sub="Every home in If Life Partner. Phase 1 has one demo home." />
      <Data load={() => Table()} />
    </>
  );
}
