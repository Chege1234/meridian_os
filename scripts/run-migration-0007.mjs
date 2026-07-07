/**
 * scripts/run-migration-0007.mjs
 *
 * Applies the provider_credentials migration directly to the database
 * using the postgres.js driver (already installed in this project).
 *
 * Usage:
 *   node scripts/run-migration-0007.mjs
 *
 * Requires DATABASE_URL to be set in the environment (or .env.local).
 */

import postgres from 'postgres';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Manually parse .env.local (no dotenv dependency needed)
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
  } catch { /* ok if not present */ }
}
loadEnvLocal();


const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('ERROR: DATABASE_URL is not set.');
  process.exit(1);
}

const sql = postgres(connectionString, { prepare: false });

const migration = `
-- Create enums
DO $$ BEGIN
  CREATE TYPE "credential_provider" AS ENUM('openai', 'anthropic', 'google');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "credential_status" AS ENUM('active', 'rate_limited', 'disabled', 'error');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "credential_model_tier" AS ENUM('flagship', 'fast');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Create provider_credentials table
CREATE TABLE IF NOT EXISTS "provider_credentials" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "provider" "credential_provider" NOT NULL,
  "label" varchar(255) NOT NULL,
  "encrypted_key" text NOT NULL,
  "priority" integer DEFAULT 10 NOT NULL,
  "status" "credential_status" DEFAULT 'active' NOT NULL,
  "last_error_at" timestamp with time zone,
  "last_error_message" text,
  "rate_limit_reset_at" timestamp with time zone,
  "model_tier" "credential_model_tier" NOT NULL,
  "created_by" uuid NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "deleted_at" timestamp with time zone,
  "deleted_by" uuid
);

-- Foreign keys
DO $$ BEGIN
  ALTER TABLE "provider_credentials"
    ADD CONSTRAINT "provider_credentials_created_by_users_id_fk"
    FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "provider_credentials"
    ADD CONSTRAINT "provider_credentials_deleted_by_users_id_fk"
    FOREIGN KEY ("deleted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS "idx_provider_credentials_provider" ON "provider_credentials" USING btree ("provider");
CREATE INDEX IF NOT EXISTS "idx_provider_credentials_status" ON "provider_credentials" USING btree ("status");
CREATE INDEX IF NOT EXISTS "idx_provider_credentials_priority" ON "provider_credentials" USING btree ("priority");
CREATE INDEX IF NOT EXISTS "idx_provider_credentials_model_tier" ON "provider_credentials" USING btree ("model_tier");
CREATE INDEX IF NOT EXISTS "idx_provider_credentials_created_by" ON "provider_credentials" USING btree ("created_by");
CREATE INDEX IF NOT EXISTS "idx_provider_credentials_created_at" ON "provider_credentials" USING btree ("created_at");

-- Extend ai_conversations
ALTER TABLE "ai_conversations" ADD COLUMN IF NOT EXISTS "credential_id" uuid;

DO $$ BEGIN
  ALTER TABLE "ai_conversations"
    ADD CONSTRAINT "ai_conversations_credential_id_provider_credentials_id_fk"
    FOREIGN KEY ("credential_id") REFERENCES "public"."provider_credentials"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "idx_ai_conversations_credential_id" ON "ai_conversations" USING btree ("credential_id");

-- Enable RLS
ALTER TABLE "provider_credentials" ENABLE ROW LEVEL SECURITY;

-- RLS Policies (idempotent using DO blocks)
DO $$ BEGIN
  CREATE POLICY "Provider credentials are readable by admins and owners only" ON "provider_credentials"
    FOR SELECT TO authenticated
    USING (deleted_at IS NULL AND public.is_admin_or_owner(auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Provider credentials can be created by admins and owners only" ON "provider_credentials"
    FOR INSERT TO authenticated
    WITH CHECK (public.is_admin_or_owner(auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Provider credentials can be updated by admins and owners only" ON "provider_credentials"
    FOR UPDATE TO authenticated
    USING (public.is_admin_or_owner(auth.uid()))
    WITH CHECK (public.is_admin_or_owner(auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
`;

async function run() {
  try {
    console.log('Connecting to database...');
    await sql.unsafe(migration);
    console.log('✅ Migration 0007 applied successfully.');
    console.log('   - Created: provider_credentials table');
    console.log('   - Created: 3 enums (credential_provider, credential_status, credential_model_tier)');
    console.log('   - Created: 6 indexes on provider_credentials');
    console.log('   - Extended: ai_conversations with credential_id column + FK + index');
    console.log('   - Applied: RLS policies (admin/owner only)');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

run();
