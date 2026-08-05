CREATE TABLE "character_sheets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" uuid NOT NULL,
	"char_id" uuid NOT NULL,
	"owner_id" text NOT NULL,
	"name" text,
	"ancestry" text,
	"max_hp" integer DEFAULT 1 NOT NULL,
	"notes" text,
	"retired_at" timestamp,
	"retired_by" text,
	"updated_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "character_sheets_max_hp_check" CHECK ("character_sheets"."max_hp" between 1 and 1000000),
	CONSTRAINT "character_sheets_retired_actor_check" CHECK ("character_sheets"."retired_at" is not null or "character_sheets"."retired_by" is null)
);
--> statement-breakpoint
CREATE TABLE "characters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" text NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"bio" text,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sheet_backgrounds" (
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
	CONSTRAINT "sheet_backgrounds_sort_check" CHECK ("sheet_backgrounds"."sort" >= 0)
);
--> statement-breakpoint
CREATE TABLE "sheet_classes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sheet_id" uuid NOT NULL,
	"name" text NOT NULL,
	"subclass" text,
	"level" integer NOT NULL,
	"source" text DEFAULT 'custom' NOT NULL,
	"ref" text,
	"sort" integer DEFAULT 0 NOT NULL,
	"created_by" text,
	"updated_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sheet_classes_level_check" CHECK ("sheet_classes"."level" between 1 and 100),
	CONSTRAINT "sheet_classes_sort_check" CHECK ("sheet_classes"."sort" >= 0)
);
--> statement-breakpoint
CREATE TABLE "sheet_conditions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sheet_id" uuid NOT NULL,
	"name" text NOT NULL,
	"created_by" text,
	"removed_at" timestamp,
	"removed_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sheet_conditions_removed_actor_check" CHECK ("sheet_conditions"."removed_at" is not null or "sheet_conditions"."removed_by" is null)
);
--> statement-breakpoint
CREATE TABLE "sheet_currencies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sheet_id" uuid NOT NULL,
	"name" text NOT NULL,
	"amount" integer DEFAULT 0 NOT NULL,
	"created_by" text,
	"updated_by" text,
	"removed_at" timestamp,
	"removed_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sheet_currencies_amount_check" CHECK ("sheet_currencies"."amount" between 0 and 1000000000),
	CONSTRAINT "sheet_currencies_removed_actor_check" CHECK ("sheet_currencies"."removed_at" is not null or "sheet_currencies"."removed_by" is null)
);
--> statement-breakpoint
CREATE TABLE "sheet_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sheet_id" uuid NOT NULL,
	"name" text NOT NULL,
	"qty" integer DEFAULT 1 NOT NULL,
	"equipped" boolean DEFAULT false NOT NULL,
	"notes" text,
	"created_by" text,
	"updated_by" text,
	"removed_at" timestamp,
	"removed_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sheet_items_qty_check" CHECK ("sheet_items"."qty" between 0 and 1000000),
	CONSTRAINT "sheet_items_removed_actor_check" CHECK ("sheet_items"."removed_at" is not null or "sheet_items"."removed_by" is null)
);
--> statement-breakpoint
ALTER TABLE "character_sheets" ADD CONSTRAINT "character_sheets_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "character_sheets" ADD CONSTRAINT "character_sheets_char_id_characters_id_fk" FOREIGN KEY ("char_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "character_sheets" ADD CONSTRAINT "character_sheets_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "character_sheets" ADD CONSTRAINT "character_sheets_retired_by_users_id_fk" FOREIGN KEY ("retired_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "character_sheets" ADD CONSTRAINT "character_sheets_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "characters" ADD CONSTRAINT "characters_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sheet_backgrounds" ADD CONSTRAINT "sheet_backgrounds_sheet_id_character_sheets_id_fk" FOREIGN KEY ("sheet_id") REFERENCES "public"."character_sheets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sheet_backgrounds" ADD CONSTRAINT "sheet_backgrounds_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sheet_backgrounds" ADD CONSTRAINT "sheet_backgrounds_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sheet_classes" ADD CONSTRAINT "sheet_classes_sheet_id_character_sheets_id_fk" FOREIGN KEY ("sheet_id") REFERENCES "public"."character_sheets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sheet_classes" ADD CONSTRAINT "sheet_classes_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sheet_classes" ADD CONSTRAINT "sheet_classes_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sheet_conditions" ADD CONSTRAINT "sheet_conditions_sheet_id_character_sheets_id_fk" FOREIGN KEY ("sheet_id") REFERENCES "public"."character_sheets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sheet_conditions" ADD CONSTRAINT "sheet_conditions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sheet_conditions" ADD CONSTRAINT "sheet_conditions_removed_by_users_id_fk" FOREIGN KEY ("removed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sheet_currencies" ADD CONSTRAINT "sheet_currencies_sheet_id_character_sheets_id_fk" FOREIGN KEY ("sheet_id") REFERENCES "public"."character_sheets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sheet_currencies" ADD CONSTRAINT "sheet_currencies_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sheet_currencies" ADD CONSTRAINT "sheet_currencies_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sheet_currencies" ADD CONSTRAINT "sheet_currencies_removed_by_users_id_fk" FOREIGN KEY ("removed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sheet_items" ADD CONSTRAINT "sheet_items_sheet_id_character_sheets_id_fk" FOREIGN KEY ("sheet_id") REFERENCES "public"."character_sheets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sheet_items" ADD CONSTRAINT "sheet_items_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sheet_items" ADD CONSTRAINT "sheet_items_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sheet_items" ADD CONSTRAINT "sheet_items_removed_by_users_id_fk" FOREIGN KEY ("removed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "character_sheets_campaign_char_uidx" ON "character_sheets" USING btree ("campaign_id","char_id");--> statement-breakpoint
CREATE UNIQUE INDEX "character_sheets_active_owner_uidx" ON "character_sheets" USING btree ("campaign_id","owner_id") WHERE "character_sheets"."retired_at" is null;--> statement-breakpoint
CREATE INDEX "character_sheets_char_idx" ON "character_sheets" USING btree ("char_id");--> statement-breakpoint
CREATE INDEX "character_sheets_owner_idx" ON "character_sheets" USING btree ("owner_id");--> statement-breakpoint
CREATE UNIQUE INDEX "characters_slug_uidx" ON "characters" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "characters_owner_deleted_idx" ON "characters" USING btree ("owner_id","deleted_at");--> statement-breakpoint
CREATE INDEX "sheet_backgrounds_sheet_sort_idx" ON "sheet_backgrounds" USING btree ("sheet_id","sort");--> statement-breakpoint
CREATE INDEX "sheet_classes_sheet_sort_idx" ON "sheet_classes" USING btree ("sheet_id","sort");--> statement-breakpoint
CREATE UNIQUE INDEX "sheet_conditions_active_name_uidx" ON "sheet_conditions" USING btree ("sheet_id",lower("name")) WHERE "sheet_conditions"."removed_at" is null;--> statement-breakpoint
CREATE INDEX "sheet_conditions_sheet_removed_idx" ON "sheet_conditions" USING btree ("sheet_id","removed_at");--> statement-breakpoint
CREATE UNIQUE INDEX "sheet_currencies_active_name_uidx" ON "sheet_currencies" USING btree ("sheet_id",lower("name")) WHERE "sheet_currencies"."removed_at" is null;--> statement-breakpoint
CREATE INDEX "sheet_currencies_sheet_removed_idx" ON "sheet_currencies" USING btree ("sheet_id","removed_at");--> statement-breakpoint
CREATE INDEX "sheet_items_sheet_removed_idx" ON "sheet_items" USING btree ("sheet_id","removed_at");