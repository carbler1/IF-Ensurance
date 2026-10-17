import type { Metadata } from "next";
import { saveTier } from "@/app/actions";
import { Data } from "@/components/Data";
import { Label, SaveForm, inputClass } from "@/components/form";
import { Card, PageHeader, Pill, tierColor } from "@/components/ui";
import { getSettings, getTiers } from "@/lib/api";

export const metadata: Metadata = { title: "Tiers & rewards · If Life Partner Staff" };

async function Ladder() {
  const [tiers, settings] = await Promise.all([getTiers(), getSettings()]);
  return (
    <div className="space-y-4">
      {[...tiers].reverse().map((t) => (
        <Card key={t.index}>
          <div className="flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-xl font-semibold">
              <span className={`h-4 w-4 rounded-full ${tierColor[t.index] ?? "bg-primary"}`} />
              {t.name}
            </h2>
            {t.min_score <= settings.score_start ? <Pill tone="accent">Starting tier</Pill> : <span className="text-sm text-muted-foreground">{t.min_score}+</span>}
          </div>
          <SaveForm action={saveTier}>
            <input type="hidden" name="index" value={t.index} />
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Label text="Name"><input name="name" required maxLength={40} defaultValue={t.name} className={inputClass} /></Label>
              <Label text="Minimum Care Score"><input name="min_score" type="number" min={0} required defaultValue={t.min_score} className={inputClass} /></Label>
              <Label text="Deductible reduction €"><input name="deductible_reduction_eur" type="number" min={0} required defaultValue={t.deductible_reduction_eur} className={inputClass} /></Label>
              <Label text="Partner discount %"><input name="partner_discount_percent" type="number" min={0} max={100} required defaultValue={t.partner_discount_percent} className={inputClass} /></Label>
              <Label text="Free checkups" hint="Comma-separated, for example: plumbing, electrical" className="md:col-span-2">
                <input name="free_checkups" defaultValue={t.free_checkups.join(", ")} className={inputClass} />
              </Label>
            </div>
          </SaveForm>
        </Card>
      ))}
    </div>
  );
}

export default function TiersPage() {
  return (
    <>
      <PageHeader title="Tiers & rewards" sub="A home reaches a tier when its Care Score meets the minimum. Each tier must start above the one below it. All numbers are mock values until the score model is final." />
      <Data load={() => Ladder()} />
    </>
  );
}
