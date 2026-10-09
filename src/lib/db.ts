import { Pool, QueryResult, QueryResultRow } from 'pg';

const connectionString =
  process.env.DATABASE_URL ||
  process.env.SUPABASE_DB_URL;

if (!connectionString) {
  throw new Error('Please define the DATABASE_URL environment variable inside .env.local');
}

const globalPool = global as unknown as { pgPool?: Pool };

if (!globalPool.pgPool) {
  globalPool.pgPool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });
}

const pool = globalPool.pgPool;

export async function query<R extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<R>> {
  return pool.query<R>(text, params);
}

export async function dbConnect() {
  return pool;
}

export default dbConnect;
