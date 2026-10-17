"use client";

import { useActionState, useState, type ReactNode } from "react";
import type { SaveState } from "@/app/actions";
// Form controls: 36–40 px buttons, the app's small blue switch.

export function Label({ text, hint, children, className = "" }: { text: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-sm font-medium">{text}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted-foreground">{hint}</span>}
    </label>
  );
}

/** The app's switch (36 × 20, blue when on). Posts "on" through a hidden input when checked.
 * `label` is the accessible name; `children` is the visible text, which also toggles the switch. */
export function Switch({ name, defaultChecked, label, onChange, children }: { name?: string; defaultChecked?: boolean; label: string; onChange?: (v: boolean) => void; children?: ReactNode }) {
  const [on, setOn] = useState(!!defaultChecked);
  return (
    <label className="inline-flex min-h-11 cursor-pointer items-center gap-3">
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
        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border-2 border-transparent transition-colors ${on ? "bg-primary" : "bg-input"}`}
      >
        <span className={`block h-4 w-4 rounded-full bg-card shadow-sm transition-transform ${on ? "translate-x-4" : "translate-x-0"}`} />
      </button>
      {children && <span className="text-sm font-medium">{children}</span>}
    </label>
  );
}

/** A submit button that asks once more before it submits: the first click arms it, leaving it disarms it. */
export function ConfirmSubmit({ children, confirm, label, className, armedClassName }: { children: ReactNode; confirm: string; label?: string; className: string; armedClassName: string }) {
  const [armed, setArmed] = useState(false);
  return (
    <button
      type={armed ? "submit" : "button"}
      aria-label={armed ? confirm : label}
      onClick={() => setArmed(true)}
      onBlur={() => setArmed(false)}
      className={armed ? armedClassName : className}
    >
      {armed ? confirm : children}
    </button>
  );
}

export function Button({ children, variant = "primary", big = true, className = "", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "outline" | "ghost"; big?: boolean }) {
  const variants = {
    primary: "bg-primary text-primary-foreground hover:bg-primary-pressed",
    outline: "border bg-card hover:bg-secondary",
    ghost: "text-primary hover:bg-accent",
  };
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 font-medium whitespace-nowrap transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${big ? "h-10 px-5 text-[0.9375rem]" : "h-9 px-3.5 text-sm"} rounded-lg ${variants[variant]} ${className}`}
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
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Button type="submit" big={big} disabled={pending || !dirty}>{pending ? "Saving…" : button}</Button>
        <span aria-live="polite" className={`text-sm font-semibold ${shown?.ok ? "text-success" : "text-destructive"}`}>
          {!pending && shown?.message}
        </span>
      </div>
    </form>
  );
}
