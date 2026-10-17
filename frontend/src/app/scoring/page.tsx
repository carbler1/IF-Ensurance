import type { Metadata } from "next";
import { saveSettings } from "@/app/actions";
import { BandsEditor } from "@/components/Bands";
import { Data } from "@/components/Data";
import { FixRules } from "@/components/FixRules";
import { Label, SaveForm, inputClass } from "@/components/form";
import { Card, PageHeader } from "@/components/ui";
import { getBands, getClasses, getRules, getSettings } from "@/lib/api";

export const metadata: Metadata = { title: "Score & pricing · If Life Partner Staff" };

async function Model() {
  const [s, b] = await Promise.all([getSettings(), getBands()]);
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
      <Card>
        <h2 className="text-xl font-semibold">Insurance score</h2>
        <p className="mt-1 text-muted-foreground">Every insurance has its own score from 0 to {s.max_score}. Confirmed fixes add points to it.</p>
        <SaveForm action={saveSettings}>
          <div className="mt-3">
            <Label text="Score of a new insurance" hint={`Between 0 and ${s.max_score}.`}>
              <input name="insurance_score_start" type="number" min={0} max={s.max_score} required defaultValue={s.insurance_score_start} className={inputClass} />
            </Label>
          </div>
        </SaveForm>
      </Card>
      <Card>
        <h2 className="text-xl font-semibold">Discount bands</h2>
        <p className="mt-1 text-muted-foreground">An insurance&apos;s own score sets the discount on that insurance only.</p>
        <BandsEditor bands={b.bands} max={b.max_score} />
      </Card>
    </div>
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
        sub="Set how insurance scores work, which discount each score earns, and how many points each fix is worth in each context."
      />
      <Data load={() => Model()} />
      <Card className="mt-4 bg-accent shadow-none">
        <h2 className="text-lg font-semibold text-accent-foreground">How it adds up</h2>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-accent-foreground">
          <li>Each insurance starts at the new-insurance score. A confirmed fix adds its points to that insurance&apos;s score.</li>
          <li>A fix&apos;s points come from its active context with the highest priority that matches the object, else its default rule.</li>
          <li>The insurance&apos;s score picks its discount band: that percent comes off that insurance&apos;s premium.</li>
          <li>The Care Score is the average of all the customer&apos;s insurance scores. It sets the tier and its bonuses (Tiers &amp; rewards).</li>
        </ol>
      </Card>
      <h2 className="mt-8 mb-4 text-2xl font-semibold">Insurances and their fixes</h2>
      <Data load={() => Rules()} />
    </>
  );
}
