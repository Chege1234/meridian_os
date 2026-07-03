CREATE TYPE "public"."report_type" AS ENUM('campaign_performance', 'content_performance', 'crm_activity', 'ai_usage_cost');--> statement-breakpoint
CREATE TABLE "dashboards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"owner_id" uuid NOT NULL,
	"layout" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"is_shared" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid
);
--> statement-breakpoint
CREATE TABLE "saved_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"report_type" "report_type" NOT NULL,
	"filters" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"owner_id" uuid NOT NULL,
	"is_shared" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "dashboards" ADD CONSTRAINT "dashboards_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboards" ADD CONSTRAINT "dashboards_deleted_by_users_id_fk" FOREIGN KEY ("deleted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_reports" ADD CONSTRAINT "saved_reports_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_dashboards_owner_id" ON "dashboards" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "idx_saved_reports_owner_id" ON "saved_reports" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "idx_saved_reports_report_type" ON "saved_reports" USING btree ("report_type");--> statement-breakpoint

-- Enable Row Level Security
ALTER TABLE "dashboards" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "saved_reports" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint

-- Dashboards Policies
CREATE POLICY "Dashboards are readable by owner or if shared" ON "dashboards"
  FOR SELECT TO authenticated USING (deleted_at IS NULL AND (owner_id = auth.uid() OR is_shared = true));--> statement-breakpoint

CREATE POLICY "Dashboards are manageable by owner" ON "dashboards"
  FOR ALL TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());--> statement-breakpoint

-- Saved Reports Policies
CREATE POLICY "Saved reports are readable by owner or if shared" ON "saved_reports"
  FOR SELECT TO authenticated USING (owner_id = auth.uid() OR is_shared = true);--> statement-breakpoint

CREATE POLICY "Saved reports are manageable by owner" ON "saved_reports"
  FOR ALL TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());