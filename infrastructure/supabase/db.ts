/**
 * Infrastructure — Drizzle Database Client
 *
 * Connects to PostgreSQL database using postgres driver and exports drizzle db client.
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString =
  process.env.DATABASE_URL ||
  (process.env.NODE_ENV === 'test' ? 'postgresql://postgres:postgres@localhost:5432/test' : undefined);

if (!connectionString) {
  throw new Error(
    'DATABASE_URL environment variable is missing or empty. ' +
    'Please configure it in .env.local to point to your Supabase instance.'
  );
}

// For Serverless environments, using a single connection or pool is best
const client = postgres(connectionString, { prepare: false });

export const db = drizzle(client, { schema });
