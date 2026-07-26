-- ============================================================================
-- Migration: Prompt Attribution & Versioning (G1, G2, G8)
-- ============================================================================
-- G1: Add nullable prompt FK to content_items & content_versions (on delete SET NULL)
-- G2: Add prompt_version snapshot column to ai_conversations (default 1)
-- RLS Discipline: Re-assert RLS state on all modified tables in the same pass.
-- ============================================================================

-- 1. Content Items (G1)
ALTER TABLE "content_items"
  ADD COLUMN IF NOT EXISTS "generated_by_prompt_id" uuid REFERENCES "prompts"("id") ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS "idx_content_items_generated_by_prompt_id"
  ON "content_items" ("generated_by_prompt_id");

-- 2. Content Versions (G1)
ALTER TABLE "content_versions"
  ADD COLUMN IF NOT EXISTS "generated_by_prompt_id" uuid REFERENCES "prompts"("id") ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS "idx_content_versions_generated_by_prompt_id"
  ON "content_versions" ("generated_by_prompt_id");

-- 3. AI Conversations (G2)
ALTER TABLE "ai_conversations"
  ADD COLUMN IF NOT EXISTS "prompt_version" integer NOT NULL DEFAULT 1;

-- 4. RLS Policy Coverage Verification
-- Re-assert RLS is enabled for all touched tables
ALTER TABLE "content_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "content_versions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ai_conversations" ENABLE ROW LEVEL SECURITY;
