CREATE TYPE "public"."contact_interaction_type" AS ENUM('call', 'email', 'meeting', 'note');--> statement-breakpoint
CREATE TYPE "public"."task_priority" AS ENUM('low', 'medium', 'high');--> statement-breakpoint
CREATE TYPE "public"."task_status" AS ENUM('todo', 'in_progress', 'blocked', 'completed', 'archived');--> statement-breakpoint
CREATE TABLE "contact_interactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contact_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "contact_interaction_type" NOT NULL,
	"content" text NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"organization" varchar(255),
	"email" varchar(255),
	"phone" varchar(50),
	"status" varchar(50) DEFAULT 'active' NOT NULL,
	"notes" text,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"priority" "task_priority" DEFAULT 'medium' NOT NULL,
	"status" "task_status" DEFAULT 'todo' NOT NULL,
	"due_date" timestamp with time zone,
	"assigned_to" uuid,
	"created_by" uuid NOT NULL,
	"completed_at" timestamp with time zone,
	"contact_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid
);
--> statement-breakpoint
ALTER TABLE "contact_interactions" ADD CONSTRAINT "contact_interactions_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_interactions" ADD CONSTRAINT "contact_interactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_deleted_by_users_id_fk" FOREIGN KEY ("deleted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_deleted_by_users_id_fk" FOREIGN KEY ("deleted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_contact_interactions_contact_id" ON "contact_interactions" USING btree ("contact_id");--> statement-breakpoint
CREATE INDEX "idx_contacts_email" ON "contacts" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_contacts_status" ON "contacts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_contacts_created_at" ON "contacts" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_tasks_status" ON "tasks" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_tasks_created_at" ON "tasks" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_tasks_contact_id" ON "tasks" USING btree ("contact_id");--> statement-breakpoint
CREATE INDEX "idx_tasks_assigned_to" ON "tasks" USING btree ("assigned_to");

-- Enable Row Level Security
ALTER TABLE "contacts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "contact_interactions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tasks" ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user has write permissions (active and not viewer)
CREATE OR REPLACE FUNCTION public.can_write(user_id uuid)
RETURNS boolean AS $$
DECLARE
  role_name text;
  user_status text;
BEGIN
  SELECT r.name, u.status INTO role_name, user_status
  FROM public.users u
  JOIN public.roles r ON u.role_id = r.id
  WHERE u.id = user_id;
  RETURN user_status = 'active' AND role_name != 'viewer';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Contacts Policies
CREATE POLICY "Contacts are readable by authenticated users" ON "contacts"
  FOR SELECT TO authenticated USING (deleted_at IS NULL OR public.is_admin_or_owner(auth.uid()));

CREATE POLICY "Authenticated users can create contacts" ON "contacts"
  FOR INSERT TO authenticated WITH CHECK (public.can_write(auth.uid()));

CREATE POLICY "Authenticated users can update contacts" ON "contacts"
  FOR UPDATE TO authenticated USING (public.can_write(auth.uid())) WITH CHECK (public.can_write(auth.uid()));

-- Contact Interactions Policies (Immutable: INSERT/SELECT only, no UPDATE/DELETE)
CREATE POLICY "Interactions are readable by authenticated users" ON "contact_interactions"
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can log interactions" ON "contact_interactions"
  FOR INSERT TO authenticated WITH CHECK (public.can_write(auth.uid()));

-- Tasks Policies
CREATE POLICY "Tasks are readable by authenticated users" ON "tasks"
  FOR SELECT TO authenticated USING (deleted_at IS NULL OR public.is_admin_or_owner(auth.uid()));

CREATE POLICY "Authenticated users can create tasks" ON "tasks"
  FOR INSERT TO authenticated WITH CHECK (public.can_write(auth.uid()));

CREATE POLICY "Authenticated users can update tasks" ON "tasks"
  FOR UPDATE TO authenticated USING (public.can_write(auth.uid())) WITH CHECK (public.can_write(auth.uid()));