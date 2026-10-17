"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Check, RotateCcw } from "lucide-react";
import { runSimulation, type SimInput } from "@/app/actions";
import { describe, fieldLabel } from "@/lib/context";
import type { Customer, Field, InsuranceClass, ProfileValue, Simulation } from "@/lib/types";
import { BandBar } from "./Bands";
import { smallInputClass } from "./form";
import { ScoreRing } from "./ScoreRing";
import { Card, IconTile, Pill, categoryIcon, classIcon, eur, humanize, tierColor } from "./ui";

const UNKNOWN = "unknown";

function FieldControl({ field, value, onChange }: { field: Field; value: ProfileValue; onChange: (v: ProfileValue) => void }) {
  if (field.kind === "enum") {
    return (
      <select aria-label={fieldLabel(field.name)} value={String(value)} onChange={(e) => onChange(e.target.value)} className={smallInputClass}>
        <option value={UNKNOWN}>Unknown</option>
        {field.options.map((o) => <option key={o} value={o}>{humanize(o)}</option>)}
      </select>
    );
  }
  return (
    <input
      aria-label={fieldLabel(field.name)}
      type={field.kind === "date" ? "date" : "number"}
      value={value === UNKNOWN ? "" : String(value)}
      placeholder="Unknown"
      onChange={(e) => onChange(e.target.value === "" ? UNKNOWN : field.kind === "year" ? Number(e.target.value) : e.target.value)}
      className={smallInputClass}
    />
  );
}

const inputsOf = (c: Customer | undefined, classes: InsuranceClass[]): SimInput[] =>
  (c?.objects ?? []).map((o) => {
    const fields = classes.find((k) => k.class_id === o.class_id)?.fields ?? [];
    return {
      object_id: o.object_id, class_id: o.class_id, name: o.name, history: o.history,
      profile: Object.fromEntries(fields.map((f) => [f.name, o.profile[f.name] ?? UNKNOWN])),
    };
  });

const off = (pct: number) => (pct ? `${pct} % off` : "No discount");

