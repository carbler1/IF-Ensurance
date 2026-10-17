import { Suspense, type ReactNode } from "react";
import { ApiError } from "@/lib/api";
import { Card } from "./ui";

function Notice({ message }: { message: string }) {
  return (
    <Card className="bg-danger-soft shadow-none">
      <p className="font-semibold">The data could not load</p>
      <p className="mt-1 text-muted-foreground">{message}</p>
    </Card>
  );
}

function Skeleton() {
  return <div className="h-48 animate-pulse rounded-2xl bg-card/60" />;
}

async function Resolve({ load }: { load: () => Promise<ReactNode> }) {
  try {
    return await load();
  } catch (e) {
    if (e instanceof ApiError) return <Notice message={e.message} />;
    throw e;
  }
}

/** Streams database data behind a skeleton; shows a notice instead of crashing when the database is down. */
export function Data({ load }: { load: () => Promise<ReactNode> }) {
  return (
    <Suspense fallback={<Skeleton />}>
      <Resolve load={load} />
    </Suspense>
  );
}
