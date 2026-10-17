import type { Metadata } from "next";
import { saveSettings } from "@/app/actions";
import { Data } from "@/components/Data";
import { FixRules } from "@/components/FixRules";
import { Label, SaveForm, inputClass } from "@/components/form";
import { Card, PageHeader } from "@/components/ui";
import { getCatalogue, getProfileFields, getRules, getSettings } from "@/lib/data";

export const metadata: Metadata = { title: "Score & pricing · If Life Partner Staff" };

async function Settings() {
  const s = await getSettings();
  return (
    <Card>
      <h2 className="text-xl font-semibold">Global numbers</h2>
      <SaveForm action={saveSettings}>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <Label text="Care Score of a new home" hint="Every home starts here.">
            <input name="score_start" type="number" min={0} required defaultValue={s.scoreStart} className={inputClass} />
          </Label>
          <Label text="Base premium € / year" hint="Before any fix is confirmed.">
            <input name="base_annual_premium_eur" type="number" min={0} required defaultValue={s.baseAnnualPremiumEur} className={inputClass} />
          </Label>
          <Label text="Maximum premium cut %" hint="Cap on the sum of all fix cuts.">
            <input name="max_reduction_percent" type="number" min={0} max={100} required defaultValue={s.maxReductionPercent} className={inputClass} />
          </Label>
        </div>
      </SaveForm>
    </Card>
  );
}

async function Rules() {
  const [catalogue, rules, fields] = await Promise.all([getCatalogue(), getRules(), getProfileFields()]);
  return <FixRules catalogue={catalogue} rules={rules} fields={fields} />;
}

export default function ScoringPage() {
  return (
    <>
      <PageHeader
        title="Score & pricing"
        sub="Set what each fix is worth. A fix can have a different value in a different context, for example in old houses. The backend uses these numbers for every customer."
      />
      <Data load={() => Settings()} />
      <Card className="mt-4 bg-accent shadow-none">
        <h2 className="text-lg font-semibold text-accent-foreground">How a fix gets its value</h2>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-accent-foreground">
          <li>The fix must apply to the home (the catalogue condition).</li>
          <li>Of its active contexts that match the home profile, the one with the highest priority wins.</li>
          <li>With no matching context, the default rule applies.</li>
          <li>Confirmed points halve every half-life. The premium cuts of all fixes add up to the cap at most.</li>
        </ol>
      </Card>
      <h2 className="mt-8 mb-4 text-2xl font-semibold">Fixes</h2>
      <Data load={() => Rules()} />
    </>
  );
}
