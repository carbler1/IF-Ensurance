"use client";

import { createContext, useActionState, useContext, useState, type ReactNode } from "react";
import type { SaveState } from "@/app/actions";
const ReadOnly = createContext(false);
export const ReadOnlyProvider = ReadOnly.Provider;
/** True when the dashboard is read-only: every data-changing control is disabled. */
export const useReadOnly = () => useContext(ReadOnly);

// Form controls: 40–44 px buttons, the app's small blue switch.

export function Label({ text, hint, children, className = "" }: { text: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-[0.9375rem] font-medium">{text}</span>
      {children}
      {hint && <span className="mt-1.5 block text-sm text-muted-foreground">{hint}</span>}
    </label>
  );
}

/** The app's switch (a 36 × 20 track, blue when on, inside a 44 × 24 target). Posts "on" through a hidden input when checked.
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
        className="grid h-6 w-11 shrink-0 place-items-center rounded-full"
      >
        <span className={`inline-flex h-5 w-9 items-center rounded-full border-2 border-transparent transition-colors ${on ? "bg-primary" : "bg-input"}`}>
          <span className={`block h-4 w-4 rounded-full bg-card shadow-sm transition-transform ${on ? "translate-x-4" : "translate-x-0"}`} />
        </span>
      </button>
      {children && <span className="text-[0.9375rem] font-medium">{children}</span>}
    </label>
  );
}

/** A submit button that asks once more before it submits: the first click arms it, leaving it disarms it. */
export function ConfirmSubmit({ children, confirm, label, className, armedClassName }: { children: ReactNode; confirm: string; label?: string; className: string; armedClassName: string }) {
  const [armed, setArmed] = useState(false);
  const readOnly = useReadOnly();
  return (
    <>
      <button
        type={armed ? "submit" : "button"}
        disabled={readOnly}
        aria-label={armed ? confirm : label}
        onClick={() => setArmed(true)}
        onBlur={() => setArmed(false)}
        className={`${armed ? armedClassName : className} disabled:cursor-not-allowed disabled:opacity-50`}
      >
        {armed ? confirm : children}
      </button>
      <span role="status" className="sr-only">{armed ? `${confirm}: press again to confirm.` : ""}</span>
    </>
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
      className={`inline-flex items-center justify-center gap-2 font-medium whitespace-nowrap transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${big ? "h-11 px-5 text-base" : "h-10 px-4 text-[0.9375rem]"} rounded-lg ${variants[variant]} ${className}`}
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
  const readOnly = useReadOnly();
  return (
    <form
      action={(f) => { setDirty(false); run(f); }}
      onInput={() => { setDirty(true); setDismissed(state); }}
      className={className}
    >
      {/* A disabled fieldset disables every input, select, textarea, switch and button inside it. */}
      <fieldset disabled={readOnly} className="contents">{children}</fieldset>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Button type="submit" big={big} disabled={readOnly || pending || !dirty}>{pending ? "Saving…" : button}</Button>
        <span aria-live="polite" className={`text-sm font-semibold ${shown?.ok ? "text-success" : "text-destructive"}`}>
          {!pending && shown?.message}
        </span>
      </div>
    </form>
  );
}
