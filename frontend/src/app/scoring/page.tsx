import type { Metadata } from "next";
import { saveSettings } from "@/app/actions";
import { Data } from "@/components/Data";
import { FixRules } from "@/components/FixRules";
import { Label, SaveForm, inputClass } from "@/components/form";
import { Card, PageHeader } from "@/components/ui";
import { getClasses, getRules, getSettings } from "@/lib/api";

export const metadata: Metadata = { title: "Score & pricing · If Life Partner Staff" };

async function Settings() {
  const s = await getSettings();
  return (
    <Card>
      <h2 className="text-xl font-semibold">Care Score</h2>
      <SaveForm action={saveSettings}>
        <div className="mt-3 max-w-sm">
          <Label text="Care Score of a new customer" hint="Every customer starts here. Confirmed fixes on any insured object add to it.">
            <input name="score_start" type="number" min={0} required defaultValue={s.score_start} className={inputClass} />
          </Label>
        </div>
      </SaveForm>
    </Card>
  );
}

async function Rules() {
  const [classes, rules] = await Promise.all([getClasses(), getRules()]);
  return <FixRules classes={classes} rules={rules} />;
}

export default function ScoringPage() {
  return (
    <>
      <PageHeader
        title="Score & pricing"
        sub="Set what each fix is worth for each insurance class. A fix can have a different value in a different context, for example in old houses or for large dogs. The backend uses these numbers for every customer."
      />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
        <Data load={() => Settings()} />
        <Card className="bg-accent shadow-none">
          <h2 className="text-lg font-semibold text-accent-foreground">How a fix gets its value</h2>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-accent-foreground">
            <li>The fix must apply to the insured object (its risk condition).</li>
            <li>Of its active contexts that match the object, the highest priority wins; else the default rule.</li>
            <li>Confirmed points add to the customer&apos;s Care Score and halve every half-life.</li>
            <li>Premium cuts add up per insurance, up to that insurance&apos;s cap.</li>
          </ol>
        </Card>
      </div>
      <h2 className="mt-8 mb-4 text-2xl font-semibold">Insurances and their fixes</h2>
      <Data load={() => Rules()} />
    </>
  );
}
