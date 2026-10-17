"use client";

import { useMemo, useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { addRule, deleteRule, saveClass, saveRule } from "@/app/actions";
import { describe, fieldLabel, rowsToCondition, type FieldInfo, type Row } from "@/lib/context";
import type { InsuranceClass, Risk, Rule } from "@/lib/types";
import { Button, ConfirmSubmit, Label, SaveForm, Switch, smallInputClass } from "./form";
import { IconTile, Pill, categoryIcon, classIcon, humanize } from "./ui";

function RuleEditor({ rule }: { rule: Rule }) {
  return (
    <div className={`rounded-2xl border-2 p-4 ${rule.active ? "border-transparent bg-background" : "border-dashed bg-card opacity-70"}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold">{rule.label}</p>
          <div className="mt-1 flex flex-wrap gap-2">
            {describe(rule.context).map((d) => <Pill key={d} tone={rule.context ? "accent" : "secondary"}>{d}</Pill>)}
          </div>
        </div>
        {!rule.is_default && (
          <form action={deleteRule}>
            <input type="hidden" name="rule_id" value={rule.rule_id} />
            <ConfirmSubmit label={`Delete ${rule.label}`} confirm="Delete for good"
              className="grid h-11 w-11 place-items-center rounded-xl text-muted-foreground hover:bg-danger-soft hover:text-destructive"
              armedClassName="h-11 rounded-xl bg-destructive px-3 font-semibold whitespace-nowrap text-primary-foreground">
              <Trash2 className="h-5 w-5" aria-hidden />
            </ConfirmSubmit>
          </form>
        )}
      </div>
      <SaveForm action={saveRule} className="mt-3">
        <input type="hidden" name="rule_id" value={rule.rule_id} />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Label text="Insurance score points">
            <input name="points" type="number" min={0} max={1000} required defaultValue={rule.points} className={smallInputClass} />
          </Label>
          <Label text="Half-life, years">
            <input name="half_life_years" type="number" min={1} max={100} required defaultValue={rule.half_life_years} className={smallInputClass} />
          </Label>
          {rule.is_default ? (
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
          <Switch name="active" defaultChecked={rule.active} label={`${rule.label} active`}>Active</Switch>
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

function AddRule({ risk, fields, onDone, defaults }: { risk: Risk; fields: FieldInfo[]; onDone: () => void; defaults: Rule | undefined }) {
  const [rows, setRows] = useState<Row[]>([emptyRow()]);
  const condition = useMemo(() => rowsToCondition(rows, fields), [rows, fields]);
  const update = (i: number, patch: Partial<Row>) => setRows(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));

  return (
    <div className="pop-in rounded-2xl border-2 border-primary bg-accent/40 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="font-semibold">New context for “{risk.title}”</p>
        <button type="button" onClick={onDone} aria-label="Close" className="grid h-11 w-11 place-items-center rounded-xl hover:bg-card"><X className="h-5 w-5" /></button>
      </div>
      <SaveForm action={async (s, f) => { const r = await addRule(s, f); if (r?.ok) onDone(); return r; }} button="Add context" className="mt-3">
        <input type="hidden" name="risk_id" value={risk.id} />
        <input type="hidden" name="context" value={condition ? JSON.stringify(condition) : ""} />
        <Label text="Name">
          <input name="label" required maxLength={80} placeholder="For example: Built before 1970" className={smallInputClass} />
        </Label>

        <p className="mt-4 mb-1 font-medium">Applies when all of these are true</p>
        <div className="space-y-2">
          {rows.map((row, i) => {
            const f = fields.find((x) => x.name === row.field);
            return (
              <div key={i} className="flex flex-wrap items-start gap-2 rounded-xl bg-card p-2">
                <select aria-label="Profile field" value={row.field} onChange={(e) => { const nf = fields.find((x) => x.name === e.target.value); update(i, { field: e.target.value, op: nf ? opsFor(nf.kind)[0].op : "in", value: "", values: [] }); }} className={`${smallInputClass} w-56`}>
                  <option value="">Choose a field…</option>
                  {fields.map((x) => <option key={x.name} value={x.name}>{fieldLabel(x.name)}</option>)}
                </select>
                {f && (
                  <select aria-label="Test" value={row.op} onChange={(e) => update(i, { op: e.target.value as Row["op"] })} className={`${smallInputClass} w-36`}>
                    {opsFor(f.kind).map((o) => <option key={o.op} value={o.op}>{o.label}</option>)}
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

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Label text="Insurance score points"><input name="points" type="number" min={0} max={1000} required defaultValue={defaults?.points ?? risk.points ?? 0} className={smallInputClass} /></Label>
          <Label text="Half-life, years"><input name="half_life_years" type="number" min={1} max={100} required defaultValue={defaults?.half_life_years ?? risk.half_life_years ?? 5} className={smallInputClass} /></Label>
          <Label text="Priority" hint="Higher wins"><input name="priority" type="number" min={1} max={1000} required defaultValue={10} className={smallInputClass} /></Label>
        </div>
      </SaveForm>
    </div>
  );
}

function FixCard({ risk, rules, fields }: { risk: Risk; rules: Rule[]; fields: FieldInfo[] }) {
  const [adding, setAdding] = useState(false);
  const Icon = categoryIcon[risk.category] ?? categoryIcon.roof;
  const def = rules.find((r) => r.is_default);
  const contextRules = rules.filter((r) => !r.is_default).sort((a, b) => b.priority - a.priority || a.rule_id.localeCompare(b.rule_id));
  return (
    <section className="rounded-2xl bg-card p-5 shadow-soft">
      <div className="flex items-start gap-4">
        <IconTile icon={Icon} />
        <div className="min-w-0 flex-1">
          <h3 className="text-xl font-semibold">{risk.title}</h3>
          <p className="mt-1 text-muted-foreground">{risk.assigned ? risk.why : risk.mitigation.action}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {risk.assigned && <Pill tone="accent">In the app · {risk.object_name}</Pill>}
            <Pill>{humanize(risk.category)}</Pill>
            {risk.severity !== undefined && <Pill>Severity {risk.severity} × probability {risk.probability}</Pill>}
          </div>
        </div>
        {def && (
          <div className="hidden shrink-0 text-right sm:block">
            <p className="font-display text-3xl font-semibold text-primary-light tabular-nums">+{def.points}</p>
            <p className="text-sm text-muted-foreground">points by default</p>
          </div>
        )}
      </div>
      <div className="mt-4 space-y-3">
        {contextRules.map((r) => <RuleEditor key={r.rule_id} rule={r} />)}
        {def && <RuleEditor rule={def} />}
        {adding ? (
          <AddRule risk={risk} fields={fields} defaults={def} onDone={() => setAdding(false)} />
        ) : (
          <Button type="button" variant="outline" big={false} onClick={() => setAdding(true)}><Plus className="h-4 w-4" />Add a context</Button>
        )}
      </div>
    </section>
  );
}

function ClassPremium({ cls }: { cls: InsuranceClass }) {
  return (
    <section className="rounded-2xl bg-card p-5 shadow-soft">
      <h3 className="text-xl font-semibold">{cls.name} insurance premium</h3>
      <SaveForm action={saveClass}>
        <input type="hidden" name="class_id" value={cls.class_id} />
        <div className="mt-3 max-w-sm">
          <Label text="Base premium € / year" hint="Before the discount band of the insurance's score.">
            <input name="base_annual_premium_eur" type="number" min={0} required defaultValue={cls.base_annual_premium_eur} className={smallInputClass} />
          </Label>
        </div>
      </SaveForm>
    </section>
  );
}

export function FixRules({ classes, rules }: { classes: InsuranceClass[]; rules: Rule[] }) {
  const [classId, setClassId] = useState(classes[0]?.class_id ?? "house");
  const [category, setCategory] = useState("all");
  const [query, setQuery] = useState("");
  const cls = classes.find((c) => c.class_id === classId) ?? classes[0];
  if (!cls) return null;
  const categories = [...new Set(cls.risks.map((r) => r.category))].sort();
  // The app's risks first, then the catalogue.
  const shown = [...cls.risks].sort((a, b) => Number(!!b.assigned) - Number(!!a.assigned)).filter(
    (r) => (category === "all" || r.category === category) && (!query || `${r.title} ${r.id}`.toLowerCase().includes(query.toLowerCase())),
  );

  return (
    <>
      <div role="group" aria-label="Insurance class" className="mb-4 flex flex-wrap gap-2">
        {classes.map((c) => {
          const Icon = classIcon[c.class_id] ?? classIcon.house;
          const on = c.class_id === cls.class_id;
          return (
            <button key={c.class_id} aria-pressed={on} type="button" onClick={() => { setClassId(c.class_id); setCategory("all"); setQuery(""); }}
              className={`flex h-14 items-center gap-2 rounded-2xl px-5 text-lg font-semibold ${on ? "bg-primary text-primary-foreground" : "bg-card shadow-soft"}`}>
              <Icon className="h-6 w-6" aria-hidden />{c.name}
              <span className={`text-sm font-medium ${on ? "text-primary-foreground/80" : "text-muted-foreground"}`}>{c.risks.length}</span>
            </button>
          );
        })}
      </div>

      <div className="space-y-4">
        <ClassPremium key={cls.class_id} cls={cls} />
        {categories.length > 2 && (
          <div className="flex flex-wrap items-center gap-2">
            {["all", ...categories].map((c) => (
              <button key={c} type="button" aria-pressed={category === c} onClick={() => setCategory(c)}
                className={`h-12 rounded-xl px-4 font-semibold ${category === c ? "bg-foreground text-background" : "bg-card shadow-soft"}`}>
                {c === "all" ? "All fixes" : humanize(c)}
              </button>
            ))}
            <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search fixes" aria-label="Search fixes" className={`${smallInputClass} h-12 sm:ml-auto sm:w-64`} />
          </div>
        )}
        {shown.map((r) => <FixCard key={r.id} risk={r} rules={rules.filter((x) => x.risk_id === r.id)} fields={cls.fields} />)}
        {shown.length === 0 && <p className="text-muted-foreground">No fix matches.</p>}
      </div>
    </>
  );
}
