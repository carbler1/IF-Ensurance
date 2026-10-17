import "server-only";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

// One pool per server process. In dev, hot reloads keep it on globalThis instead of leaking pools.
const g = globalThis as unknown as { ilpPool?: Pool };
const pool = (g.ilpPool ??= new Pool({ connectionString: process.env.DATABASE_URL, max: 5 }));

export const db = drizzle({ client: pool, schema });
export * from "./schema";
