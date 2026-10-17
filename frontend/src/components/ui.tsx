import type { ReactNode } from "react";
import { Bone, Car, CircleGauge, Cog, Dog, Droplets, Flame, HeartPulse, Home, Layers, Sailboat, Snowflake, Syringe, TreePine, Warehouse, Wind, Wrench, Zap, type LucideIcon } from "lucide-react";

// Building blocks of the staff dashboard: flat panels with hairline borders, small tags.

export const categoryIcon: Record<string, LucideIcon> = {
  electricity: Zap,
  plumbing: Wrench,
  moisture: Droplets,
  roof: Home,
  heating: Flame,
  ventilation: Wind,
  engine: Cog,
  storage: Warehouse,
  tyres: Snowflake,
  service: CircleGauge,
  health: HeartPulse,
  // The app's risk areas (mobile-app/src/components/ui.tsx areaIcon).
  water: Droplets,
  insulation: Layers,
  frost: Snowflake,
  fire: Flame,
  vaccine: Syringe,
  joints: Bone,
};

export const classIcon: Record<string, LucideIcon> = {
  house: Home,
  cottage: TreePine,
  boat: Sailboat,
  car: Car,
  dog: Dog,
};

// Lives here, not in the client-only ./form, so server pages get the string rather than a client reference.
export const inputClass =
  "h-10 w-full rounded-lg border border-input bg-card px-3 text-[0.9375rem] tabular-nums text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-3 focus:ring-primary/20";

export const tierColor = ["bg-tier-bronze", "bg-tier-silver", "bg-tier-gold", "bg-tier-platinum"];

export function PageHeader({ title, sub, children }: { title: string; sub: string; children?: ReactNode }) {
  return (
    <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-[1.75rem] leading-tight font-medium">{title}</h1>
        <p className="mt-1.5 max-w-2xl text-muted-foreground">{sub}</p>
      </div>
      {children}
    </header>
  );
}

/** A flat panel. `tone` sets the surface and `flush` drops the padding, so callers never fight the defaults with
 * conflicting classes ("line" paints the border colour behind 1 px grid gaps to draw dividers). */
export function Card({ className = "", tone = "card", flush = false, children }: { className?: string; tone?: "card" | "line" | "danger" | "accent"; flush?: boolean; children?: ReactNode }) {
  const tones = { card: "border bg-card", line: "border bg-border", danger: "bg-danger-soft", accent: "bg-accent" };
  return <div className={`rounded-xl ${tones[tone]} ${flush ? "" : "p-5"} ${className}`}>{children}</div>;
}

export function IconTile({ icon: Icon, size = "md" }: { icon: LucideIcon; size?: "md" | "lg" }) {
  return (
    <span className={`grid shrink-0 place-items-center rounded-lg bg-secondary text-muted-foreground ${size === "lg" ? "h-11 w-11" : "h-9 w-9"}`}>
      <Icon className={size === "lg" ? "h-5 w-5" : "h-[18px] w-[18px]"} aria-hidden />
    </span>
  );
}

export function Pill({ children, tone = "secondary" }: { children: ReactNode; tone?: "secondary" | "accent" | "success" | "warning" }) {
  const tones = {
    secondary: "bg-secondary text-foreground",
    accent: "bg-accent text-accent-foreground",
    success: "bg-success-soft text-success",
    warning: "bg-warning-soft text-foreground",
  };
  return <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium ${tones[tone]}`}>{children}</span>;
}

/** A small segmented control: one pressed button out of a few. */
export function Segmented<T extends string>({ label, options, value, onChange }: { label: string; options: { value: T; label: ReactNode }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div role="group" aria-label={label} className="inline-flex flex-wrap gap-1 rounded-lg bg-secondary p-1">
      {options.map((o) => (
        <button key={o.value} type="button" aria-pressed={o.value === value} onClick={() => onChange(o.value)}
          className={`inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-sm font-medium transition-colors ${o.value === value ? "bg-card text-foreground shadow-soft ring-1 ring-border" : "text-muted-foreground hover:text-foreground"}`}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export const formatDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—";

export const eur = (n: number) => `${n.toLocaleString("en-GB")} €`;

export const humanize = (s: string) => s.replaceAll("_", " ").replace(/^\w/, (c) => c.toUpperCase());
