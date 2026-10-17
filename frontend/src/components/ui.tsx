import { Suspense, type ReactNode } from "react";
import { BackendError } from "@/lib/api";

export function PageHeader({ title, sub }: { title: string; sub: string }) {
  return (
    <header className="mb-8">
      <h1 className="text-3xl font-semibold md:text-4xl">{title}</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">{sub}</p>
    </header>
  );
}

export function Card({ className = "", children }: { className?: string; children?: ReactNode }) {
  return <div className={`rounded-2xl bg-card shadow-soft ${className}`}>{children}</div>;
}

function Notice({ message }: { message: string }) {
  return (
    <Card className="border-l-4 border-destructive p-5">
      <p className="font-semibold">The data could not load</p>
      <p className="mt-1 text-sm text-muted-foreground">{message} Check that the backend is running and that ADMIN_TOKEN matches.</p>
    </Card>
  );
}

function Skeleton() {
  return <Card className="h-48 animate-pulse bg-card/60" />;
}

async function Resolve({ load }: { load: () => Promise<ReactNode> }) {
  try {
    return await load();
  } catch (e) {
    if (e instanceof BackendError) return <Notice message={e.message} />;
    throw e;
  }
}

// Streams backend data behind a skeleton and shows a notice instead of crashing when the backend is down.
export function Data({ load }: { load: () => Promise<ReactNode> }) {
  return (
    <Suspense fallback={<Skeleton />}>
      <Resolve load={load} />
    </Suspense>
  );
}

export const formatDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—";

export const sum = (counts: Record<string, number>) => Object.values(counts).reduce((a, b) => a + b, 0);
