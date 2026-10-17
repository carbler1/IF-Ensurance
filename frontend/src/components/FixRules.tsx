"use client";

import { useMemo, useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { addRule, deleteRule, saveRule } from "@/app/actions";
import { describe, fieldLabel, rowsToCondition, type FieldInfo, type Row } from "@/lib/context";
import { sortRules, type CatalogueEntry, type Rule } from "@/lib/math";
import { Button, Label, SaveForm, Switch, smallInputClass } from "./form";
import { IconTile, Pill, categoryIcon, eur, humanize } from "./ui";

function RuleEditor({ rule }: { rule: Rule }) {
  const isDefault = rule.priority === 0 && rule.ruleId.startsWith("default.");
  return (
    <div className={`rounded-2xl border-2 p-4 ${rule.active ? "border-transparent bg-background" : "border-dashed bg-card opacity-70"}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold">{rule.label}</p>
          <div className="mt-1 flex flex-wrap gap-2">
            {describe(rule.context).map((d) => <Pill key={d} tone={rule.context ? "accent" : "secondary"}>{d}</Pill>)}
          </div>
        </div>
        {!isDefault && (
          <form action={deleteRule}>
            <input type="hidden" name="rule_id" value={rule.ruleId} />
            <button type="submit" aria-label={`Delete ${rule.label}`} className="grid h-11 w-11 place-items-center rounded-xl text-muted-foreground hover:bg-danger-soft hover:text-destructive">
              <Trash2 className="h-5 w-5" />
            </button>
          </form>
        )}
      </div>
      <SaveForm action={saveRule} className="mt-3">
        <input type="hidden" name="rule_id" value={rule.ruleId} />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Label text="Care Score points">
            <input name="points" type="number" min={0} required defaultValue={rule.points} className={smallInputClass} />
          </Label>
          <Label text="Premium cut € / year">
            <input name="premium_reduction_eur" type="number" min={0} required defaultValue={rule.premiumReductionEur} className={smallInputClass} />
          </Label>
          <Label text="Half-life, years">
            <input name="half_life_years" type="number" min={1} max={100} required defaultValue={rule.halfLifeYears} className={smallInputClass} />
          </Label>
          {isDefault ? (
            <div>
              <span className="mb-1 block font-medium">Priority</span>
              <p className="flex h-11 items-center text-muted-foreground">0 · fallback</p>
            </div>
          ) : (
            <Label text="Priority">
              <input name="priority" type="number" min={1} max={1000} required defaultValue={rule.priority} className={smallInputClass} />
            </Label>
          )}
        </div>
        <div className="mt-3 flex items-center gap-3">
          <Switch name="active" defaultChecked={rule.active} label={`${rule.label} active`} />
          <span className="font-medium">Active</span>
        </div>
      </SaveForm>
    </div>
  );
}

const emptyRow = (): Row => ({ field: "", op: "in", value: "", values: [] });

function opsFor(kind: FieldInfo["kind"]): { op: Row["op"]; label: string }[] {
  const common = [{ op: "known" as const, label: "is known" }, { op: "unknown" as const, label: "is unknown" }];
  if (kind === "enum") return [{ op: "in", label: "is one of" }, ...common];
  if (kind === "year") return [{ op: "lt", label: "before" }, { op: "gt", label: "after" }, { op: "eq", label: "is" }, ...common];
  return [{ op: "lt", label: "before" }, { op: "gt", label: "after" }, ...common];
}

function AddRule({ entry, fields, onDone, defaults }: { entry: CatalogueEntry; fields: FieldInfo[]; onDone: () => void; defaults: Rule | undefined }) {
  const [rows, setRows] = useState<Row[]>([emptyRow()]);
  const condition = useMemo(() => rowsToCondition(rows, fields), [rows, fields]);
  const update = (i: number, patch: Partial<Row>) => setRows(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));

  return (
    <div className="pop-in rounded-2xl border-2 border-primary bg-accent/40 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="font-semibold">New context for “{entry.title}”</p>
        <button type="button" onClick={onDone} aria-label="Close" className="grid h-11 w-11 place-items-center rounded-xl hover:bg-card"><X className="h-5 w-5" /></button>
      </div>
      <SaveForm action={async (s, f) => { const r = await addRule(s, f); if (r?.ok) onDone(); return r; }} button="Add context" className="mt-3">
        <input type="hidden" name="risk_id" value={entry.id} />
        <input type="hidden" name="context" value={condition ? JSON.stringify(condition) : ""} />
        <Label text="Name">
          <input name="label" required maxLength={80} placeholder="For example: Detached houses before 1970" className={smallInputClass} />
        </Label>

        <p className="mt-4 mb-1 font-medium">Applies when all of these are true</p>
        <div className="space-y-2">
          {rows.map((row, i) => {
            const f = fields.find((x) => x.name === row.field);
            const ops = f ? opsFor(f.kind) : [];
            return (
              <div key={i} className="flex flex-wrap items-start gap-2 rounded-xl bg-card p-2">
                <select aria-label="Profile field" value={row.field} onChange={(e) => { const nf = fields.find((x) => x.name === e.target.value); update(i, { field: e.target.value, op: nf ? opsFor(nf.kind)[0].op : "in", value: "", values: [] }); }} className={`${smallInputClass} w-56`}>
                  <option value="">Choose a field…</option>
                  {fields.map((x) => <option key={x.name} value={x.name}>{fieldLabel(x.name)}</option>)}
                </select>
                {f && (
                  <select aria-label="Test" value={row.op} onChange={(e) => update(i, { op: e.target.value as Row["op"] })} className={`${smallInputClass} w-36`}>
                    {ops.map((o) => <option key={o.op} value={o.op}>{o.label}</option>)}
                  </select>
                )}
                {f && row.op === "in" && (
                  <div className="flex flex-1 flex-wrap gap-2 py-1">
                    {f.options.map((o) => {
                      const on = row.values.includes(o);
                      return (
                        <button key={o} type="button" aria-pressed={on} onClick={() => update(i, { values: on ? row.values.filter((v) => v !== o) : [...row.values, o] })}
                          className={`h-9 rounded-xl px-3 text-sm font-semibold ${on ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                          {humanize(o)}
                        </button>
                      );
                    })}
                  </div>
                )}
                {f && ["lt", "gt", "eq"].includes(row.op) && (
                  <input aria-label="Value" type={f.kind === "date" ? "date" : "number"} value={row.value} onChange={(e) => update(i, { value: e.target.value })} placeholder={f.kind === "year" ? "1970" : ""} className={`${smallInputClass} w-40`} />
                )}
                {rows.length > 1 && (
                  <button type="button" aria-label="Remove condition" onClick={() => setRows(rows.filter((_, j) => j !== i))} className="grid h-11 w-11 place-items-center rounded-xl text-muted-foreground hover:bg-danger-soft hover:text-destructive"><X className="h-5 w-5" /></button>
                )}
              </div>
            );
          })}
        </div>
        <Button type="button" variant="ghost" big={false} className="mt-2" onClick={() => setRows([...rows, emptyRow()])}><Plus className="h-4 w-4" />Add condition</Button>
        <p className="mt-2 text-sm text-muted-foreground">{condition ? describe(condition).join(" · ") : "Pick a field and a value."}</p>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Label text="Care Score points"><input name="points" type="number" min={0} required defaultValue={defaults?.points ?? entry.points} className={smallInputClass} /></Label>
          <Label text="Premium cut € / year"><input name="premium_reduction_eur" type="number" min={0} required defaultValue={defaults?.premiumReductionEur ?? 0} className={smallInputClass} /></Label>
          <Label text="Half-life, years"><input name="half_life_years" type="number" min={1} max={100} required defaultValue={defaults?.halfLifeYears ?? entry.half_life_years ?? 10} className={smallInputClass} /></Label>
          <Label text="Priority" hint="Higher wins"><input name="priority" type="number" min={1} max={1000} required defaultValue={10} className={smallInputClass} /></Label>
        </div>
      </SaveForm>
    </div>
  );
}

