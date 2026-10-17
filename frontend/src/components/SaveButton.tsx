"use client";

import type { SaveState } from "@/app/actions";

// Save button plus the result of the last save, announced to screen readers.
export function SaveButton({ pending, dirty, state }: { pending: boolean; dirty: boolean; state: SaveState }) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="submit"
        disabled={pending || !dirty}
        className="h-9 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-pressed disabled:cursor-not-allowed disabled:opacity-40"
      >
        {pending ? "Saving…" : "Save"}
      </button>
      <span aria-live="polite" className={`text-sm ${state?.ok ? "text-success" : "text-destructive"}`}>
        {!dirty && !pending && state?.message}
        {dirty && state && !state.ok && state.message}
      </span>
    </div>
  );
}
