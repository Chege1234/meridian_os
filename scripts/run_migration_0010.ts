import postgres from 'postgres';
import { readFileSync } from 'fs';
import { join } from 'path';

async function applyMigration() {
  const sqlStr = readFileSync(join(process.cwd(), 'infrastructure/supabase/migrations/0010_prompt_attribution_and_versioning.sql'), 'utf-8');
  const dbUrl = process.env.DATABASE_URL!;
  const sql = postgres(dbUrl);

  try {
    console.log('Applying migration 0010...');
    await sql.unsafe(sqlStr);
    console.log('Migration 0010 applied successfully!');
  } catch (err: any) {
    console.error('Migration failed:', err.message);
  } finally {
    await sql.end();
  }
}

applyMigration();
