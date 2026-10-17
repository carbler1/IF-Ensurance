"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { saveBands } from "@/app/actions";
import type { Band } from "@/lib/types";
import { Button, SaveForm, smallInputClass } from "./form";

// The same soft colours as the score ring's segments, lowest first.
export const bandSoft = ["#f4ddd2", "#e6e1de", "#f9e8c4", "#dbe4fb", "#e0f0db"];

/** A 0–max bar split at each band, with the percent written in each segment. */
export function BandBar({ bands, max, score }: { bands: Band[]; max: number; score?: number }) {
  const edges = [{ min_score: 0, percent: 0 }, ...[...bands].sort((a, b) => a.min_score - b.min_score)];
  return (
    <div className="relative">
      <div className="flex h-9 overflow-hidden rounded-xl text-xs font-semibold" role="img" aria-label={edges.map((b) => `${b.min_score}+: ${b.percent} %`).join(", ")}>
        {edges.map((b, i) => {
          const end = edges[i + 1]?.min_score ?? max;
          return (
            <div key={b.min_score} className="flex items-center justify-center border-r-2 border-card last:border-r-0" style={{ width: `${(Math.max(0, end - b.min_score) / max) * 100}%`, background: bandSoft[i % bandSoft.length] }}>
              {b.percent ? `${b.percent} %` : "—"}
            </div>
          );
        })}
      </div>
      {score !== undefined && (
        <div className="absolute -top-1 h-11 w-1 -translate-x-1/2 rounded-full bg-primary" style={{ left: `${(Math.min(score, max) / max) * 100}%` }} aria-hidden />
      )}
      <div className="mt-1 flex justify-between text-xs text-muted-foreground"><span>0</span><span>{max}</span></div>
    </div>
  );
}

export function BandsEditor({ bands, max }: { bands: Band[]; max: number }) {
  const [rows, setRows] = useState(bands.map((b, i) => ({ key: i, ...b })));
  const preview = rows.filter((r) => Number.isFinite(r.min_score) && Number.isFinite(r.percent));
  return (
    <SaveForm action={saveBands}>
      <div className="mt-3"><BandBar bands={preview} max={max} /></div>
      <div className="mt-4 space-y-2">
        <div className="grid grid-cols-[1fr_1fr_2.75rem] gap-2 text-sm font-medium">
          <span>From insurance score</span><span>% off that insurance</span><span />
        </div>
        <p className="text-sm text-muted-foreground">Below {Math.min(...preview.map((r) => r.min_score), max)}: no discount.</p>
        {rows.map((r) => (
          <div key={r.key} className="grid grid-cols-[1fr_1fr_2.75rem] gap-2">
            <input aria-label="From insurance score" name="min_score" type="number" min={1} max={max} required defaultValue={r.min_score}
              onChange={(e) => setRows(rows.map((x) => (x.key === r.key ? { ...x, min_score: Number(e.target.value) } : x)))} className={smallInputClass} />
            <input aria-label="Percent off" name="percent" type="number" min={0} max={100} required defaultValue={r.percent}
              onChange={(e) => setRows(rows.map((x) => (x.key === r.key ? { ...x, percent: Number(e.target.value) } : x)))} className={smallInputClass} />
            {rows.length > 1 ? (
              <button type="button" aria-label="Remove band" onClick={(e) => { setRows(rows.filter((x) => x.key !== r.key)); e.currentTarget.form?.dispatchEvent(new Event("input", { bubbles: true })); }}
                className="grid h-11 w-11 place-items-center rounded-xl text-muted-foreground hover:bg-danger-soft hover:text-destructive"><X className="h-5 w-5" /></button>
            ) : <span />}
          </div>
        ))}
      </div>
      <Button type="button" variant="ghost" big={false} className="mt-2"
        onClick={(e) => { setRows([...rows, { key: Date.now(), min_score: max, percent: (rows.at(-1)?.percent ?? 0) + 5 }]); e.currentTarget.form?.dispatchEvent(new Event("input", { bubbles: true })); }}>
        <Plus className="h-4 w-4" />Add band
      </Button>
    </SaveForm>
  );
}
