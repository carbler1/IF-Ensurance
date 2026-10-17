import type { Metadata } from "next";
import { saveTier } from "@/app/actions";
import { Data } from "@/components/Data";
import { Label, SaveForm } from "@/components/form";
import { Card, PageHeader, Pill, inputClass, tierColor } from "@/components/ui";
import { getTiers } from "@/lib/api";

export const metadata: Metadata = { title: "Tiers & rewards · If Ensurance Staff" };

async function Ladder() {
  const tiers = await getTiers();
  return (
    <div className="space-y-4">
      {[...tiers].reverse().map((t) => (
        <Card key={t.index}>
          <div className="flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <span className={`h-2.5 w-2.5 rounded-full ${tierColor[t.index] ?? "bg-primary"}`} />
              {t.name}
            </h2>
            {t.min_score === 0 ? <Pill tone="accent">Starting tier</Pill> : <span className="text-sm text-muted-foreground">Care Score {t.min_score}+</span>}
          </div>
          <SaveForm action={saveTier}>
            <input type="hidden" name="index" value={t.index} />
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <Label text="Name"><input name="name" required maxLength={40} defaultValue={t.name} className={inputClass} /></Label>
              <Label text="Minimum Care Score" hint="The average of the insurance scores."><input name="min_score" type="number" min={0} required defaultValue={t.min_score} className={inputClass} /></Label>
              <Label text="Partner discount %"><input name="partner_discount_percent" type="number" min={0} max={100} required defaultValue={t.partner_discount_percent} className={inputClass} /></Label>
              <Label text="Bonuses" hint="One per line. The app shows them in the tier ladder; they change no price." className="md:col-span-3">
                <textarea name="bonuses" rows={Math.max(3, t.bonuses.length + 1)} defaultValue={t.bonuses.join("\n")}
                  className={`${inputClass} h-auto py-2.5`} />
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
      <PageHeader title="Tiers & rewards" sub="The Care Score is the average of a customer's insurance scores. Reaching a tier gives its bonuses on top of each insurance's own discount. All numbers are mock values." />
      <Data load={() => Ladder()} />
    </>
  );
}
