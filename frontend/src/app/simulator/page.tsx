import type { Metadata } from "next";
import { Data } from "@/components/Data";
import { Simulator } from "@/components/Simulator";
import { PageHeader } from "@/components/ui";
import { getClasses, getCustomers } from "@/lib/api";

export const metadata: Metadata = { title: "Simulator · If Ensurance Staff" };

async function Load() {
  const [customers, classes] = await Promise.all([getCustomers(), getClasses()]);
  return <Simulator customers={customers} classes={classes} />;
}

export default function SimulatorPage() {
  return (
    <>
      <PageHeader title="Simulator" sub="See each insurance's score, discount and premium, and the customer's Care Score and tier, now and with every fix confirmed." />
      <Data load={() => Load()} />
    </>
  );
}
