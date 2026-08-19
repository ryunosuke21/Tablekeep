CREATE TYPE "public"."encounter_combatant_source" AS ENUM('sheet', 'custom');--> statement-breakpoint
CREATE TYPE "public"."encounter_effect_tick" AS ENUM('turn_start', 'turn_end', 'round_start', 'manual');--> statement-breakpoint
CREATE TYPE "public"."encounter_effect_visibility" AS ENUM('players', 'dm');--> statement-breakpoint
CREATE TYPE "public"."encounter_status" AS ENUM('draft', 'active', 'completed');--> statement-breakpoint
CREATE TYPE "public"."encounter_visibility" AS ENUM('players', 'name_only', 'dm');--> statement-breakpoint
CREATE TABLE "campaign_member_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"content" text DEFAULT '' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "encounter_combatants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"encounter_id" uuid NOT NULL,
	"sheet_id" uuid,
	"source" "encounter_combatant_source" NOT NULL,
	"name" text NOT NULL,
	"initiative_roll" integer,
	"initiative_modifier" integer DEFAULT 0 NOT NULL,
	"initiative_total" integer,
	"position" integer NOT NULL,
	"current_hp" integer,
	"max_hp" integer,
	"temp_hp" integer DEFAULT 0 NOT NULL,
	"visibility" "encounter_visibility" DEFAULT 'players' NOT NULL,
	"dm_notes" text,
	"created_by" text,
	"updated_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "encounter_combatants_source_check" CHECK ((
        ("encounter_combatants"."source" = 'sheet' and "encounter_combatants"."sheet_id" is not null)
        or ("encounter_combatants"."source" = 'custom' and "encounter_combatants"."sheet_id" is null)
      )),
	CONSTRAINT "encounter_combatants_initiative_roll_check" CHECK ("encounter_combatants"."initiative_roll" is null or "encounter_combatants"."initiative_roll" between 1 and 20),
	CONSTRAINT "encounter_combatants_initiative_modifier_check" CHECK ("encounter_combatants"."initiative_modifier" between -1000 and 1000),
	CONSTRAINT "encounter_combatants_initiative_total_check" CHECK ("encounter_combatants"."initiative_total" is null or "encounter_combatants"."initiative_total" between -2000 and 2000),
	CONSTRAINT "encounter_combatants_position_check" CHECK ("encounter_combatants"."position" >= 0),
	CONSTRAINT "encounter_combatants_current_hp_check" CHECK ("encounter_combatants"."current_hp" is null or "encounter_combatants"."current_hp" between -1000000 and 1000000),
	CONSTRAINT "encounter_combatants_max_hp_check" CHECK ("encounter_combatants"."max_hp" is null or "encounter_combatants"."max_hp" between 1 and 1000000),
	CONSTRAINT "encounter_combatants_temp_hp_check" CHECK ("encounter_combatants"."temp_hp" between 0 and 1000000)
);
--> statement-breakpoint
CREATE TABLE "encounter_effects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"combatant_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"remaining_turns" integer,
	"tick" "encounter_effect_tick" DEFAULT 'manual' NOT NULL,
	"visibility" "encounter_effect_visibility" DEFAULT 'players' NOT NULL,
	"created_by" text,
	"removed_by" text,
	"removed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "encounter_effects_remaining_turns_check" CHECK ("encounter_effects"."remaining_turns" is null or "encounter_effects"."remaining_turns" >= 0),
	CONSTRAINT "encounter_effects_removed_actor_check" CHECK ("encounter_effects"."removed_at" is not null or "encounter_effects"."removed_by" is null)
);
--> statement-breakpoint
CREATE TABLE "encounter_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"encounter_id" uuid NOT NULL,
	"actor_id" text,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" uuid,
	"summary" text NOT NULL,
	"details" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "encounters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" uuid NOT NULL,
	"name" text DEFAULT 'Encounter' NOT NULL,
	"status" "encounter_status" DEFAULT 'draft' NOT NULL,
	"round" integer DEFAULT 1 NOT NULL,
	"active_position" integer,
	"revision" integer DEFAULT 0 NOT NULL,
	"created_by" text,
	"started_by" text,
	"started_at" timestamp,
	"completed_by" text,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "encounters_round_check" CHECK ("encounters"."round" >= 1),
	CONSTRAINT "encounters_active_position_check" CHECK ("encounters"."active_position" is null or "encounters"."active_position" >= 0),
	CONSTRAINT "encounters_revision_check" CHECK ("encounters"."revision" >= 0),
	CONSTRAINT "encounters_started_shape_check" CHECK ((
        "encounters"."status" = 'draft'
        or "encounters"."started_at" is not null
      )),
	CONSTRAINT "encounters_completed_shape_check" CHECK ((
        "encounters"."status" <> 'completed'
        or "encounters"."completed_at" is not null
      ))
);
--> statement-breakpoint
CREATE TABLE "sheet_resources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sheet_id" uuid NOT NULL,
	"name" text NOT NULL,
	"current_value" integer DEFAULT 0 NOT NULL,
	"max_value" integer,
	"sort" integer DEFAULT 0 NOT NULL,
	"created_by" text,
	"updated_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sheet_resources_current_value_check" CHECK ("sheet_resources"."current_value" between 0 and 1000000),
	CONSTRAINT "sheet_resources_max_value_check" CHECK ("sheet_resources"."max_value" is null or "sheet_resources"."max_value" between 0 and 1000000),
	CONSTRAINT "sheet_resources_current_max_check" CHECK ("sheet_resources"."max_value" is null or "sheet_resources"."current_value" <= "sheet_resources"."max_value"),
	CONSTRAINT "sheet_resources_sort_check" CHECK ("sheet_resources"."sort" >= 0)
);
--> statement-breakpoint
ALTER TABLE "campaign_member_notes" ADD CONSTRAINT "campaign_member_notes_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_member_notes" ADD CONSTRAINT "campaign_member_notes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "encounter_combatants" ADD CONSTRAINT "encounter_combatants_encounter_id_encounters_id_fk" FOREIGN KEY ("encounter_id") REFERENCES "public"."encounters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "encounter_combatants" ADD CONSTRAINT "encounter_combatants_sheet_id_character_sheets_id_fk" FOREIGN KEY ("sheet_id") REFERENCES "public"."character_sheets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "encounter_combatants" ADD CONSTRAINT "encounter_combatants_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "encounter_combatants" ADD CONSTRAINT "encounter_combatants_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "encounter_effects" ADD CONSTRAINT "encounter_effects_combatant_id_encounter_combatants_id_fk" FOREIGN KEY ("combatant_id") REFERENCES "public"."encounter_combatants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "encounter_effects" ADD CONSTRAINT "encounter_effects_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "encounter_effects" ADD CONSTRAINT "encounter_effects_removed_by_users_id_fk" FOREIGN KEY ("removed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "encounter_events" ADD CONSTRAINT "encounter_events_encounter_id_encounters_id_fk" FOREIGN KEY ("encounter_id") REFERENCES "public"."encounters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "encounter_events" ADD CONSTRAINT "encounter_events_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "encounters" ADD CONSTRAINT "encounters_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "encounters" ADD CONSTRAINT "encounters_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "encounters" ADD CONSTRAINT "encounters_started_by_users_id_fk" FOREIGN KEY ("started_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "encounters" ADD CONSTRAINT "encounters_completed_by_users_id_fk" FOREIGN KEY ("completed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sheet_resources" ADD CONSTRAINT "sheet_resources_sheet_id_character_sheets_id_fk" FOREIGN KEY ("sheet_id") REFERENCES "public"."character_sheets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sheet_resources" ADD CONSTRAINT "sheet_resources_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sheet_resources" ADD CONSTRAINT "sheet_resources_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "campaign_member_notes_campaign_user_uidx" ON "campaign_member_notes" USING btree ("campaign_id","user_id");--> statement-breakpoint
CREATE INDEX "campaign_member_notes_user_idx" ON "campaign_member_notes" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "encounter_combatants_position_uidx" ON "encounter_combatants" USING btree ("encounter_id","position");--> statement-breakpoint
CREATE UNIQUE INDEX "encounter_combatants_sheet_uidx" ON "encounter_combatants" USING btree ("encounter_id","sheet_id") WHERE "encounter_combatants"."sheet_id" is not null;--> statement-breakpoint
CREATE INDEX "encounter_combatants_encounter_initiative_idx" ON "encounter_combatants" USING btree ("encounter_id","initiative_total" DESC NULLS LAST,"initiative_modifier" DESC NULLS LAST,"position");--> statement-breakpoint
CREATE INDEX "encounter_effects_combatant_removed_idx" ON "encounter_effects" USING btree ("combatant_id","removed_at");--> statement-breakpoint
CREATE INDEX "encounter_events_encounter_created_idx" ON "encounter_events" USING btree ("encounter_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE UNIQUE INDEX "encounters_one_active_campaign_uidx" ON "encounters" USING btree ("campaign_id") WHERE "encounters"."status" = 'active';--> statement-breakpoint
CREATE INDEX "encounters_campaign_status_updated_idx" ON "encounters" USING btree ("campaign_id","status","updated_at");--> statement-breakpoint
CREATE UNIQUE INDEX "sheet_resources_name_uidx" ON "sheet_resources" USING btree ("sheet_id",lower("name"));--> statement-breakpoint
CREATE INDEX "sheet_resources_sheet_sort_idx" ON "sheet_resources" USING btree ("sheet_id","sort");