function FixCard({ entry, rules, fields }: { entry: CatalogueEntry; rules: Rule[]; fields: FieldInfo[] }) {
  const [adding, setAdding] = useState(false);
  const Icon = categoryIcon[entry.category] ?? categoryIcon.roof;
  const def = rules.find((r) => r.priority === 0);
  const contextRules = sortRules(rules.filter((r) => r !== def));
  return (
    <section className="rounded-2xl bg-card p-5 shadow-soft">
      <div className="flex items-start gap-4">
        <IconTile icon={Icon} />
        <div className="min-w-0 flex-1">
          <h3 className="text-xl font-semibold">{entry.title}</h3>
          <p className="mt-1 text-muted-foreground">{entry.mitigation.action}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Pill>{humanize(entry.category)}</Pill>
            <Pill>Severity {entry.severity} × probability {entry.probability}</Pill>
            <Pill>Catalogue {entry.points} points</Pill>
          </div>
        </div>
        {def && (
          <div className="hidden shrink-0 text-right sm:block">
            <p className="font-display text-3xl font-semibold text-primary-light tabular-nums">+{def.points}</p>
            <p className="text-sm text-muted-foreground">−{eur(def.premiumReductionEur)} / year</p>
          </div>
        )}
      </div>
      <div className="mt-4 space-y-3">
        {contextRules.map((r) => <RuleEditor key={r.ruleId} rule={r} />)}
        {def && <RuleEditor rule={def} />}
        {adding ? (
          <AddRule entry={entry} fields={fields} defaults={def} onDone={() => setAdding(false)} />
        ) : (
          <Button type="button" variant="outline" big={false} onClick={() => setAdding(true)}><Plus className="h-4 w-4" />Add a context</Button>
        )}
      </div>
    </section>
  );
}

export function FixRules({ catalogue, rules, fields }: { catalogue: CatalogueEntry[]; rules: Rule[]; fields: FieldInfo[] }) {
  const categories = [...new Set(catalogue.map((e) => e.category))].sort();
  const [category, setCategory] = useState<string>("all");
  const [query, setQuery] = useState("");
  const shown = catalogue.filter(
    (e) => (category === "all" || e.category === category) && (!query || `${e.title} ${e.id}`.toLowerCase().includes(query.toLowerCase())),
  );
  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {["all", ...categories].map((c) => (
          <button key={c} type="button" aria-pressed={category === c} onClick={() => setCategory(c)}
            className={`h-12 rounded-xl px-4 font-semibold ${category === c ? "bg-primary text-primary-foreground" : "bg-card shadow-soft"}`}>
            {c === "all" ? "All fixes" : humanize(c)}
          </button>
        ))}
        <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search fixes" aria-label="Search fixes" className={`${smallInputClass} ml-auto h-12 w-64`} />
      </div>
      <div className="space-y-4">
        {shown.map((e) => <FixCard key={e.id} entry={e} rules={rules.filter((r) => r.riskId === e.id)} fields={fields} />)}
        {shown.length === 0 && <p className="text-muted-foreground">No fix matches.</p>}
      </div>
    </>
  );
}
