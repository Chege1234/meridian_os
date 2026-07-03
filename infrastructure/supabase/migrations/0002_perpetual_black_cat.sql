CREATE TABLE "ai_conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"provider" varchar(50) NOT NULL,
	"model" varchar(100) NOT NULL,
	"prompt_id" uuid,
	"input" text NOT NULL,
	"response" text NOT NULL,
	"token_usage" jsonb,
	"estimated_cost" numeric(10, 6),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" uuid,
	"platform" varchar(50) NOT NULL,
	"type" varchar(50) NOT NULL,
	"caption" text,
	"body" text,
	"status" varchar(50) DEFAULT 'draft' NOT NULL,
	"publish_date" timestamp with time zone,
	"author_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid
);
--> statement-breakpoint
CREATE TABLE "content_media" (
	"content_item_id" uuid NOT NULL,
	"media_id" uuid NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "content_media_content_item_id_media_id_pk" PRIMARY KEY("content_item_id","media_id")
);
--> statement-breakpoint
CREATE TABLE "content_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"content_item_id" uuid NOT NULL,
	"body" text,
	"caption" text,
	"author_id" uuid NOT NULL,
	"summary" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "media_assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"filename" varchar(255) NOT NULL,
	"storage_path" varchar(512) NOT NULL,
	"mime_type" varchar(100) NOT NULL,
	"size" integer NOT NULL,
	"uploaded_by" uuid NOT NULL,
	"checksum" varchar(64) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prompt_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"prompt_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"prompt" text NOT NULL,
	"variables" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"author_id" uuid NOT NULL,
	"summary" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prompts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"prompt" text NOT NULL,
	"variables" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"provider" varchar(50) NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"status" varchar(50) DEFAULT 'draft' NOT NULL,
	"usage_count" integer DEFAULT 0 NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid
);
--> statement-breakpoint
ALTER TABLE "ai_conversations" ADD CONSTRAINT "ai_conversations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_conversations" ADD CONSTRAINT "ai_conversations_prompt_id_prompts_id_fk" FOREIGN KEY ("prompt_id") REFERENCES "public"."prompts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_items" ADD CONSTRAINT "content_items_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_items" ADD CONSTRAINT "content_items_deleted_by_users_id_fk" FOREIGN KEY ("deleted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_media" ADD CONSTRAINT "content_media_content_item_id_content_items_id_fk" FOREIGN KEY ("content_item_id") REFERENCES "public"."content_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_media" ADD CONSTRAINT "content_media_media_id_media_assets_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media_assets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_versions" ADD CONSTRAINT "content_versions_content_item_id_content_items_id_fk" FOREIGN KEY ("content_item_id") REFERENCES "public"."content_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_versions" ADD CONSTRAINT "content_versions_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prompt_versions" ADD CONSTRAINT "prompt_versions_prompt_id_prompts_id_fk" FOREIGN KEY ("prompt_id") REFERENCES "public"."prompts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prompt_versions" ADD CONSTRAINT "prompt_versions_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prompts" ADD CONSTRAINT "prompts_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prompts" ADD CONSTRAINT "prompts_deleted_by_users_id_fk" FOREIGN KEY ("deleted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_ai_conversations_user_id" ON "ai_conversations" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_ai_conversations_provider" ON "ai_conversations" USING btree ("provider");--> statement-breakpoint
CREATE INDEX "idx_ai_conversations_created_at" ON "ai_conversations" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_content_items_status" ON "content_items" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_content_items_campaign_id" ON "content_items" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "idx_content_items_author_id" ON "content_items" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "idx_content_items_created_at" ON "content_items" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_content_versions_item_id" ON "content_versions" USING btree ("content_item_id");--> statement-breakpoint
CREATE INDEX "idx_content_versions_created_at" ON "content_versions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_media_assets_checksum" ON "media_assets" USING btree ("checksum");--> statement-breakpoint
CREATE INDEX "idx_media_assets_created_at" ON "media_assets" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_prompt_versions_prompt_id" ON "prompt_versions" USING btree ("prompt_id");--> statement-breakpoint
CREATE INDEX "idx_prompt_versions_created_at" ON "prompt_versions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_prompts_status" ON "prompts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_prompts_provider" ON "prompts" USING btree ("provider");--> statement-breakpoint
CREATE INDEX "idx_prompts_created_at" ON "prompts" USING btree ("created_at");

-- Enable Row Level Security
ALTER TABLE "prompts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "prompt_versions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "content_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "content_versions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "media_assets" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "content_media" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ai_conversations" ENABLE ROW LEVEL SECURITY;

-- Prompts Policies
CREATE POLICY "Prompts are readable by authenticated users" ON "prompts"
  FOR SELECT TO authenticated USING (deleted_at IS NULL OR public.is_admin_or_owner(auth.uid()));

CREATE POLICY "Authenticated users can create prompts" ON "prompts"
  FOR INSERT TO authenticated WITH CHECK (public.can_write(auth.uid()));

CREATE POLICY "Authenticated users can update prompts" ON "prompts"
  FOR UPDATE TO authenticated USING (public.can_write(auth.uid())) WITH CHECK (public.can_write(auth.uid()));

-- Prompt Versions Policies
CREATE POLICY "Prompt versions are readable by authenticated users" ON "prompt_versions"
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert prompt versions" ON "prompt_versions"
  FOR INSERT TO authenticated WITH CHECK (public.can_write(auth.uid()));

-- Content Items Policies
CREATE POLICY "Content items are readable by authenticated users" ON "content_items"
  FOR SELECT TO authenticated USING (deleted_at IS NULL OR public.is_admin_or_owner(auth.uid()));

CREATE POLICY "Authenticated users can create content items" ON "content_items"
  FOR INSERT TO authenticated WITH CHECK (public.can_write(auth.uid()));

CREATE POLICY "Authenticated users can update content items" ON "content_items"
  FOR UPDATE TO authenticated USING (public.can_write(auth.uid())) WITH CHECK (public.can_write(auth.uid()));

-- Content Versions Policies
CREATE POLICY "Content versions are readable by authenticated users" ON "content_versions"
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert content versions" ON "content_versions"
  FOR INSERT TO authenticated WITH CHECK (public.can_write(auth.uid()));

-- Media Assets Policies
CREATE POLICY "Media assets are readable by authenticated users" ON "media_assets"
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can upload media assets" ON "media_assets"
  FOR INSERT TO authenticated WITH CHECK (public.can_write(auth.uid()));

-- Content Media Policies
CREATE POLICY "Content media relations are readable by authenticated users" ON "content_media"
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage content media relations" ON "content_media"
  FOR ALL TO authenticated USING (public.can_write(auth.uid())) WITH CHECK (public.can_write(auth.uid()));

-- AI Conversations Policies
CREATE POLICY "Users can view their own AI conversations" ON "ai_conversations"
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin_or_owner(auth.uid()));

CREATE POLICY "Authenticated users can log AI conversations" ON "ai_conversations"
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- Increment usage counter helper function
CREATE OR REPLACE FUNCTION public.increment_prompt_usage(prompt_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.prompts
  SET usage_count = usage_count + 1
  WHERE id = prompt_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;