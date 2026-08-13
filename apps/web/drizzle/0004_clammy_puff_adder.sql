CREATE TABLE "sheet_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sheet_id" uuid NOT NULL,
	"actor_id" text,
	"actor_name" text NOT NULL,
	"actor_role" text NOT NULL,
	"entity" text NOT NULL,
	"action" text NOT NULL,
	"summary" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sheet_feats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sheet_id" uuid NOT NULL,
	"name" text NOT NULL,
	"notes" text,
	"source" text DEFAULT 'custom' NOT NULL,
	"ref" text,
	"sort" integer DEFAULT 0 NOT NULL,
	"created_by" text,
	"updated_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sheet_feats_sort_check" CHECK ("sheet_feats"."sort" >= 0)
);
--> statement-breakpoint
CREATE TABLE "sheet_npcs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sheet_id" uuid NOT NULL,
	"name" text NOT NULL,
	"relationship" text,
	"notes" text,
	"sort" integer DEFAULT 0 NOT NULL,
	"created_by" text,
	"updated_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sheet_npcs_sort_check" CHECK ("sheet_npcs"."sort" >= 0)
);
--> statement-breakpoint
CREATE TABLE "sheet_spells" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sheet_id" uuid NOT NULL,
	"name" text NOT NULL,
	"level" integer DEFAULT 0 NOT NULL,
	"prepared" boolean DEFAULT false NOT NULL,
	"notes" text,
	"source" text DEFAULT 'custom' NOT NULL,
	"ref" text,
	"sort" integer DEFAULT 0 NOT NULL,
	"created_by" text,
	"updated_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sheet_spells_level_check" CHECK ("sheet_spells"."level" between 0 and 20),
	CONSTRAINT "sheet_spells_sort_check" CHECK ("sheet_spells"."sort" >= 0)
);
--> statement-breakpoint
CREATE TABLE "sheet_stats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sheet_id" uuid NOT NULL,
	"name" text NOT NULL,
	"value" integer DEFAULT 10 NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"created_by" text,
	"updated_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sheet_stats_value_check" CHECK ("sheet_stats"."value" between -1000 and 1000),
	CONSTRAINT "sheet_stats_sort_check" CHECK ("sheet_stats"."sort" >= 0)
);
--> statement-breakpoint
ALTER TABLE "character_sheets" ADD COLUMN "alignment" text;--> statement-breakpoint
ALTER TABLE "character_sheets" ADD COLUMN "appearance" text;--> statement-breakpoint
ALTER TABLE "character_sheets" ADD COLUMN "backstory" text;--> statement-breakpoint
ALTER TABLE "sheet_events" ADD CONSTRAINT "sheet_events_sheet_id_character_sheets_id_fk" FOREIGN KEY ("sheet_id") REFERENCES "public"."character_sheets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sheet_events" ADD CONSTRAINT "sheet_events_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sheet_feats" ADD CONSTRAINT "sheet_feats_sheet_id_character_sheets_id_fk" FOREIGN KEY ("sheet_id") REFERENCES "public"."character_sheets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sheet_feats" ADD CONSTRAINT "sheet_feats_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sheet_feats" ADD CONSTRAINT "sheet_feats_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sheet_npcs" ADD CONSTRAINT "sheet_npcs_sheet_id_character_sheets_id_fk" FOREIGN KEY ("sheet_id") REFERENCES "public"."character_sheets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sheet_npcs" ADD CONSTRAINT "sheet_npcs_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sheet_npcs" ADD CONSTRAINT "sheet_npcs_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sheet_spells" ADD CONSTRAINT "sheet_spells_sheet_id_character_sheets_id_fk" FOREIGN KEY ("sheet_id") REFERENCES "public"."character_sheets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sheet_spells" ADD CONSTRAINT "sheet_spells_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sheet_spells" ADD CONSTRAINT "sheet_spells_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sheet_stats" ADD CONSTRAINT "sheet_stats_sheet_id_character_sheets_id_fk" FOREIGN KEY ("sheet_id") REFERENCES "public"."character_sheets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sheet_stats" ADD CONSTRAINT "sheet_stats_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sheet_stats" ADD CONSTRAINT "sheet_stats_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "sheet_events_sheet_created_idx" ON "sheet_events" USING btree ("sheet_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "sheet_feats_sheet_sort_idx" ON "sheet_feats" USING btree ("sheet_id","sort");--> statement-breakpoint
CREATE INDEX "sheet_npcs_sheet_sort_idx" ON "sheet_npcs" USING btree ("sheet_id","sort");--> statement-breakpoint
CREATE UNIQUE INDEX "sheet_spells_name_uidx" ON "sheet_spells" USING btree ("sheet_id",lower("name"));--> statement-breakpoint
CREATE INDEX "sheet_spells_sheet_level_idx" ON "sheet_spells" USING btree ("sheet_id","level","sort");--> statement-breakpoint
CREATE UNIQUE INDEX "sheet_stats_name_uidx" ON "sheet_stats" USING btree ("sheet_id",lower("name"));--> statement-breakpoint
CREATE INDEX "sheet_stats_sheet_sort_idx" ON "sheet_stats" USING btree ("sheet_id","sort");