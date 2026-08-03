import { z } from "zod";

import {
  CAMPAIGN_INVITE_TTL_DAYS,
  MAX_CAMPAIGN_MEMBERS,
  MAX_CAMPAIGN_SCHEDULE_OCCURRENCES,
} from "@/lib/constants";
import {
  isSupportedTimeZone,
  RECURRENCE_FREQUENCIES,
  RECURRENCE_WEEKDAYS,
} from "@/server/domain/campaign/schedule";

export const campaignColorSchema = z.enum(["lilac", "rose", "sage", "sky"]);
export const campaignRoleSchema = z.enum(["dm", "player"]);

const campaignNameSchema = z
  .string()
  .trim()
  .min(1, "Enter a campaign name.")
  .max(80, "Use 80 characters or fewer.");

const campaignDescriptionSchema = z
  .string()
  .trim()
  .max(280, "Use 280 characters or fewer.");

export const campaignDetailsSchema = z.object({
  name: campaignNameSchema,
  description: campaignDescriptionSchema.optional(),
  colors: campaignColorSchema.default("lilac"),
});

export const campaignUpdateSchema = z
  .object({
    campaignId: z.string().uuid(),
    name: campaignNameSchema.optional(),
    description: campaignDescriptionSchema.optional(),
    colors: campaignColorSchema.optional(),
  })
  .refine(
    ({ name, description, colors }) =>
      name !== undefined || description !== undefined || colors !== undefined,
    { message: "Provide at least one campaign detail to update." },
  );

export const memberRoleUpdateSchema = z.object({
  campaignId: z.string().uuid(),
  memberId: z.string().min(1),
  role: campaignRoleSchema,
});

export const linkInviteCreationSchema = z.object({
  campaignId: z.string().uuid(),
  role: campaignRoleSchema.default("player"),
  expiresInDays: z
    .number()
    .int()
    .min(1)
    .max(30)
    .default(CAMPAIGN_INVITE_TTL_DAYS),
  maxUses: z
    .number()
    .int()
    .min(1)
    .max(MAX_CAMPAIGN_MEMBERS)
    .nullable()
    .optional(),
});

export const emailInviteCreationSchema = z.object({
  campaignId: z.string().uuid(),
  email: z.string().trim().toLowerCase().email(),
  role: campaignRoleSchema.default("player"),
});

export const inviteCodeEntrySchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, "Enter an invitation code.")
    .transform((value) => value.toUpperCase().replace(/[^A-Z0-9]/g, ""))
    .pipe(
      z.string().length(10, "Invitation codes contain 10 letters and numbers."),
    ),
});

export const inviteReferenceSchema = z.union([
  z.object({ code: z.string().min(1) }).strict(),
  z.object({ invitationId: z.string().min(1) }).strict(),
]);

const safeDateSchema = z.preprocess(
  (value) => (value === null || value === "" ? undefined : value),
  z.coerce.date(),
);

export const structuredRecurrenceSchema = z
  .object({
    freq: z.enum(RECURRENCE_FREQUENCIES),
    interval: z.number().int().min(1).max(52).default(1),
    byDay: z.array(z.enum(RECURRENCE_WEEKDAYS)).max(7).optional(),
    until: safeDateSchema.optional(),
    count: z
      .number()
      .int()
      .min(1)
      .max(MAX_CAMPAIGN_SCHEDULE_OCCURRENCES)
      .optional(),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.until && value.count) {
      context.addIssue({
        code: "custom",
        message: "Choose either an end date or an occurrence count, not both.",
      });
    }
    if (value.byDay && new Set(value.byDay).size !== value.byDay.length) {
      context.addIssue({
        code: "custom",
        path: ["byDay"],
        message: "Weekdays must be unique.",
      });
    }
  });

export const campaignScheduleSchema = z
  .object({
    recurrence: structuredRecurrenceSchema,
    startAt: safeDateSchema,
    timeZone: z
      .string()
      .trim()
      .refine(isSupportedTimeZone, "Choose a supported IANA time zone."),
    durationMinutes: z
      .number()
      .int()
      .min(15)
      .max(24 * 60),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.recurrence.until && value.recurrence.until < value.startAt) {
      context.addIssue({
        code: "custom",
        path: ["recurrence", "until"],
        message: "The recurrence end must be after its first session.",
      });
    }
  });

const overrideMetadata = {
  durationMinutes: z
    .number()
    .int()
    .min(15)
    .max(24 * 60)
    .optional(),
  title: z.string().trim().max(80).optional(),
  notes: z.string().trim().max(1_000).optional(),
};

export const occurrenceOverrideSchema = z.discriminatedUnion("kind", [
  z
    .object({
      kind: z.literal("cancelled"),
      occurrenceStartAt: safeDateSchema,
      ...overrideMetadata,
    })
    .strict(),
  z
    .object({
      kind: z.literal("rescheduled"),
      occurrenceStartAt: safeDateSchema,
      startsAt: safeDateSchema,
      ...overrideMetadata,
    })
    .strict(),
  z
    .object({
      kind: z.literal("added"),
      occurrenceStartAt: safeDateSchema,
      durationMinutes: z
        .number()
        .int()
        .min(15)
        .max(24 * 60),
      title: overrideMetadata.title,
      notes: overrideMetadata.notes,
    })
    .strict(),
]);

export type CampaignDetailsInput = z.infer<typeof campaignDetailsSchema>;
export type CampaignScheduleInput = z.infer<typeof campaignScheduleSchema>;
export type StructuredRecurrenceInput = z.infer<
  typeof structuredRecurrenceSchema
>;
export type OccurrenceOverrideInput = z.infer<typeof occurrenceOverrideSchema>;
