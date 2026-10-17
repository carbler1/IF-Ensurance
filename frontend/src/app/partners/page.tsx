import type { Metadata } from "next";
import { PartnerRow } from "@/components/PartnerRow";
import { Card, Data, PageHeader } from "@/components/ui";
import { getPartners } from "@/lib/api";

export const metadata: Metadata = { title: "Partners & prices · If Life Partner Staff" };

async function List() {
  const partners = await getPartners();
  return (
    <Card>
      <div className="hidden grid-cols-[minmax(0,2.2fr)_repeat(3,minmax(0,0.8fr))_minmax(0,0.9fr)_minmax(0,0.6fr)_minmax(0,1.1fr)] gap-3 border-b border-border px-5 py-3 text-sm font-medium text-muted-foreground lg:grid">
        <span>Partner</span>
        <span>Min €</span>
        <span>Max €</span>
        <span>If discount %</span>
        <span>Listing</span>
        <span>Vetted</span>
        <span />
      </div>
      {partners.map((p) => <PartnerRow key={p.partner_id} partner={p} />)}
    </Card>
  );
}

export default function PartnersPage() {
  return (
    <>
      <PageHeader
        title="Partners & prices"
        sub="Customers see the price range and the If discount on each risk. Only vetted partners are shown to customers."
      />
      <Data load={() => List()} />
    </>
  );
}
