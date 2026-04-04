-- Migration: Clerk auth → built-in email/password auth
-- This migration removes Clerk-era auth identifiers and replaces them with
-- UUID references to the new users table. Legacy Clerk IDs (text) cannot be
-- converted to UUIDs, so dependent rows are cleared. Run seed after migration
-- to repopulate demo data.

-- Step 1: Create new tables
CREATE TYPE "public"."email_status" AS ENUM('pending', 'sent', 'failed');--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"display_name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);--> statement-breakpoint
CREATE TABLE "email_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"subject" text NOT NULL,
	"html_body" text NOT NULL,
	"text_body" text,
	"merge_fields" jsonb DEFAULT '[]'::jsonb,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE "email_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"application_id" uuid,
	"candidate_id" uuid,
	"template_id" uuid,
	"to_email" text NOT NULL,
	"subject" text NOT NULL,
	"html_body" text NOT NULL,
	"text_body" text,
	"status" "email_status" DEFAULT 'pending' NOT NULL,
	"sent_by" uuid,
	"error_message" text,
	"sent_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint

-- Step 2: Clear legacy Clerk-era data that references non-UUID auth identifiers.
-- These rows contain Clerk user IDs (text format like "user_xxx") that cannot
-- be converted to UUID. Data must be re-seeded after migration.
DELETE FROM "application_ratings";--> statement-breakpoint
DELETE FROM "applications";--> statement-breakpoint
DELETE FROM "candidates";--> statement-breakpoint
DELETE FROM "jobs";--> statement-breakpoint
DELETE FROM "organization_members";--> statement-breakpoint

-- Step 3: Convert auth columns from text (Clerk IDs) to uuid (users table refs)
ALTER TABLE "organization_members" RENAME COLUMN "clerk_user_id" TO "user_id";--> statement-breakpoint
ALTER TABLE "organization_members" DROP CONSTRAINT "uq_org_member";--> statement-breakpoint
ALTER TABLE "organization_members" ALTER COLUMN "user_id" SET DATA TYPE uuid USING "user_id"::uuid;--> statement-breakpoint
ALTER TABLE "jobs" ALTER COLUMN "created_by" SET DATA TYPE uuid USING "created_by"::uuid;--> statement-breakpoint
ALTER TABLE "application_ratings" ALTER COLUMN "rated_by" SET DATA TYPE uuid USING "rated_by"::uuid;--> statement-breakpoint

-- Step 4: Add foreign key constraints
ALTER TABLE "email_templates" ADD CONSTRAINT "email_templates_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_logs" ADD CONSTRAINT "email_logs_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_logs" ADD CONSTRAINT "email_logs_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_logs" ADD CONSTRAINT "email_logs_candidate_id_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidates"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_logs" ADD CONSTRAINT "email_logs_template_id_email_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."email_templates"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_logs" ADD CONSTRAINT "email_logs_sent_by_users_id_fk" FOREIGN KEY ("sent_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_ratings" ADD CONSTRAINT "application_ratings_rated_by_users_id_fk" FOREIGN KEY ("rated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_members" ADD CONSTRAINT "uq_org_member" UNIQUE("organization_id","user_id");