export function Simulator({ customers, classes }: { customers: Customer[]; classes: InsuranceClass[] }) {
  const [customerId, setCustomerId] = useState(customers[0]?.customer_id ?? "");
  const customer = customers.find((c) => c.customer_id === customerId);
  const [inputs, setInputs] = useState<SimInput[]>(() => inputsOf(customer, classes));
  const [active, setActive] = useState(0);
  const [sim, setSim] = useState<Simulation | null>(customer ?? null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const first = useRef(true);
  const latest = useRef(0);

  // Ask the backend again a moment after the last change.
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    const id = setTimeout(() => startTransition(async () => {
      const n = ++latest.current;
      const r = await runSimulation(inputs);
      if (n !== latest.current) return; // a newer request is on its way
      if (r.ok) { setSim(r.result); setError(null); } else setError(r.message);
    }), 250);
    return () => clearTimeout(id);
  }, [inputs]);

  const pickCustomer = (id: string) => {
    setCustomerId(id);
    setInputs(inputsOf(customers.find((c) => c.customer_id === id), classes));
    setActive(0);
  };
  const setValue = (field: string, v: ProfileValue) =>
    setInputs(inputs.map((o, i) => (i === active ? { ...o, profile: { ...o.profile, [field]: v } } : o)));

  const obj = inputs[active];
  const cls = classes.find((c) => c.class_id === obj?.class_id);
  const result = sim?.objects[active];
  const agg = sim?.aggregate;
  const max = sim?.model.max_score ?? 1000;

  return (
    // Container queries: the layout follows the content width, which the side nav narrows from md up.
    <div className="@container space-y-4">
      <Card className="flex flex-col gap-6 @3xl:flex-row @3xl:items-center">
        {sim && agg && <div className="self-center"><ScoreRing score={agg.now} projected={agg.after} max={max} tierMins={sim.model.tiers.map((t) => t.min_score)} /></div>}
        <div className="@container min-w-0 flex-1">
          <div className="grid gap-4 @md:grid-cols-2 @2xl:grid-cols-3">
            <label className="col-span-full block">
              <span className="mb-1 block font-medium">Customer</span>
              <select value={customerId} onChange={(e) => pickCustomer(e.target.value)} className={smallInputClass}>
                {customers.map((c) => <option key={c.customer_id} value={c.customer_id}>{c.name}</option>)}
              </select>
            </label>
            <div>
              <p className="text-sm text-muted-foreground">Tier · now {agg?.tier_now?.name ?? "—"}</p>
              <p className="mt-1 flex items-center gap-2 text-xl font-semibold">
                {agg?.tier_after && <span className={`h-3 w-3 rounded-full ${tierColor[agg.tier_after.index] ?? "bg-primary"}`} />}
                {agg?.tier_after?.name ?? "—"} <span className="text-sm font-normal text-muted-foreground">after every fix</span>
              </p>
              <ul className="mt-1 space-y-0.5 text-sm text-muted-foreground">
                {agg?.tier_after?.bonuses.map((b) => <li key={b} className="flex gap-1"><Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />{b}</li>)}
              </ul>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">All premiums per year</p>
              <p className="mt-1 font-display text-3xl font-semibold tabular-nums">{eur(sim?.premium.after ?? 0)}</p>
              <p className="text-sm text-muted-foreground">
                Base {eur(sim?.premium.base ?? 0)} · now {eur(sim?.premium.now ?? 0)}
              </p>
            </div>
            <div aria-live="polite" className="text-sm text-muted-foreground">
              {pending ? "Calculating…" : error ? <span className="font-semibold text-destructive">{error}</span> : "The Care Score is the average of the five insurance scores. Numbers come from the backend; nothing is saved."}
            </div>
          </div>
        </div>
      </Card>

      <div role="group" aria-label="Insurance" className="grid grid-cols-2 gap-3 @xl:grid-cols-3 @4xl:grid-cols-5">
        {inputs.map((o, i) => {
          const Icon = classIcon[o.class_id] ?? classIcon.house;
          const r = sim?.objects[i];
          const on = i === active;
          return (
            <button key={o.object_id ?? i} aria-pressed={on} type="button" onClick={() => setActive(i)}
              className={`rounded-2xl border-2 bg-card p-4 text-left ${on ? "border-primary bg-accent" : "border-transparent shadow-soft"}`}>
              <span className="flex items-center gap-2 font-semibold"><Icon className="h-5 w-5 text-primary" aria-hidden />{r?.class_name ?? o.class_id}</span>
              <span className="mt-1 block truncate text-sm text-muted-foreground">{o.name}</span>
              <span className="mt-2 block font-display text-2xl font-semibold tabular-nums">
                {r?.score.now ?? "—"}{r && r.score.after > r.score.now && <span className="text-primary-light"> → {r.score.after}</span>}
              </span>
              <span className={`block text-sm font-semibold ${r?.band.after ? "text-success" : "text-muted-foreground"}`}>
                {r ? (r.band.after > r.band.now ? `${off(r.band.now)} → ${off(r.band.after)}` : off(r.band.now)) : ""}
              </span>
            </button>
          );
        })}
      </div>

      {obj && cls && result && sim && (
        <div className="grid gap-4 @4xl:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
          <Card className="h-fit">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-xl font-semibold">{cls.name}</h2>
              <button type="button" onClick={() => setInputs(inputs.map((o, i) => (i === active ? inputsOf(customer, classes)[i] : o)))} className="flex h-11 items-center gap-1 rounded-xl px-3 font-medium text-primary hover:bg-accent">
                <RotateCcw className="h-4 w-4" />Reset
              </button>
            </div>
            <p className="text-sm text-muted-foreground">{obj.name}. Change any value to see the effect.</p>
            <div className="mt-3 space-y-3">
              {cls.fields.map((f) => (
                <label key={f.name} className="block">
                  <span className="mb-1 block text-sm font-medium">{fieldLabel(f.name)}</span>
                  <FieldControl field={f} value={obj.profile[f.name] ?? UNKNOWN} onChange={(v) => setValue(f.name, v)} />
                </label>
              ))}
            </div>
          </Card>

          <div className="space-y-4">
            <Card>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">{cls.name} score</p>
                  <p className="font-display text-4xl font-semibold tabular-nums">
                    {result.score.now}{result.score.after > result.score.now && <span className="text-primary-light"> → {result.score.after}</span>}
                    <span className="ml-1 font-sans text-base font-normal text-muted-foreground">/ {max}</span>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {result.score.next_band ? `${result.score.next_band.points_to} points to ${result.score.next_band.percent} % off` : "Top discount band"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">{cls.name} premium per year</p>
                  <p className="font-display text-3xl font-semibold tabular-nums">{eur(result.premium.after)}</p>
                  <p className="text-sm text-muted-foreground">
                    <span className="line-through">{eur(result.premium.base)}</span> · now {off(result.band.now)}
                    {result.band.after > result.band.now && <span className="font-semibold text-success"> → {off(result.band.after)}</span>}
                  </p>
                </div>
              </div>
              <div className="mt-4"><BandBar bands={sim.model.bands} max={max} score={result.score.after} /></div>
            </Card>

            {result.history.length > 0 && (
              <Card>
                <h3 className="text-lg font-semibold">Since insured ({sim.model.insurance_score_start})</h3>
                <ul className="mt-2">
                  {result.history.map((h, n) => (
                    <li key={h.label} className={`flex justify-between gap-3 py-2 ${n ? "border-t" : ""}`}>
                      <span>{h.label}</span>
                      <span className={`font-semibold ${h.points >= 0 ? "text-success" : "text-destructive"}`}>{h.points >= 0 ? `+${h.points}` : `−${Math.abs(h.points)}`}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            <h2 className="pt-2 text-xl font-semibold">{result.fixes.length} {result.fixes.length === 1 ? "fix applies" : "fixes apply"}</h2>
            {result.fixes.length === 0 && <Card className="text-muted-foreground">No fix applies. Fill in more of the profile.</Card>}
            {result.fixes.map((f) => {
              const Icon = categoryIcon[f.category] ?? categoryIcon.roof;
              return (
                <Card key={f.risk_id}>
                  <div className="flex items-start gap-4">
                    <IconTile icon={Icon} />
                    <div className="min-w-0 flex-1">
                      <h3 className="text-xl font-semibold">{f.title}</h3>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {f.rule_id ? (
                          <Pill tone={f.rule_context ? "accent" : "secondary"}>{f.rule_context ? `${f.rule_label}: ${describe(f.rule_context).join(", ")}` : "Default rule"}</Pill>
                        ) : (
                          <Pill tone="warning">No active rule · catalogue points</Pill>
                        )}
                        {f.half_life_years && <Pill>Halves every {f.half_life_years} years</Pill>}
                      </div>
                    </div>
                    <div className="shrink-0 text-center text-primary-light">
                      <p className="font-display text-3xl font-semibold tabular-nums">+{f.points}</p>
                      <p className="text-sm text-muted-foreground">points</p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
