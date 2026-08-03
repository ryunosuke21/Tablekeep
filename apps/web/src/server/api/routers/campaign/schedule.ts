import { TRPCError } from "@trpc/server";
import { DateTime } from "luxon";
import { z } from "zod";

import { CAMPAIGN_SCHEDULE_HORIZON_DAYS } from "@/lib/constants";
import {
  campaignScheduleSchema,
  occurrenceOverrideSchema,
} from "@/lib/validation/campaign";
import {
  campaignDmProcedure,
  campaignMemberProcedure,
  createTRPCRouter,
} from "@/server/api/trpc";
import {
  clearCampaignSchedule,
  listCampaignOccurrenceOverrides,
  removeCampaignOccurrenceOverride,
  setCampaignSchedule,
  upsertCampaignOccurrenceOverride,
} from "@/server/db/queries/campaign";
import {
  type CampaignSchedule,
  deserializeRecurrence,
  expandScheduleOccurrences,
  isGeneratedOccurrence,
  parseRecurrenceRule,
  serializeRecurrence,
} from "@/server/domain/campaign/schedule";

const campaignIdSchema = z.object({ campaignId: z.string().uuid() });

function campaignSchedule(campaign: {
  recurrence: string | null;
  recurrenceStartAt: Date | null;
  recurrenceTimeZone: string | null;
  recurrenceDurationMinutes: number | null;
}): CampaignSchedule {
  return campaign;
}

export async function resolveCampaignSchedulePayload(
  db: Parameters<typeof listCampaignOccurrenceOverrides>[0],
  campaign: Parameters<typeof campaignSchedule>[0] & { id: string },
  now = new Date(),
) {
  const schedule = campaignSchedule(campaign);
  const horizon = DateTime.fromJSDate(now)
    .plus({ days: CAMPAIGN_SCHEDULE_HORIZON_DAYS })
    .toJSDate();
  // Include recent originals that may have been rescheduled into the forward
  // horizon, then trim by the resolved start below.
  const overrideLookback = DateTime.fromJSDate(now)
    .minus({ days: CAMPAIGN_SCHEDULE_HORIZON_DAYS })
    .toJSDate();
  const overrides = await listCampaignOccurrenceOverrides(db, [campaign.id], {
    from: overrideLookback,
    through: horizon,
  });
  const overrideByStart = new Map(
    overrides
      .filter((override) => override.kind !== "added")
      .map((override) => [override.occurrenceStartAt.getTime(), override]),
  );
  const duration = schedule.recurrenceDurationMinutes;
  const generated = expandScheduleOccurrences(schedule, {
    from: overrideLookback,
    horizon,
  }).map((occurrenceStartAt) => {
    const override = overrideByStart.get(occurrenceStartAt.getTime());
    const state = override?.kind ?? "scheduled";
    const startsAt =
      state === "cancelled"
        ? null
        : state === "rescheduled"
          ? (override?.startsAt ?? null)
          : occurrenceStartAt;
    const occurrenceDuration = override?.durationMinutes ?? duration;
    return {
      occurrenceStartAt,
      startsAt,
      endsAt:
        startsAt && occurrenceDuration !== null
          ? new Date(startsAt.getTime() + occurrenceDuration * 60_000)
          : null,
      state,
      durationMinutes: occurrenceDuration,
      title: override?.title ?? null,
      notes: override?.notes ?? null,
    };
  });
  const added = overrides
    .filter((override) => override.kind === "added")
    .map((override) => {
      const occurrenceDuration = override.durationMinutes ?? duration;
      return {
        occurrenceStartAt: override.occurrenceStartAt,
        startsAt: override.occurrenceStartAt,
        endsAt:
          occurrenceDuration === null
            ? null
            : new Date(
                override.occurrenceStartAt.getTime() +
                  occurrenceDuration * 60_000,
              ),
        state: "added" as const,
        durationMinutes: occurrenceDuration,
        title: override.title ?? null,
        notes: override.notes ?? null,
      };
    });

  return {
    recurrence: schedule.recurrence
      ? deserializeRecurrence(schedule.recurrence)
      : null,
    startAt: schedule.recurrenceStartAt,
    timeZone: schedule.recurrenceTimeZone,
    durationMinutes: duration,
    occurrences: [...generated, ...added]
      .filter((occurrence) => {
        const resolvedStart =
          occurrence.startsAt ?? occurrence.occurrenceStartAt;
        return resolvedStart >= now && resolvedStart <= horizon;
      })
      .sort((left, right) => {
        const leftTime = left.startsAt ?? left.occurrenceStartAt;
        const rightTime = right.startsAt ?? right.occurrenceStartAt;
        return leftTime.getTime() - rightTime.getTime();
      }),
  };
}

export const campaignScheduleRouter = createTRPCRouter({
  get: campaignMemberProcedure.query(({ ctx }) =>
    resolveCampaignSchedulePayload(ctx.db, ctx.campaign),
  ),

  set: campaignDmProcedure
    .input(campaignScheduleSchema.extend({ campaignId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const result = await setCampaignSchedule(ctx.db, ctx.campaign.id, {
        recurrence: serializeRecurrence(
          parseRecurrenceRule(input.recurrenceRule),
        ),
        recurrenceStartAt: input.startAt,
        recurrenceTimeZone: input.timeZone,
      });
      if (!result) throw new TRPCError({ code: "NOT_FOUND" });
      return resolveCampaignSchedulePayload(ctx.db, result);
    }),

  clear: campaignDmProcedure
    .input(campaignIdSchema)
    .mutation(async ({ ctx }) => {
      const result = await clearCampaignSchedule(ctx.db, ctx.campaign.id);
      if (!result) throw new TRPCError({ code: "NOT_FOUND" });
      return resolveCampaignSchedulePayload(ctx.db, result);
    }),

  override: campaignDmProcedure
    .input(
      z.object({
        campaignId: z.string().uuid(),
        override: occurrenceOverrideSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const schedule = campaignSchedule(ctx.campaign);
      if (
        input.override.kind !== "added" &&
        !isGeneratedOccurrence(schedule, input.override.occurrenceStartAt)
      ) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "That occurrence is not generated by the current schedule.",
        });
      }
      if (
        input.override.kind === "added" &&
        schedule.recurrence !== null &&
        isGeneratedOccurrence(schedule, input.override.occurrenceStartAt)
      ) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "That time is already generated by the current schedule.",
        });
      }

      const result = await upsertCampaignOccurrenceOverride(ctx.db, {
        campaignId: ctx.campaign.id,
        ...input.override,
        startsAt:
          input.override.kind === "rescheduled"
            ? input.override.startsAt
            : null,
        createdById: ctx.session.user.id,
      });
      if (!result) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      return result;
    }),

  removeOverride: campaignDmProcedure
    .input(campaignIdSchema.extend({ occurrenceStartAt: z.coerce.date() }))
    .mutation(async ({ ctx, input }) => ({
      removed:
        (await removeCampaignOccurrenceOverride(
          ctx.db,
          ctx.campaign.id,
          input.occurrenceStartAt,
        )) !== null,
    })),
});
