import { Pool } from "pg";

import { env } from "../config/env.js";

let poolInstance: Pool | null = null;

export function getPool() {
  if (!poolInstance) {
    if (!env.DATABASE_URL) {
      throw new Error("DATABASE_URL is required to run the API with Postgres");
    }

    poolInstance = new Pool({
      connectionString: env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false,
      },
    });
  }

  return poolInstance;
}
