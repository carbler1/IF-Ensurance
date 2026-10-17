import type { Metadata } from "next";
import { Data } from "@/components/Data";
import { Simulator } from "@/components/Simulator";
import { PageHeader } from "@/components/ui";
import { getCatalogue, getCustomers, getProfileFields, getRules, getSettings, getTiers } from "@/lib/data";

export const metadata: Metadata = { title: "Simulator · If Life Partner Staff" };

async function Load() {
  const [customers, catalogue, rules, settings, tiers, fields] = await Promise.all([
    getCustomers(), getCatalogue(), getRules(), getSettings(), getTiers(), getProfileFields(),
  ]);
  const homes = customers.map((c) => ({ homeId: c.homeId, label: `${c.street}, ${c.city}`, profile: c.profile }));
  return <Simulator homes={homes} catalogue={catalogue} rules={rules} settings={settings} tiers={tiers} fields={fields} />;
}

export default function SimulatorPage() {
  return (
    <>
      <PageHeader title="Simulator" sub="See what a home gains when every fix that applies to it is confirmed, with the current rules. Nothing here is saved." />
      <Data load={() => Load()} />
    </>
  );
}
