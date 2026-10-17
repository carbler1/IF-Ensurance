// Turns a rule's context condition into plain words, and builds one from simple rows.
import type { Condition } from "./match";

export type FieldKind = "enum" | "year" | "date";
export type FieldInfo = { name: string; kind: FieldKind; options: string[] };

export const fieldLabel = (name: string) => name.replaceAll("_", " ").replace(/^\w/, (c) => c.toUpperCase());
const valueLabel = (v: string | number) => String(v).replaceAll("_", " ");

export function describe(c: Condition | null): string[] {
  if (!c) return ["Any home"];
  switch (c.op) {
    case "and":
      return c.args.flatMap(describe);
    case "or":
      return [c.args.map((a) => describe(a).join(" and ")).join(" or ")];
    case "not":
      return c.args[0].op === "exists" ? [`${fieldLabel(c.args[0].field)} is unknown`] : [`not (${describe(c.args[0]).join(", ")})`];
    case "exists":
      return [`${fieldLabel(c.field)} is known`];
    case "in":
      return [`${fieldLabel(c.field)} is ${c.value.map(valueLabel).join(" or ")}`];
    case "eq":
      return [`${fieldLabel(c.field)} is ${valueLabel(c.value)}`];
    case "lt":
      return [`${fieldLabel(c.field)} before ${c.value}`];
    case "gt":
      return [`${fieldLabel(c.field)} after ${c.value}`];
  }
}

/** One row of the context builder. */
export type Row = { field: string; op: "in" | "lt" | "gt" | "eq" | "known" | "unknown"; value: string; values: string[] };

export function rowToCondition(row: Row, kind: FieldKind): Condition | null {
  if (!row.field) return null;
  if (row.op === "known") return { op: "exists", field: row.field };
  if (row.op === "unknown") return { op: "not", args: [{ op: "exists", field: row.field }] };
  if (row.op === "in") return row.values.length ? { op: "in", field: row.field, value: row.values } : null;
  if (!row.value.trim()) return null;
  const value = kind === "year" ? Number(row.value) : row.value.trim();
  if (kind === "year" && !Number.isInteger(value)) return null;
  return { op: row.op, field: row.field, value };
}

export function rowsToCondition(rows: Row[], fields: FieldInfo[]): Condition | null {
  const parts = rows
    .map((r) => rowToCondition(r, fields.find((f) => f.name === r.field)?.kind ?? "enum"))
    .filter((c): c is Condition => c !== null);
  if (parts.length === 0) return null;
  return parts.length === 1 ? parts[0] : { op: "and", args: parts };
}
