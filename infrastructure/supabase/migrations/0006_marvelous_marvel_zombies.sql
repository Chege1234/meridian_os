CREATE TYPE "public"."agent_run_status" AS ENUM('running', 'pending_approval', 'approved', 'rejected', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."agent_run_trigger" AS ENUM('schedule', 'manual', 'event');--> statement-breakpoint
CREATE TYPE "public"."agent_status" AS ENUM('active', 'paused');--> statement-breakpoint
CREATE TYPE "public"."automation_action_type" AS ENUM('create_task', 'send_notification', 'update_status', 'generate_content_draft', 'run_report');--> statement-breakpoint
CREATE TYPE "public"."automation_run_status" AS ENUM('pending_approval', 'approved', 'rejected', 'executed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."automation_status" AS ENUM('active', 'paused');--> statement-breakpoint
CREATE TYPE "public"."automation_trigger_type" AS ENUM('schedule', 'event');--> statement-breakpoint
CREATE TABLE "agent_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agent_id" uuid NOT NULL,
	"triggered_by" "agent_run_trigger" NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"status" "agent_run_status" DEFAULT 'running' NOT NULL,
	"reasoning_trace" text NOT NULL,
	"proposed_actions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"executed_actions" jsonb DEFAULT '[]'::jsonb,
	"token_usage" jsonb,
	"estimated_cost" numeric(10, 6)
);
--> statement-breakpoint
CREATE TABLE "agents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"goal" text NOT NULL,
	"allowed_actions" jsonb NOT NULL,
	"prompt_id" uuid NOT NULL,
	"status" "agent_status" DEFAULT 'active' NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid
);
--> statement-breakpoint
CREATE TABLE "automation_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"automation_id" uuid NOT NULL,
	"triggered_at" timestamp with time zone DEFAULT now() NOT NULL,
	"status" "automation_run_status" DEFAULT 'pending_approval' NOT NULL,
	"input_snapshot" jsonb NOT NULL,
	"output" jsonb,
	"error" text,
	"approved_by" uuid,
	"executed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "automations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"trigger_type" "automation_trigger_type" NOT NULL,
	"trigger_config" jsonb NOT NULL,
	"action_type" "automation_action_type" NOT NULL,
	"action_config" jsonb NOT NULL,
	"status" "automation_status" DEFAULT 'active' NOT NULL,
	"requires_approval" boolean DEFAULT true NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid
);
--> statement-breakpoint
ALTER TABLE "agent_runs" ADD CONSTRAINT "agent_runs_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agents" ADD CONSTRAINT "agents_prompt_id_prompts_id_fk" FOREIGN KEY ("prompt_id") REFERENCES "public"."prompts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agents" ADD CONSTRAINT "agents_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agents" ADD CONSTRAINT "agents_deleted_by_users_id_fk" FOREIGN KEY ("deleted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "automation_runs" ADD CONSTRAINT "automation_runs_automation_id_automations_id_fk" FOREIGN KEY ("automation_id") REFERENCES "public"."automations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "automation_runs" ADD CONSTRAINT "automation_runs_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "automations" ADD CONSTRAINT "automations_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "automations" ADD CONSTRAINT "automations_deleted_by_users_id_fk" FOREIGN KEY ("deleted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_agent_runs_status" ON "agent_runs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_agent_runs_agent_id" ON "agent_runs" USING btree ("agent_id");--> statement-breakpoint
CREATE INDEX "idx_agent_runs_started_at" ON "agent_runs" USING btree ("started_at");--> statement-breakpoint
CREATE INDEX "idx_agents_status" ON "agents" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_agents_created_at" ON "agents" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_automation_runs_status" ON "automation_runs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_automation_runs_automation_id" ON "automation_runs" USING btree ("automation_id");--> statement-breakpoint
CREATE INDEX "idx_automation_runs_triggered_at" ON "automation_runs" USING btree ("triggered_at");--> statement-breakpoint
CREATE INDEX "idx_automations_status" ON "automations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_automations_trigger_type" ON "automations" USING btree ("trigger_type");--> statement-breakpoint
CREATE INDEX "idx_automations_created_at" ON "automations" USING btree ("created_at");

-- Enable Row Level Security
ALTER TABLE "automations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "automation_runs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "agents" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "agent_runs" ENABLE ROW LEVEL SECURITY;

-- Automations Policies
CREATE POLICY "Automations are readable by authenticated users" ON "automations"
  FOR SELECT TO authenticated USING (deleted_at IS NULL);
CREATE POLICY "Automations are manageable by users with write access" ON "automations"
  FOR ALL TO authenticated USING (public.can_write(auth.uid())) WITH CHECK (public.can_write(auth.uid()));

-- Agents Policies
CREATE POLICY "Agents are readable by authenticated users" ON "agents"
  FOR SELECT TO authenticated USING (deleted_at IS NULL);
CREATE POLICY "Agents are manageable by users with write access" ON "agents"
  FOR ALL TO authenticated USING (public.can_write(auth.uid())) WITH CHECK (public.can_write(auth.uid()));

-- Automation Runs Policies
CREATE POLICY "Automation runs are readable by authenticated users" ON "automation_runs"
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Automation runs can be inserted by authenticated" ON "automation_runs"
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Automation runs can be updated by admin or owner" ON "automation_runs"
  FOR UPDATE TO authenticated USING (public.is_admin_or_owner(auth.uid())) WITH CHECK (public.is_admin_or_owner(auth.uid()));

-- Agent Runs Policies
CREATE POLICY "Agent runs are readable by authenticated users" ON "agent_runs"
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Agent runs can be inserted by authenticated" ON "agent_runs"
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Agent runs can be updated by admin or owner" ON "agent_runs"
  FOR UPDATE TO authenticated USING (public.is_admin_or_owner(auth.uid())) WITH CHECK (public.is_admin_or_owner(auth.uid()));