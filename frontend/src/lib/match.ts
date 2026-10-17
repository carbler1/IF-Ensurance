// A TypeScript copy of matches() in scripts/catalogue/validate.py (decision 37 semantics), so the
// simulator runs in the browser. The Python one is the reference: keep the two identical.

export type Condition =
  | { op: "lt" | "gt" | "eq"; field: string; value: number | string }
  | { op: "in"; field: string; value: (number | string)[] }
  | { op: "exists"; field: string }
  | { op: "and" | "or"; args: Condition[] }
  | { op: "not"; args: [Condition] };

export type ProfileValue = number | string;
export type Profile = Record<string, { value: ProfileValue } | ProfileValue>;

export const UNKNOWN = "unknown";
const DATE_RE = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/;

export function profileValue(profile: Profile, field: string): ProfileValue {
  const raw = profile[field];
  if (raw === undefined) return UNKNOWN;
  return typeof raw === "object" && raw !== null ? (raw.value ?? UNKNOWN) : raw;
}

const isNumber = (x: unknown): x is number => typeof x === "number";
const isDate = (x: unknown): x is string => typeof x === "string" && DATE_RE.test(x);

function compare(op: "lt" | "gt", actual: ProfileValue, expected: ProfileValue): boolean {
  if (actual === UNKNOWN) return false;
  if (!((isNumber(actual) && isNumber(expected)) || (isDate(actual) && isDate(expected)))) return false;
  return op === "lt" ? actual < expected : actual > expected;
}

export function matches(c: Condition, profile: Profile): boolean {
  switch (c.op) {
    case "lt":
    case "gt":
      return compare(c.op, profileValue(profile, c.field), c.value);
    case "eq": {
      const actual = profileValue(profile, c.field);
      return actual !== UNKNOWN && actual === c.value;
    }
    case "in":
      // "unknown" matches only when the list contains it.
      return c.value.includes(profileValue(profile, c.field));
    case "exists":
      return profileValue(profile, c.field) !== UNKNOWN;
    case "and":
      return c.args.every((a) => matches(a, profile));
    case "or":
      return c.args.some((a) => matches(a, profile));
    case "not":
      return !matches(c.args[0], profile);
  }
}
