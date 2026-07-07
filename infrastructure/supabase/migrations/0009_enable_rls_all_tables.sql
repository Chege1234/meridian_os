-- ============================================================================
-- Migration: Enable Row Level Security on ALL 34 unprotected public tables
-- ============================================================================
-- Root cause: Migration 0006 appended RLS statements after Drizzle's generated
-- SQL, but the migration had already been marked as applied in the journal,
-- so those statements never executed. Migrations 0007/0008 were applied
-- manually and only covered provider_credentials.
--
-- This migration enables RLS and creates policies for every remaining table.
-- Policy design follows docs/09_SECURITY_SPECIFICATION.md:
--   - Least Privilege / Deny by Default
--   - Roles: owner, admin, editor, viewer
--   - Helper functions: can_write(uuid), is_admin_or_owner(uuid)
--
-- IMPORTANT: The Drizzle db client connects via DATABASE_URL (postgres role)
-- which bypasses RLS. RLS applies only to Supabase client connections using
-- the anon/authenticated key — this is the attack surface we are protecting.
-- ============================================================================

-- ============================================================================
-- CATEGORY 1: Admin-only configuration tables
-- Read: all authenticated | Write: admin/owner only
-- ============================================================================

-- roles
ALTER TABLE "roles" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "roles_select" ON "roles"
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "roles_manage" ON "roles"
  FOR ALL TO authenticated
  USING (public.is_admin_or_owner(auth.uid()))
  WITH CHECK (public.is_admin_or_owner(auth.uid()));

-- permissions
ALTER TABLE "permissions" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "permissions_select" ON "permissions"
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "permissions_manage" ON "permissions"
  FOR ALL TO authenticated
  USING (public.is_admin_or_owner(auth.uid()))
  WITH CHECK (public.is_admin_or_owner(auth.uid()));

-- role_permissions
ALTER TABLE "role_permissions" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "role_permissions_select" ON "role_permissions"
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "role_permissions_manage" ON "role_permissions"
  FOR ALL TO authenticated
  USING (public.is_admin_or_owner(auth.uid()))
  WITH CHECK (public.is_admin_or_owner(auth.uid()));

-- settings
ALTER TABLE "settings" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settings_select" ON "settings"
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "settings_manage" ON "settings"
  FOR ALL TO authenticated
  USING (public.is_admin_or_owner(auth.uid()))
  WITH CHECK (public.is_admin_or_owner(auth.uid()));

-- ============================================================================
-- CATEGORY 2: User profiles
-- Read: all authenticated (non-deleted) | Write: admin/owner only
-- ============================================================================

ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_select" ON "users"
  FOR SELECT TO authenticated USING (deleted_at IS NULL);
CREATE POLICY "users_manage" ON "users"
  FOR ALL TO authenticated
  USING (public.is_admin_or_owner(auth.uid()))
  WITH CHECK (public.is_admin_or_owner(auth.uid()));

-- ============================================================================
-- CATEGORY 3: Business data tables WITH soft-delete (deleted_at)
-- Read: authenticated (non-deleted) | Write: can_write (active non-viewer)
-- ============================================================================

-- contacts
ALTER TABLE "contacts" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "contacts_select" ON "contacts"
  FOR SELECT TO authenticated USING (deleted_at IS NULL);
CREATE POLICY "contacts_write" ON "contacts"
  FOR ALL TO authenticated
  USING (public.can_write(auth.uid()))
  WITH CHECK (public.can_write(auth.uid()));

-- content_items
ALTER TABLE "content_items" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "content_items_select" ON "content_items"
  FOR SELECT TO authenticated USING (deleted_at IS NULL);
CREATE POLICY "content_items_write" ON "content_items"
  FOR ALL TO authenticated
  USING (public.can_write(auth.uid()))
  WITH CHECK (public.can_write(auth.uid()));

-- campaigns
ALTER TABLE "campaigns" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "campaigns_select" ON "campaigns"
  FOR SELECT TO authenticated USING (deleted_at IS NULL);
CREATE POLICY "campaigns_write" ON "campaigns"
  FOR ALL TO authenticated
  USING (public.can_write(auth.uid()))
  WITH CHECK (public.can_write(auth.uid()));

-- tasks
ALTER TABLE "tasks" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tasks_select" ON "tasks"
  FOR SELECT TO authenticated USING (deleted_at IS NULL);
