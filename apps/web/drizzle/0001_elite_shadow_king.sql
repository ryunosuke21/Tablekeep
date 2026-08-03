CREATE TYPE "public"."campaign_colors" AS ENUM('lilac', 'rose', 'sage', 'sky');--> statement-breakpoint
CREATE TYPE "public"."campaign_invitation_status" AS ENUM('pending', 'accepted', 'rejected', 'canceled');--> statement-breakpoint
CREATE TYPE "public"."campaign_invite_code_status" AS ENUM('pending', 'revoked');--> statement-breakpoint
CREATE TYPE "public"."campaign_member_event_action" AS ENUM('joined', 'removed', 'left', 'role_changed');--> statement-breakpoint
CREATE TYPE "public"."campaign_occurrence_override_kind" AS ENUM('cancelled', 'rescheduled', 'added');--> statement-breakpoint
CREATE TYPE "public"."campaign_role" AS ENUM('dm', 'player');--> statement-breakpoint
CREATE TYPE "public"."campaign_status" AS ENUM('active', 'archived');--> statement-breakpoint
CREATE TABLE "campaign_invitations" (
	"id" text PRIMARY KEY NOT NULL,
	"campaign_id" uuid NOT NULL,
	"email" text NOT NULL,
	"role" "campaign_role" NOT NULL,
	"status" "campaign_invitation_status" DEFAULT 'pending' NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"inviter_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "campaign_invite_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" uuid NOT NULL,
	"code" text NOT NULL,
	"role" "campaign_role" DEFAULT 'player' NOT NULL,
	"status" "campaign_invite_code_status" DEFAULT 'pending' NOT NULL,
	"max_uses" integer,
	"use_count" integer DEFAULT 0 NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_by_id" text,
	"revoked_by_id" text,
	"revoked_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "campaign_invite_codes_use_count_check" CHECK ("campaign_invite_codes"."use_count" >= 0),
	CONSTRAINT "campaign_invite_codes_max_uses_check" CHECK ("campaign_invite_codes"."max_uses" is null or "campaign_invite_codes"."max_uses" > 0),
	CONSTRAINT "campaign_invite_codes_usage_check" CHECK ("campaign_invite_codes"."max_uses" is null or "campaign_invite_codes"."use_count" <= "campaign_invite_codes"."max_uses")
);
--> statement-breakpoint
CREATE TABLE "campaign_member_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" uuid NOT NULL,
	"user_id" text,
	"role" "campaign_role" NOT NULL,
	"action" "campaign_member_event_action" NOT NULL,
	"previous_role" "campaign_role",
	"actor_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "campaign_members" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"campaign_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"role" "campaign_role" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "campaign_occurrence_overrides" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" uuid NOT NULL,
	"occurrence_start_at" timestamp with time zone NOT NULL,
	"kind" "campaign_occurrence_override_kind" NOT NULL,
	"starts_at" timestamp with time zone,
	"duration_minutes" integer,
	"title" text,
	"notes" text,
	"created_by_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "campaign_occurrence_overrides_shape_check" CHECK ((
        ("campaign_occurrence_overrides"."kind" = 'rescheduled' and "campaign_occurrence_overrides"."starts_at" is not null)
        or
        ("campaign_occurrence_overrides"."kind" <> 'rescheduled' and "campaign_occurrence_overrides"."starts_at" is null)
      )),
	CONSTRAINT "campaign_occurrence_overrides_duration_check" CHECK ("campaign_occurrence_overrides"."duration_minutes" is null or "campaign_occurrence_overrides"."duration_minutes" > 0),
	CONSTRAINT "campaign_occurrence_overrides_added_duration_check" CHECK ("campaign_occurrence_overrides"."kind" <> 'added' or "campaign_occurrence_overrides"."duration_minutes" is not null)
);
--> statement-breakpoint
CREATE TABLE "campaigns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"logo" text,
	"metadata" text,
	"description" text,
	"colors" "campaign_colors" DEFAULT 'lilac' NOT NULL,
	"status" "campaign_status" DEFAULT 'active' NOT NULL,
	"recurrence" text,
	"recurrence_start_at" timestamp with time zone,
	"recurrence_time_zone" text,
	"recurrence_duration_minutes" integer,
	"archived_at" timestamp,
	"created_by_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "campaigns_schedule_complete_check" CHECK ((
        ("campaigns"."recurrence" is null and "campaigns"."recurrence_start_at" is null and "campaigns"."recurrence_time_zone" is null and "campaigns"."recurrence_duration_minutes" is null)
        or
        ("campaigns"."recurrence" is not null and "campaigns"."recurrence_start_at" is not null and "campaigns"."recurrence_time_zone" is not null and "campaigns"."recurrence_duration_minutes" is not null)
      )),
	CONSTRAINT "campaigns_recurrence_duration_check" CHECK ("campaigns"."recurrence_duration_minutes" is null or "campaigns"."recurrence_duration_minutes" > 0)
);
--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "active_organization_id" uuid;--> statement-breakpoint
ALTER TABLE "campaign_invitations" ADD CONSTRAINT "campaign_invitations_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_invitations" ADD CONSTRAINT "campaign_invitations_inviter_id_users_id_fk" FOREIGN KEY ("inviter_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_invite_codes" ADD CONSTRAINT "campaign_invite_codes_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_invite_codes" ADD CONSTRAINT "campaign_invite_codes_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_invite_codes" ADD CONSTRAINT "campaign_invite_codes_revoked_by_id_users_id_fk" FOREIGN KEY ("revoked_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_member_events" ADD CONSTRAINT "campaign_member_events_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_member_events" ADD CONSTRAINT "campaign_member_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_member_events" ADD CONSTRAINT "campaign_member_events_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_members" ADD CONSTRAINT "campaign_members_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_members" ADD CONSTRAINT "campaign_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_occurrence_overrides" ADD CONSTRAINT "campaign_occurrence_overrides_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_occurrence_overrides" ADD CONSTRAINT "campaign_occurrence_overrides_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "campaign_invitations_campaign_idx" ON "campaign_invitations" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "campaign_invitations_email_idx" ON "campaign_invitations" USING btree ("email");--> statement-breakpoint
CREATE INDEX "campaign_invitations_campaign_status_idx" ON "campaign_invitations" USING btree ("campaign_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "campaign_invite_codes_code_uidx" ON "campaign_invite_codes" USING btree ("code");--> statement-breakpoint
CREATE INDEX "campaign_invite_codes_campaign_status_idx" ON "campaign_invite_codes" USING btree ("campaign_id","status");--> statement-breakpoint
CREATE INDEX "campaign_member_events_campaign_created_idx" ON "campaign_member_events" USING btree ("campaign_id","created_at");--> statement-breakpoint
CREATE INDEX "campaign_member_events_user_idx" ON "campaign_member_events" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "campaign_members_campaign_user_uidx" ON "campaign_members" USING btree ("campaign_id","user_id");--> statement-breakpoint
CREATE INDEX "campaign_members_campaign_idx" ON "campaign_members" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "campaign_members_user_idx" ON "campaign_members" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "campaign_occurrence_overrides_campaign_start_uidx" ON "campaign_occurrence_overrides" USING btree ("campaign_id","occurrence_start_at");--> statement-breakpoint
CREATE UNIQUE INDEX "campaigns_slug_uidx" ON "campaigns" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "campaigns_status_idx" ON "campaigns" USING btree ("status");