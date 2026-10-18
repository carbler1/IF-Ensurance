"use client";

import { useActionState } from "react";
import { Button } from "@/components/form";
import { inputClass } from "@/components/ui";
import { signIn } from "./actions";

export function LoginForm({ accounts }: { accounts: { name: string; claimed: boolean }[] }) {
  const [error, action, pending] = useActionState(signIn, null);
  return (
    <form action={action} className="space-y-6">
      <fieldset className="space-y-2">
        <legend className="mb-2 text-[0.9375rem] font-medium">Account</legend>
        {accounts.map((a) => (
          <label key={a.name} className="flex min-h-14 cursor-pointer items-center gap-3 rounded-lg border bg-card px-4 py-2.5 transition-colors hover:bg-secondary has-checked:border-primary has-checked:bg-accent has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-primary">
            <input type="radio" name="name" value={a.name} required className="h-4 w-4 shrink-0 accent-primary focus-visible:outline-none" />
            <span className="min-w-0">
              <span className="block truncate font-medium">{a.name}</span>
              <span className="block text-sm text-muted-foreground">{a.claimed ? "claimed" : "unclaimed: you set the password"}</span>
            </span>
          </label>
        ))}
      </fieldset>
      <label className="block">
        <span className="mb-1.5 block text-[0.9375rem] font-medium">Password (8+ characters)</span>
        <input type="password" name="password" required minLength={8} autoComplete="current-password" className={inputClass} />
      </label>
      {error && <p role="alert" className="rounded-lg bg-danger-soft px-4 py-3 text-sm font-medium text-destructive">{error}</p>}
      <Button disabled={pending} className="w-full">{pending ? "Signing in…" : "Sign in"}</Button>
    </form>
  );
}
