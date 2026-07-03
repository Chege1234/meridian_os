CREATE TYPE "public"."campaign_contact_role" AS ENUM('target', 'participant', 'referrer');--> statement-breakpoint
CREATE TYPE "public"."campaign_metric_name" AS ENUM('reach', 'clicks', 'conversions', 'signups', 'revenue');--> statement-breakpoint
CREATE TYPE "public"."campaign_metric_source" AS ENUM('manual', 'integration');--> statement-breakpoint
CREATE TYPE "public"."campaign_status" AS ENUM('draft', 'active', 'paused', 'completed', 'archived');--> statement-breakpoint
CREATE TABLE "campaign_contacts" (
	"campaign_id" uuid NOT NULL,
	"contact_id" uuid NOT NULL,
	"role" "campaign_contact_role" DEFAULT 'target' NOT NULL,
	"added_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "campaign_contacts_campaign_id_contact_id_pk" PRIMARY KEY("campaign_id","contact_id")
);
--> statement-breakpoint
CREATE TABLE "campaign_content" (
	"campaign_id" uuid NOT NULL,
	"content_item_id" uuid NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"added_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "campaign_content_campaign_id_content_item_id_pk" PRIMARY KEY("campaign_id","content_item_id")
);
--> statement-breakpoint
CREATE TABLE "campaign_metrics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" uuid NOT NULL,
	"metric_name" "campaign_metric_name" NOT NULL,
	"value" numeric(15, 2) NOT NULL,
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL,
	"source" "campaign_metric_source" DEFAULT 'manual' NOT NULL,
	"created_by" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "campaigns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"objective" text NOT NULL,
	"status" "campaign_status" DEFAULT 'draft' NOT NULL,
	"channel" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"start_date" timestamp with time zone NOT NULL,
	"end_date" timestamp with time zone,
	"budget" numeric(12, 2),
	"owner_id" uuid NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid
);
--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "campaign_id" uuid;--> statement-breakpoint
ALTER TABLE "campaign_contacts" ADD CONSTRAINT "campaign_contacts_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_contacts" ADD CONSTRAINT "campaign_contacts_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_content" ADD CONSTRAINT "campaign_content_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_content" ADD CONSTRAINT "campaign_content_content_item_id_content_items_id_fk" FOREIGN KEY ("content_item_id") REFERENCES "public"."content_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_metrics" ADD CONSTRAINT "campaign_metrics_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_metrics" ADD CONSTRAINT "campaign_metrics_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_deleted_by_users_id_fk" FOREIGN KEY ("deleted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_campaign_contacts_campaign_id" ON "campaign_contacts" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "idx_campaign_content_campaign_id" ON "campaign_content" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "idx_campaign_metrics_campaign_id" ON "campaign_metrics" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "idx_campaign_metrics_recorded_at" ON "campaign_metrics" USING btree ("recorded_at");--> statement-breakpoint
CREATE INDEX "idx_campaigns_status" ON "campaigns" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_campaigns_owner_id" ON "campaigns" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "idx_campaigns_start_date" ON "campaigns" USING btree ("start_date");--> statement-breakpoint
CREATE INDEX "idx_campaigns_end_date" ON "campaigns" USING btree ("end_date");--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_tasks_campaign_id" ON "tasks" USING btree ("campaign_id");

-- Enable Row Level Security
ALTER TABLE "campaigns" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "campaign_content" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "campaign_contacts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "campaign_metrics" ENABLE ROW LEVEL SECURITY;

-- Campaigns Policies
CREATE POLICY "Campaigns are readable by authenticated users" ON "campaigns"
  FOR SELECT TO authenticated USING (deleted_at IS NULL OR public.is_admin_or_owner(auth.uid()));

CREATE POLICY "Authenticated users can create campaigns" ON "campaigns"
  FOR INSERT TO authenticated WITH CHECK (public.can_write(auth.uid()));

CREATE POLICY "Authenticated users can update campaigns" ON "campaigns"
  FOR UPDATE TO authenticated USING (public.can_write(auth.uid())) WITH CHECK (public.can_write(auth.uid()));

-- Campaign Content Policies
CREATE POLICY "Campaign content relations are readable by authenticated users" ON "campaign_content"
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage campaign content relations" ON "campaign_content"
  FOR ALL TO authenticated USING (public.can_write(auth.uid())) WITH CHECK (public.can_write(auth.uid()));

-- Campaign Contacts Policies
CREATE POLICY "Campaign contact relations are readable by authenticated users" ON "campaign_contacts"
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage campaign contact relations" ON "campaign_contacts"
  FOR ALL TO authenticated USING (public.can_write(auth.uid())) WITH CHECK (public.can_write(auth.uid()));

-- Campaign Metrics Policies
CREATE POLICY "Campaign metrics are readable by authenticated users" ON "campaign_metrics"
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can record campaign metrics" ON "campaign_metrics"
  FOR INSERT TO authenticated WITH CHECK (public.can_write(auth.uid()));

-- Data Migration: Migrate content_items.campaign_id to campaign_content join table
INSERT INTO "campaign_content" ("campaign_id", "content_item_id", "position", "added_at")
SELECT "campaign_id", "id", 0, now()
FROM "content_items"
WHERE "campaign_id" IS NOT NULL;