CREATE POLICY "tasks_write" ON "tasks"
  FOR ALL TO authenticated
  USING (public.can_write(auth.uid()))
  WITH CHECK (public.can_write(auth.uid()));

-- brand_assets
ALTER TABLE "brand_assets" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "brand_assets_select" ON "brand_assets"
  FOR SELECT TO authenticated USING (deleted_at IS NULL);
CREATE POLICY "brand_assets_write" ON "brand_assets"
  FOR ALL TO authenticated
  USING (public.can_write(auth.uid()))
  WITH CHECK (public.can_write(auth.uid()));

-- media_assets
ALTER TABLE "media_assets" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "media_assets_select" ON "media_assets"
  FOR SELECT TO authenticated USING (deleted_at IS NULL);
CREATE POLICY "media_assets_write" ON "media_assets"
  FOR ALL TO authenticated
  USING (public.can_write(auth.uid()))
  WITH CHECK (public.can_write(auth.uid()));

-- media_folders
ALTER TABLE "media_folders" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "media_folders_select" ON "media_folders"
  FOR SELECT TO authenticated USING (deleted_at IS NULL);
CREATE POLICY "media_folders_write" ON "media_folders"
  FOR ALL TO authenticated
  USING (public.can_write(auth.uid()))
  WITH CHECK (public.can_write(auth.uid()));

-- prompts
ALTER TABLE "prompts" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "prompts_select" ON "prompts"
  FOR SELECT TO authenticated USING (deleted_at IS NULL);
CREATE POLICY "prompts_write" ON "prompts"
  FOR ALL TO authenticated
  USING (public.can_write(auth.uid()))
  WITH CHECK (public.can_write(auth.uid()));

-- dashboards
ALTER TABLE "dashboards" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dashboards_select" ON "dashboards"
  FOR SELECT TO authenticated USING (deleted_at IS NULL);
CREATE POLICY "dashboards_write" ON "dashboards"
  FOR ALL TO authenticated
  USING (public.can_write(auth.uid()))
  WITH CHECK (public.can_write(auth.uid()));

-- kb_articles
ALTER TABLE "kb_articles" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "kb_articles_select" ON "kb_articles"
  FOR SELECT TO authenticated USING (deleted_at IS NULL);
CREATE POLICY "kb_articles_write" ON "kb_articles"
  FOR ALL TO authenticated
  USING (public.can_write(auth.uid()))
  WITH CHECK (public.can_write(auth.uid()));

-- kb_categories
ALTER TABLE "kb_categories" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "kb_categories_select" ON "kb_categories"
  FOR SELECT TO authenticated USING (deleted_at IS NULL);
CREATE POLICY "kb_categories_write" ON "kb_categories"
  FOR ALL TO authenticated
  USING (public.can_write(auth.uid()))
  WITH CHECK (public.can_write(auth.uid()));

-- sops
ALTER TABLE "sops" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sops_select" ON "sops"
  FOR SELECT TO authenticated USING (deleted_at IS NULL);
CREATE POLICY "sops_write" ON "sops"
  FOR ALL TO authenticated
  USING (public.can_write(auth.uid()))
  WITH CHECK (public.can_write(auth.uid()));

-- ============================================================================
-- CATEGORY 4: Business data tables WITHOUT soft-delete
-- Read: all authenticated | Write: can_write
-- ============================================================================

-- contact_interactions
ALTER TABLE "contact_interactions" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "contact_interactions_select" ON "contact_interactions"
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "contact_interactions_write" ON "contact_interactions"
  FOR ALL TO authenticated
  USING (public.can_write(auth.uid()))
  WITH CHECK (public.can_write(auth.uid()));

-- content_media
ALTER TABLE "content_media" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "content_media_select" ON "content_media"
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "content_media_write" ON "content_media"
  FOR ALL TO authenticated
  USING (public.can_write(auth.uid()))
  WITH CHECK (public.can_write(auth.uid()));

-- content_versions
ALTER TABLE "content_versions" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "content_versions_select" ON "content_versions"
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "content_versions_write" ON "content_versions"
  FOR ALL TO authenticated
  USING (public.can_write(auth.uid()))
  WITH CHECK (public.can_write(auth.uid()));

-- campaign_contacts
ALTER TABLE "campaign_contacts" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "campaign_contacts_select" ON "campaign_contacts"
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "campaign_contacts_write" ON "campaign_contacts"
  FOR ALL TO authenticated
  USING (public.can_write(auth.uid()))
  WITH CHECK (public.can_write(auth.uid()));

