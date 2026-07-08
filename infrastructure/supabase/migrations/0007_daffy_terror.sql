ALTER TABLE "contacts" ALTER COLUMN "created_by" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "contacts" ADD COLUMN "source" varchar(50) DEFAULT 'manual' NOT NULL;--> statement-breakpoint
ALTER TABLE "contacts" ADD COLUMN "external_id" varchar(255);--> statement-breakpoint
ALTER TABLE "contacts" ADD COLUMN "synced_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "contacts" ADD COLUMN "metadata" jsonb;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_contacts_source_external_id" ON "contacts" USING btree ("source","external_id") WHERE external_id IS NOT NULL;--> statement-breakpoint
INSERT INTO "settings" ("key", "value", "type", "description", "editable")
VALUES ('campus_marketplace_last_sync', '1970-01-01T00:00:00Z', 'string', 'Last sync timestamp for Campus Marketplace contacts', true)
ON CONFLICT ("key") DO NOTHING;