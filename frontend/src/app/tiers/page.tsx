import type { Metadata } from "next";
import { TierForm } from "@/components/TierForm";
import { Data, PageHeader } from "@/components/ui";
import { getTiers } from "@/lib/api";

export const metadata: Metadata = { title: "Tiers & rewards · If Life Partner Staff" };

async function Ladder() {
  const tiers = await getTiers();
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {tiers.map((t, i) => <TierForm key={t.index} tier={t} current={i === 0} />)}
    </div>
  );
}

export default function TiersPage() {
  return (
    <>
      <PageHeader
        title="Tiers & rewards"
        sub="A customer reaches a tier when their Care Score meets its minimum. Each tier must start above the one below it. All numbers are mock values until the score model is final."
      />
      <Data load={() => Ladder()} />
    </>
  );
}
