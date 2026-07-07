-- Migration: 0007_provider_credentials.sql
--
-- Adds encrypted AI provider credential management table.
-- Extends ai_conversations with credential_id for cost attribution.
--
-- Per docs/09_SECURITY_SPECIFICATION.md:
--   Sensitive tokens encrypted at rest. Table restricted to admin/owner via RLS.
-- Per docs/04_DATABASE_DESIGN.md:
--   UUID PK, snake_case, timestamps, soft-delete, indexes on FK and status columns.

--> statement-breakpoint
CREATE TYPE "public"."credential_provider" AS ENUM('openai', 'anthropic', 'google');
--> statement-breakpoint
CREATE TYPE "public"."credential_status" AS ENUM('active', 'rate_limited', 'disabled', 'error');
--> statement-breakpoint
CREATE TYPE "public"."credential_model_tier" AS ENUM('flagship', 'fast');
--> statement-breakpoint

CREATE TABLE "provider_credentials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider" "credential_provider" NOT NULL,
	"label" varchar(255) NOT NULL,
	-- AES-256-GCM ciphertext stored as "iv:authTag:ciphertext" (hex-encoded, colon-separated).
	-- NEVER returned to client code or included in API responses.
	-- Decrypted server-side only at the moment of an outbound AI call.
	"encrypted_key" text NOT NULL,
	-- Lower number = tried first within a provider+tier group (failover ordering).
	"priority" integer DEFAULT 10 NOT NULL,
	"status" "credential_status" DEFAULT 'active' NOT NULL,
	"last_error_at" timestamp with time zone,
	"last_error_message" text,
	"rate_limit_reset_at" timestamp with time zone,
	-- 'flagship' = high-capability model (GPT-4o, Claude Sonnet, Gemini Pro)
	-- 'fast'     = cost-efficient model  (GPT-4o-mini, Claude Haiku, Gemini Flash)
	"model_tier" "credential_model_tier" NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	-- Soft-delete per docs/04 convention — rows are never permanently deleted.
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid
);
--> statement-breakpoint

-- Foreign keys
ALTER TABLE "provider_credentials"
	ADD CONSTRAINT "provider_credentials_created_by_users_id_fk"
	FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "provider_credentials"
	ADD CONSTRAINT "provider_credentials_deleted_by_users_id_fk"
	FOREIGN KEY ("deleted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint

-- Indexes
CREATE INDEX "idx_provider_credentials_provider" ON "provider_credentials" USING btree ("provider");
--> statement-breakpoint
CREATE INDEX "idx_provider_credentials_status" ON "provider_credentials" USING btree ("status");
--> statement-breakpoint
CREATE INDEX "idx_provider_credentials_priority" ON "provider_credentials" USING btree ("priority");
--> statement-breakpoint
CREATE INDEX "idx_provider_credentials_model_tier" ON "provider_credentials" USING btree ("model_tier");
--> statement-breakpoint
CREATE INDEX "idx_provider_credentials_created_by" ON "provider_credentials" USING btree ("created_by");
--> statement-breakpoint
CREATE INDEX "idx_provider_credentials_created_at" ON "provider_credentials" USING btree ("created_at");
--> statement-breakpoint

-- Extend ai_conversations with credential attribution column
ALTER TABLE "ai_conversations"
	ADD COLUMN "credential_id" uuid;
--> statement-breakpoint
ALTER TABLE "ai_conversations"
	ADD CONSTRAINT "ai_conversations_credential_id_provider_credentials_id_fk"
	FOREIGN KEY ("credential_id") REFERENCES "public"."provider_credentials"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "idx_ai_conversations_credential_id" ON "ai_conversations" USING btree ("credential_id");
--> statement-breakpoint

-- Enable Row Level Security
ALTER TABLE "provider_credentials" ENABLE ROW LEVEL SECURITY;

-- provider_credentials Policies
-- This table is ADMIN/OWNER ONLY — no editor or viewer access at any level.
-- Uses the existing is_admin_or_owner() helper defined in migration 0000.
CREATE POLICY "Provider credentials are readable by admins and owners only" ON "provider_credentials"
	FOR SELECT TO authenticated
	USING (deleted_at IS NULL AND public.is_admin_or_owner(auth.uid()));

CREATE POLICY "Provider credentials can be created by admins and owners only" ON "provider_credentials"
	FOR INSERT TO authenticated
	WITH CHECK (public.is_admin_or_owner(auth.uid()));

CREATE POLICY "Provider credentials can be updated by admins and owners only" ON "provider_credentials"
	FOR UPDATE TO authenticated
	USING (public.is_admin_or_owner(auth.uid()))
	WITH CHECK (public.is_admin_or_owner(auth.uid()));

-- Hard DELETE is intentionally blocked at RLS level.
-- Soft-delete via deleted_at is the only supported removal mechanism.
-- No DELETE policy is defined, so DELETE statements will be rejected by RLS.
