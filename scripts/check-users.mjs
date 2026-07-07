/**
 * scripts/check-users.mjs
 */

import postgres from 'postgres';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnvLocal() {
  try {
    const envPath = join(__dirname, '..', '.env.local');
    const content = readFileSync(envPath, 'utf-8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx === -1) continue;
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim();
      if (!process.env[key]) process.env[key] = val;
    }
  } catch { /* ok */ }
}
loadEnvLocal();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

const sql = postgres(connectionString, { prepare: false });

async function run() {
  try {
    const users = await sql`
      SELECT u.id, u.email, u.full_name, r.name as role_name, u.status
      FROM users u
      JOIN roles r ON u.role_id = r.id;
    `;
    console.log('--- Dev Users and Roles ---');
    console.table(users);
  } catch (err) {
    console.error('Query failed:', err.message);
  } finally {
    await sql.end();
  }
}

run();
