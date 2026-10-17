"use client";

import { useActionState, useState, type ReactNode } from "react";
import type { SaveState } from "@/app/actions";

// Form controls in the customer app's style: 56 px inputs and buttons, the small blue switch.

export const inputClass =
  "h-14 w-full rounded-2xl border border-input bg-card px-3 text-lg tabular-nums text-foreground shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary";
export const smallInputClass =
  "h-11 w-full rounded-xl border border-input bg-card px-3 text-base tabular-nums text-foreground shadow-sm focus:outline-none focus:ring-1 focus:ring-primary";

export function Label({ text, hint, children, className = "" }: { text: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block font-medium">{text}</span>
      {children}
      {hint && <span className="mt-1 block text-sm text-muted-foreground">{hint}</span>}
    </label>
  );
}

/** The app's switch (36 × 20, blue when on). Posts "on" through a hidden input when checked. */
export function Switch({ name, defaultChecked, label, onChange }: { name?: string; defaultChecked?: boolean; label: string; onChange?: (v: boolean) => void }) {
  const [on, setOn] = useState(!!defaultChecked);
  return (
    <>
      {name && on && <input type="hidden" name={name} value="on" />}
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={label}
        onClick={(e) => {
          setOn(!on);
          onChange?.(!on);
          e.currentTarget.form?.dispatchEvent(new Event("input", { bubbles: true }));
        }}
        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border-2 border-transparent shadow-sm transition-colors ${on ? "bg-primary" : "bg-input"}`}
      >
        <span className={`block h-4 w-4 rounded-full bg-background shadow-lg transition-transform ${on ? "translate-x-4" : "translate-x-0"}`} />
      </button>
    </>
  );
}

export function Button({ children, variant = "primary", big = true, className = "", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "outline" | "ghost"; big?: boolean }) {
  const variants = {
    primary: "bg-primary text-primary-foreground shadow hover:bg-primary-pressed",
    outline: "border border-input bg-card shadow-sm hover:bg-accent hover:text-accent-foreground",
    ghost: "hover:bg-accent hover:text-accent-foreground",
  };
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 font-medium whitespace-nowrap transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${big ? "h-14 rounded-2xl px-6 text-lg" : "h-11 rounded-xl px-4 text-base"} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

/** A form that tracks unsaved changes and shows the result of the last save. */
export function SaveForm({ action, children, className = "", button = "Save", big = false }: { action: (s: SaveState, f: FormData) => Promise<SaveState>; children: ReactNode; className?: string; button?: string; big?: boolean }) {
  const [state, run, pending] = useActionState(action, null);
  const [dirty, setDirty] = useState(false);
  // Typing again hides the result of the last save.
  const [dismissed, setDismissed] = useState<SaveState>(null);
  const shown = state === dismissed ? null : state;
  return (
    <form
      action={(f) => { setDirty(false); run(f); }}
      onInput={() => { setDirty(true); setDismissed(state); }}
      className={className}
    >
      {children}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button type="submit" big={big} disabled={pending || !dirty}>{pending ? "Saving…" : button}</Button>
        <span aria-live="polite" className={`text-sm font-semibold ${shown?.ok ? "text-success" : "text-destructive"}`}>
          {!pending && shown?.message}
        </span>
      </div>
    </form>
  );
}
