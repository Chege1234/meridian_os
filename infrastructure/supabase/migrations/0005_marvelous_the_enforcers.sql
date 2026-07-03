CREATE TYPE "public"."brand_asset_type" AS ENUM('logo', 'color_palette', 'font', 'template', 'guideline_doc');--> statement-breakpoint
CREATE TYPE "public"."kb_article_status" AS ENUM('draft', 'review', 'published', 'archived');--> statement-breakpoint
CREATE TYPE "public"."media_asset_status" AS ENUM('active', 'archived');--> statement-breakpoint
CREATE TYPE "public"."sop_status" AS ENUM('draft', 'review', 'published', 'archived');--> statement-breakpoint
CREATE TABLE "brand_assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "brand_asset_type" NOT NULL,
	"name" varchar(255) NOT NULL,
	"media_id" uuid,
	"value" jsonb DEFAULT '{}'::jsonb,
	"description" text,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid
);
--> statement-breakpoint
CREATE TABLE "brand_guidelines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"content" text NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"is_active" boolean DEFAULT false NOT NULL,
	"author_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kb_article_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"article_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"content" text NOT NULL,
	"summary" varchar(255),
	"author_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kb_articles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"status" "kb_article_status" DEFAULT 'draft' NOT NULL,
	"author_id" uuid NOT NULL,
	"current_version_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid,
	CONSTRAINT "kb_articles_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "kb_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"parent_category_id" uuid,
	"position" integer DEFAULT 0 NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid
);
--> statement-breakpoint
CREATE TABLE "media_folders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"parent_folder_id" uuid,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid
);
--> statement-breakpoint
CREATE TABLE "sop_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sop_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"steps" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"summary" varchar(255),
	"author_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sops" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"category_id" uuid,
	"status" "sop_status" DEFAULT 'draft' NOT NULL,
	"owner_id" uuid NOT NULL,
	"current_version_id" uuid,
	"review_due_date" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid
);
--> statement-breakpoint
ALTER TABLE "media_assets" ALTER COLUMN "size" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "media_assets" ADD COLUMN "alt_text" text;--> statement-breakpoint
ALTER TABLE "media_assets" ADD COLUMN "tags" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "media_assets" ADD COLUMN "folder_id" uuid;--> statement-breakpoint
ALTER TABLE "media_assets" ADD COLUMN "width" integer;--> statement-breakpoint
ALTER TABLE "media_assets" ADD COLUMN "height" integer;--> statement-breakpoint
ALTER TABLE "media_assets" ADD COLUMN "duration" integer;--> statement-breakpoint
ALTER TABLE "media_assets" ADD COLUMN "status" "media_asset_status" DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE "media_assets" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "media_assets" ADD COLUMN "deleted_by" uuid;--> statement-breakpoint
ALTER TABLE "brand_assets" ADD CONSTRAINT "brand_assets_media_id_media_assets_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media_assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brand_assets" ADD CONSTRAINT "brand_assets_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brand_assets" ADD CONSTRAINT "brand_assets_deleted_by_users_id_fk" FOREIGN KEY ("deleted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brand_guidelines" ADD CONSTRAINT "brand_guidelines_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kb_article_versions" ADD CONSTRAINT "kb_article_versions_article_id_kb_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."kb_articles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kb_article_versions" ADD CONSTRAINT "kb_article_versions_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kb_articles" ADD CONSTRAINT "kb_articles_category_id_kb_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."kb_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kb_articles" ADD CONSTRAINT "kb_articles_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kb_articles" ADD CONSTRAINT "kb_articles_current_version_id_kb_article_versions_id_fk" FOREIGN KEY ("current_version_id") REFERENCES "public"."kb_article_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kb_articles" ADD CONSTRAINT "kb_articles_deleted_by_users_id_fk" FOREIGN KEY ("deleted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kb_categories" ADD CONSTRAINT "kb_categories_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kb_categories" ADD CONSTRAINT "kb_categories_deleted_by_users_id_fk" FOREIGN KEY ("deleted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_folders" ADD CONSTRAINT "media_folders_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_folders" ADD CONSTRAINT "media_folders_deleted_by_users_id_fk" FOREIGN KEY ("deleted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sop_versions" ADD CONSTRAINT "sop_versions_sop_id_sops_id_fk" FOREIGN KEY ("sop_id") REFERENCES "public"."sops"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sop_versions" ADD CONSTRAINT "sop_versions_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sops" ADD CONSTRAINT "sops_category_id_kb_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."kb_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sops" ADD CONSTRAINT "sops_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sops" ADD CONSTRAINT "sops_current_version_id_sop_versions_id_fk" FOREIGN KEY ("current_version_id") REFERENCES "public"."sop_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sops" ADD CONSTRAINT "sops_deleted_by_users_id_fk" FOREIGN KEY ("deleted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_brand_assets_type" ON "brand_assets" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_brand_assets_media_id" ON "brand_assets" USING btree ("media_id");--> statement-breakpoint
CREATE INDEX "idx_brand_assets_created_by" ON "brand_assets" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "idx_brand_guidelines_is_active" ON "brand_guidelines" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_brand_guidelines_version" ON "brand_guidelines" USING btree ("version");--> statement-breakpoint
CREATE INDEX "idx_brand_guidelines_author_id" ON "brand_guidelines" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "idx_brand_guidelines_created_at" ON "brand_guidelines" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_kb_article_versions_article_id" ON "kb_article_versions" USING btree ("article_id");--> statement-breakpoint
CREATE INDEX "idx_kb_article_versions_created_at" ON "kb_article_versions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_kb_articles_category_id" ON "kb_articles" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "idx_kb_articles_status" ON "kb_articles" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_kb_articles_author_id" ON "kb_articles" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "idx_kb_articles_created_at" ON "kb_articles" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_kb_categories_parent_category_id" ON "kb_categories" USING btree ("parent_category_id");--> statement-breakpoint
CREATE INDEX "idx_kb_categories_created_by" ON "kb_categories" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "idx_kb_categories_created_at" ON "kb_categories" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_media_folders_parent_folder_id" ON "media_folders" USING btree ("parent_folder_id");--> statement-breakpoint
CREATE INDEX "idx_media_folders_created_by" ON "media_folders" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "idx_media_folders_created_at" ON "media_folders" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_sop_versions_sop_id" ON "sop_versions" USING btree ("sop_id");--> statement-breakpoint
CREATE INDEX "idx_sop_versions_created_at" ON "sop_versions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_sops_category_id" ON "sops" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "idx_sops_status" ON "sops" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_sops_owner_id" ON "sops" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "idx_sops_review_due_date" ON "sops" USING btree ("review_due_date");--> statement-breakpoint
CREATE INDEX "idx_sops_created_at" ON "sops" USING btree ("created_at");--> statement-breakpoint
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_folder_id_media_folders_id_fk" FOREIGN KEY ("folder_id") REFERENCES "public"."media_folders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_deleted_by_users_id_fk" FOREIGN KEY ("deleted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_media_assets_folder_id" ON "media_assets" USING btree ("folder_id");--> statement-breakpoint
CREATE INDEX "idx_media_assets_status" ON "media_assets" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_media_assets_uploaded_by" ON "media_assets" USING btree ("uploaded_by");--> statement-breakpoint

-- Enable Row Level Security
ALTER TABLE "kb_categories" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "kb_articles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "kb_article_versions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "sops" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "sop_versions" ENABLE ROW LEVEL SECURITY;

-- KB Categories Policies
CREATE POLICY "KB categories are readable by authenticated users" ON "kb_categories"
  FOR SELECT TO authenticated USING (deleted_at IS NULL);

CREATE POLICY "Authenticated users can create KB categories" ON "kb_categories"
  FOR INSERT TO authenticated WITH CHECK (public.can_write(auth.uid()));

CREATE POLICY "Authenticated users can update KB categories" ON "kb_categories"
  FOR UPDATE TO authenticated USING (public.can_write(auth.uid())) WITH CHECK (public.can_write(auth.uid()));

-- KB Articles Policies
CREATE POLICY "KB articles are readable based on status and role" ON "kb_articles"
  FOR SELECT TO authenticated USING (
    deleted_at IS NULL AND (
      status = 'published' OR 
      author_id = auth.uid() OR 
      public.is_admin_or_owner(auth.uid())
    )
  );

CREATE POLICY "Authenticated users can create KB articles" ON "kb_articles"
  FOR INSERT TO authenticated WITH CHECK (public.can_write(auth.uid()));

CREATE POLICY "Authenticated users can update KB articles" ON "kb_articles"
  FOR UPDATE TO authenticated USING (public.can_write(auth.uid())) WITH CHECK (public.can_write(auth.uid()));

-- KB Article Versions Policies
CREATE POLICY "KB article versions are readable by authenticated users" ON "kb_article_versions"
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert KB article versions" ON "kb_article_versions"
  FOR INSERT TO authenticated WITH CHECK (public.can_write(auth.uid()));

-- SOPs Policies
CREATE POLICY "SOPs are readable based on status and role" ON "sops"
  FOR SELECT TO authenticated USING (
    deleted_at IS NULL AND (
      status = 'published' OR 
      owner_id = auth.uid() OR 
      public.is_admin_or_owner(auth.uid())
    )
  );

CREATE POLICY "Authenticated users can create SOPs" ON "sops"
  FOR INSERT TO authenticated WITH CHECK (public.can_write(auth.uid()));

CREATE POLICY "Authenticated users can update SOPs" ON "sops"
  FOR UPDATE TO authenticated USING (public.can_write(auth.uid())) WITH CHECK (public.can_write(auth.uid()));

-- SOP Versions Policies
CREATE POLICY "SOP versions are readable by authenticated users" ON "sop_versions"
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert SOP versions" ON "sop_versions"
  FOR INSERT TO authenticated WITH CHECK (public.can_write(auth.uid()));