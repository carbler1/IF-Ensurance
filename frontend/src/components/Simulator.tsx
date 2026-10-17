"use client";

import { useMemo, useState } from "react";
import { RotateCcw } from "lucide-react";
import { fieldLabel, describe, type FieldInfo } from "@/lib/context";
import { UNKNOWN, profileValue, type Profile, type ProfileValue } from "@/lib/match";
import { simulate, type CatalogueEntry, type Rule, type Settings, type TierRow } from "@/lib/math";
import { smallInputClass } from "./form";
import { ScoreRing } from "./ScoreRing";
import { Card, IconTile, Pill, categoryIcon, eur, humanize, tierColor } from "./ui";

type Home = { homeId: string; label: string; profile: Profile };

const flatten = (p: Profile, fields: FieldInfo[]): Record<string, ProfileValue> =>
  Object.fromEntries(fields.map((f) => [f.name, profileValue(p, f.name)]));

function FieldControl({ field, value, onChange }: { field: FieldInfo; value: ProfileValue; onChange: (v: ProfileValue) => void }) {
  const unknown = value === UNKNOWN;
  if (field.kind === "enum") {
    return (
      <select aria-label={fieldLabel(field.name)} value={String(value)} onChange={(e) => onChange(e.target.value)} className={smallInputClass}>
        <option value={UNKNOWN}>Unknown</option>
        {field.options.map((o) => <option key={o} value={o}>{humanize(o)}</option>)}
      </select>
    );
  }
  return (
    <div className="flex gap-2">
      <input
        aria-label={fieldLabel(field.name)}
        type={field.kind === "date" ? "date" : "number"}
        value={unknown ? "" : String(value)}
        placeholder="Unknown"
        onChange={(e) => onChange(e.target.value === "" ? UNKNOWN : field.kind === "year" ? Number(e.target.value) : e.target.value)}
        className={smallInputClass}
      />
    </div>
  );
}

export function Simulator({ homes, catalogue, rules, settings, tiers, fields }: { homes: Home[]; catalogue: CatalogueEntry[]; rules: Rule[]; settings: Settings; tiers: TierRow[]; fields: FieldInfo[] }) {
  const [homeId, setHomeId] = useState(homes[0]?.homeId ?? "");
  const base = homes.find((h) => h.homeId === homeId);
  const [values, setValues] = useState<Record<string, ProfileValue>>(() => flatten(base?.profile ?? {}, fields));
  const sim = useMemo(() => simulate(values, catalogue, rules, settings, tiers), [values, catalogue, rules, settings, tiers]);
  const ringMax = Math.round(Math.max(...tiers.map((t) => t.minScore), settings.scoreStart) * 1.25);
  const known = Object.values(values).filter((v) => v !== UNKNOWN).length;

  const pickHome = (id: string) => {
    setHomeId(id);
    setValues(flatten(homes.find((h) => h.homeId === id)?.profile ?? {}, fields));
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
      <Card className="h-fit">
        <h2 className="text-xl font-semibold">Home</h2>
        <label className="mt-3 block">
          <span className="mb-1 block font-medium">Start from a customer</span>
          <select value={homeId} onChange={(e) => pickHome(e.target.value)} className={smallInputClass}>
            {homes.map((h) => <option key={h.homeId} value={h.homeId}>{h.label}</option>)}
            <option value="">Empty profile</option>
          </select>
        </label>
        <div className="mt-4 flex items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground">{known} of {fields.length} fields known. Change any value to see the effect.</p>
          <button type="button" onClick={() => pickHome(homeId)} className="flex h-11 shrink-0 items-center gap-1 rounded-xl px-3 font-medium text-primary hover:bg-accent">
            <RotateCcw className="h-4 w-4" />Reset
          </button>
        </div>
        <div className="mt-2 space-y-3">
          {fields.map((f) => (
            <label key={f.name} className="block">
              <span className="mb-1 block text-sm font-medium">{fieldLabel(f.name)}</span>
              <FieldControl field={f} value={values[f.name] ?? UNKNOWN} onChange={(v) => setValues({ ...values, [f.name]: v })} />
            </label>
          ))}
        </div>
      </Card>

      <div className="space-y-4">
        <Card className="flex flex-col items-center gap-6 text-center md:flex-row md:text-left">
          <ScoreRing score={settings.scoreStart} projected={sim.scoreAfter} max={ringMax} tierMins={tiers.map((t) => t.minScore)} />
          <div className="grid flex-1 gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Tier after every fix</p>
              <p className="mt-1 flex items-center justify-center gap-2 text-xl font-semibold md:justify-start">
                {sim.tierAfter && <span className={`h-3 w-3 rounded-full ${tierColor[sim.tierAfter.index] ?? "bg-primary"}`} />}
                {sim.tierAfter?.name ?? "—"}
              </p>
              <p className="text-sm text-muted-foreground">Now {sim.tierBefore?.name ?? "—"} · deductible −{eur(sim.tierAfter?.deductibleReductionEur ?? 0)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Premium per year</p>
              <p className="mt-1 font-display text-3xl font-semibold tabular-nums">{eur(sim.premiumAfter)}</p>
              <p className="text-sm text-muted-foreground">
                <span className="line-through">{eur(settings.baseAnnualPremiumEur)}</span> · <span className="font-semibold text-success">−{eur(sim.premiumCut)}</span>
              </p>
              {sim.capped && <p className="mt-1 text-sm text-muted-foreground">Capped at {settings.maxReductionPercent} % (fixes add up to {eur(sim.premiumCutRaw)}).</p>}
            </div>
          </div>
        </Card>

        <h2 className="pt-2 text-xl font-semibold">{sim.fixes.length} fixes apply to this home</h2>
        {sim.fixes.length === 0 && <Card className="text-muted-foreground">No catalogue fix applies. Fill in more of the profile, for example the building year.</Card>}
        {sim.fixes.map((f) => {
          const Icon = categoryIcon[f.entry.category] ?? categoryIcon.roof;
          return (
            <Card key={f.entry.id}>
              <div className="flex items-start gap-4">
                <IconTile icon={Icon} />
                <div className="min-w-0 flex-1">
                  <h3 className="text-xl font-semibold">{f.entry.title}</h3>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {f.rule ? (
                      <Pill tone={f.rule.context ? "accent" : "secondary"}>{f.rule.context ? `${f.rule.label}: ${describe(f.rule.context).join(", ")}` : "Default rule"}</Pill>
                    ) : (
                      <Pill tone="warning">No active rule · catalogue points, no premium cut</Pill>
                    )}
                    {f.halfLifeYears && <Pill>Halves every {f.halfLifeYears} years</Pill>}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-display text-3xl font-semibold text-primary-light tabular-nums">+{f.points}</p>
                  <p className="text-sm font-semibold text-success">−{eur(f.premiumReductionEur)} / year</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
