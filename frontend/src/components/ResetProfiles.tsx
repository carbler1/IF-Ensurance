"use client";

import { useActionState } from "react";
import { resetProfiles } from "@/app/actions";
import { Card } from "./ui";
import { ConfirmSubmit } from "./form";

/** Resets the database to the demo profiles; asks once before it runs. */
export function ResetProfiles() {
  const [state, run, pending] = useActionState(() => resetProfiles(), null);
  return (
    <section className="mt-10">
      <h2 className="mb-3 text-lg font-semibold">Demo data</h2>
      <Card className="flex flex-wrap items-center gap-4">
        <p className="min-w-0 flex-1 text-sm text-muted-foreground">
          Resets the demo customer and all dashboard edits, deletes the generated preset customers and loads the 12 demo profiles.
        </p>
        <form action={run} className="flex items-center gap-3">
          <ConfirmSubmit confirm="Reset for good"
            className="h-10 rounded-lg border bg-card px-4 text-[0.9375rem] font-medium whitespace-nowrap hover:bg-secondary"
            armedClassName="h-10 rounded-lg bg-destructive px-4 text-[0.9375rem] font-semibold whitespace-nowrap text-primary-foreground">
            {pending ? "Resetting…" : "Reset to demo profiles"}
          </ConfirmSubmit>
        </form>
        <span aria-live="polite" className={`basis-full text-sm font-semibold ${state?.ok ? "text-success" : "text-destructive"}`}>
          {!pending && state?.message}
        </span>
      </Card>
    </section>
  );
}
