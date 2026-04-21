import { Pool } from "pg";

import { env } from "../config/env.js";

let poolInstance: Pool | null = null;

export function getPool() {
  if (!poolInstance) {
    if (!env.DATABASE_URL) {
      throw new Error("DATABASE_URL is required to run the API with Postgres");
    }

    const connectionString = normalizeConnectionString(env.DATABASE_URL);

    poolInstance = new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false,
      },
      connectionTimeoutMillis: 10_000,
      idleTimeoutMillis: 30_000,
    });
  }

  return poolInstance;
}

function normalizeConnectionString(databaseUrl: string) {
  const parsed = new URL(databaseUrl);

  parsed.searchParams.delete("sslmode");
  parsed.searchParams.delete("sslcert");
  parsed.searchParams.delete("sslkey");
  parsed.searchParams.delete("sslrootcert");

  return parsed.toString();
}
