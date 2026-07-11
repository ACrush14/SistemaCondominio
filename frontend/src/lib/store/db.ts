import { Pool } from "pg";

declare global {
  var __pgPool: Pool | undefined;
}

export const pool: Pool =
  globalThis.__pgPool ??
  (globalThis.__pgPool = new Pool({
    connectionString: process.env.DATABASE_URL,
  }));
