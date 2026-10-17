import type { ReactNode } from "react";
import { Bone, Car, CircleGauge, Cog, Dog, Droplets, Flame, HeartPulse, Home, Layers, Sailboat, Snowflake, Syringe, TreePine, Warehouse, Wind, Wrench, Zap, type LucideIcon } from "lucide-react";

// Building blocks in the customer app's style (mobile-app/src/components/ui.tsx).

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

export const tierColor = ["bg-tier-bronze", "bg-tier-silver", "bg-tier-gold", "bg-tier-platinum"];

export function PageHeader({ title, sub, children }: { title: string; sub: string; children?: ReactNode }) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-3xl font-semibold">{title}</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">{sub}</p>
      </div>
      {children}
    </header>
  );
}

export function Card({ className = "", children }: { className?: string; children?: ReactNode }) {
  return <div className={`rounded-2xl bg-card p-5 shadow-soft ${className}`}>{children}</div>;
}

export function IconTile({ icon: Icon, size = "md" }: { icon: LucideIcon; size?: "md" | "lg" }) {
  return (
    <span className={`grid shrink-0 place-items-center bg-secondary ${size === "lg" ? "h-14 w-14 rounded-2xl" : "h-12 w-12 rounded-xl"}`}>
      <Icon className={size === "lg" ? "h-7 w-7" : "h-6 w-6"} aria-hidden />
    </span>
  );
}

/** The app's "+45 points" block. */
export function Points({ value, label = "points" }: { value: number; label?: string }) {
  return (
    <div className="shrink-0 text-center text-primary-light">
      <span className="block font-display text-3xl font-semibold tabular-nums">+{value}</span>
      <span className="block text-sm text-muted-foreground">{label}</span>
    </div>
  );
}

export function Pill({ children, tone = "secondary" }: { children: ReactNode; tone?: "secondary" | "accent" | "success" | "warning" }) {
  const tones = {
    secondary: "bg-secondary text-foreground",
    accent: "bg-accent text-accent-foreground",
    success: "bg-success-soft text-success",
    warning: "bg-warning-soft text-foreground",
  };
  return <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium ${tones[tone]}`}>{children}</span>;
}

export const formatDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—";

export const eur = (n: number) => `${n.toLocaleString("en-GB")} €`;

export const humanize = (s: string) => s.replaceAll("_", " ").replace(/^\w/, (c) => c.toUpperCase());
