ALTER TABLE "campaign_occurrence_overrides" DROP CONSTRAINT "campaign_occurrence_overrides_added_duration_check";--> statement-breakpoint
ALTER TABLE "campaigns" DROP CONSTRAINT "campaigns_schedule_complete_check";--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "banner_image" text;--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_schedule_complete_check" CHECK ((
        ("campaigns"."recurrence" is null and "campaigns"."recurrence_start_at" is null and "campaigns"."recurrence_time_zone" is null)
        or
        ("campaigns"."recurrence" is not null and "campaigns"."recurrence_start_at" is not null and "campaigns"."recurrence_time_zone" is not null)
      ));