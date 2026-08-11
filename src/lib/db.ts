import { Pool, type QueryResult, type QueryResultRow } from "pg";

let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      host: process.env.POSTGRES_HOST || "truenas.giuseppefrattura.it",
      port: parseInt(process.env.POSTGRES_PORT || "5433", 10),
      database: process.env.POSTGRES_DATABASE || "homemeds",
      user: process.env.POSTGRES_USER || "homemeds_user",
      password: process.env.POSTGRES_PASSWORD || "homemeds_password",
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    pool.on("error", (err) => {
      console.error("Unexpected error on idle PostgreSQL client:", err);
    });
  }

  return pool;
}

let tableInitialized = false;

export async function initDb(): Promise<void> {
  if (tableInitialized) return;

  const client = getPool();
  await client.query(`
    CREATE TABLE IF NOT EXISTS medications (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      expiry_date DATE NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);

  tableInitialized = true;
}

export async function query<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  await initDb();
  const client = getPool();
  return client.query<T>(text, params);
}