-- campaign_content
ALTER TABLE "campaign_content" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "campaign_content_select" ON "campaign_content"
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "campaign_content_write" ON "campaign_content"
  FOR ALL TO authenticated
  USING (public.can_write(auth.uid()))
  WITH CHECK (public.can_write(auth.uid()));

-- campaign_metrics
ALTER TABLE "campaign_metrics" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "campaign_metrics_select" ON "campaign_metrics"
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "campaign_metrics_write" ON "campaign_metrics"
  FOR ALL TO authenticated
  USING (public.can_write(auth.uid()))
  WITH CHECK (public.can_write(auth.uid()));

-- brand_guidelines
ALTER TABLE "brand_guidelines" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "brand_guidelines_select" ON "brand_guidelines"
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "brand_guidelines_write" ON "brand_guidelines"
  FOR ALL TO authenticated
  USING (public.can_write(auth.uid()))
  WITH CHECK (public.can_write(auth.uid()));

-- prompt_versions
ALTER TABLE "prompt_versions" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "prompt_versions_select" ON "prompt_versions"
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "prompt_versions_write" ON "prompt_versions"
  FOR ALL TO authenticated
  USING (public.can_write(auth.uid()))
  WITH CHECK (public.can_write(auth.uid()));

-- kb_article_versions
ALTER TABLE "kb_article_versions" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "kb_article_versions_select" ON "kb_article_versions"
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "kb_article_versions_write" ON "kb_article_versions"
  FOR ALL TO authenticated
  USING (public.can_write(auth.uid()))
  WITH CHECK (public.can_write(auth.uid()));

-- sop_versions
ALTER TABLE "sop_versions" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sop_versions_select" ON "sop_versions"
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "sop_versions_write" ON "sop_versions"
  FOR ALL TO authenticated
  USING (public.can_write(auth.uid()))
  WITH CHECK (public.can_write(auth.uid()));

-- saved_reports
ALTER TABLE "saved_reports" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "saved_reports_select" ON "saved_reports"
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "saved_reports_write" ON "saved_reports"
  FOR ALL TO authenticated
  USING (public.can_write(auth.uid()))
  WITH CHECK (public.can_write(auth.uid()));

-- ============================================================================
-- CATEGORY 5: Audit / log tables (immutable per security spec)
-- Read: all authenticated | Insert: authenticated | No update/delete
-- ============================================================================

-- activity_logs
ALTER TABLE "activity_logs" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "activity_logs_select" ON "activity_logs"
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "activity_logs_insert" ON "activity_logs"
  FOR INSERT TO authenticated WITH CHECK (true);

-- ai_conversations
ALTER TABLE "ai_conversations" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_conversations_select" ON "ai_conversations"
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "ai_conversations_insert" ON "ai_conversations"
  FOR INSERT TO authenticated WITH CHECK (true);

-- ============================================================================
-- CATEGORY 6: Automation & Agent tables (matching intent from migration 0006)
-- ============================================================================

-- automations (soft-delete)
ALTER TABLE "automations" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "automations_select" ON "automations"
  FOR SELECT TO authenticated USING (deleted_at IS NULL);
CREATE POLICY "automations_write" ON "automations"
  FOR ALL TO authenticated
  USING (public.can_write(auth.uid()))
  WITH CHECK (public.can_write(auth.uid()));

-- automation_runs
ALTER TABLE "automation_runs" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "automation_runs_select" ON "automation_runs"
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "automation_runs_insert" ON "automation_runs"
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "automation_runs_update" ON "automation_runs"
  FOR UPDATE TO authenticated
  USING (public.is_admin_or_owner(auth.uid()))
  WITH CHECK (public.is_admin_or_owner(auth.uid()));

-- agents (soft-delete)
ALTER TABLE "agents" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "agents_select" ON "agents"
  FOR SELECT TO authenticated USING (deleted_at IS NULL);
CREATE POLICY "agents_write" ON "agents"
  FOR ALL TO authenticated
  USING (public.can_write(auth.uid()))
  WITH CHECK (public.can_write(auth.uid()));

-- agent_runs
ALTER TABLE "agent_runs" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "agent_runs_select" ON "agent_runs"
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "agent_runs_insert" ON "agent_runs"
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "agent_runs_update" ON "agent_runs"
  FOR UPDATE TO authenticated
  USING (public.is_admin_or_owner(auth.uid()))
  WITH CHECK (public.is_admin_or_owner(auth.uid()));
