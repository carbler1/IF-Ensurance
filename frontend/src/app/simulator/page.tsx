import type { Metadata } from "next";
import { Data } from "@/components/Data";
import { Simulator } from "@/components/Simulator";
import { PageHeader } from "@/components/ui";
import { getClasses, getCustomers, getTiers } from "@/lib/api";

export const metadata: Metadata = { title: "Simulator · If Life Partner Staff" };

async function Load() {
  const [customers, classes, tiers] = await Promise.all([getCustomers(), getClasses(), getTiers()]);
  return <Simulator customers={customers} classes={classes} tierMins={tiers.map((t) => t.min_score)} />;
}

export default function SimulatorPage() {
  return (
    <>
      <PageHeader title="Simulator" sub="See what a customer gains when every fix on their house, cottage, boat, car and dog is confirmed, with the current rules." />
      <Data load={() => Load()} />
    </>
  );
}
