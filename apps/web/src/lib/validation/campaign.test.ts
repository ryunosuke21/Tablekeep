import { describe, expect, it } from "vitest";

import {
  campaignDetailsSchema,
  campaignScheduleSchema,
  campaignUpdateSchema,
  emailInviteCreationSchema,
  inviteCodeEntrySchema,
  inviteReferenceSchema,
  linkInviteCreationSchema,
  occurrenceOverrideSchema,
  structuredRecurrenceSchema,
} from "./campaign";

describe("campaign validation", () => {
  it("trims campaign details and applies the color default", () => {
    expect(
      campaignDetailsSchema.parse({
        name: "  The Long Road  ",
        description: "  Notes  ",
      }),
    ).toEqual({
      name: "The Long Road",
      description: "Notes",
      colors: "lilac",
    });
  });

  it("requires at least one mutable campaign detail", () => {
    const campaignId = "11111111-1111-4111-8111-111111111111";
    expect(campaignUpdateSchema.safeParse({ campaignId }).success).toBe(false);
    expect(
      campaignUpdateSchema.parse({ campaignId, description: "  New notes  " }),
    ).toEqual({ campaignId, description: "New notes" });
  });

  it("normalizes invite email and applies safe invitation defaults", () => {
    const campaignId = "11111111-1111-4111-8111-111111111111";
    expect(
      emailInviteCreationSchema.parse({
        campaignId,
        email: "  PLAYER@EXAMPLE.COM ",
      }),
    ).toMatchObject({ email: "player@example.com", role: "player" });
    expect(linkInviteCreationSchema.parse({ campaignId })).toMatchObject({
      role: "player",
      expiresInDays: 14,
    });
  });

  it("normalizes invite-code entry and requires exactly one invite secret", () => {
    expect(inviteCodeEntrySchema.parse({ code: "abcde-fghjk" })).toEqual({
      code: "ABCDEFGHJK",
    });
    expect(
      inviteReferenceSchema.safeParse({ code: "code", invitationId: "secret" })
        .success,
    ).toBe(false);
  });

  it("rejects recurrence intervals and counts outside their bounds", () => {
    expect(
      structuredRecurrenceSchema.safeParse({ freq: "WEEKLY", interval: 0 })
        .success,
    ).toBe(false);
    expect(
      structuredRecurrenceSchema.safeParse({
        freq: "DAILY",
        interval: 1,
        count: 257,
      }).success,
    ).toBe(false);
  });

  it("does not allow count and until together", () => {
    expect(
      structuredRecurrenceSchema.safeParse({
        freq: "WEEKLY",
        interval: 1,
        count: 4,
        until: "2026-12-01T00:00:00.000Z",
      }).success,
    ).toBe(false);
  });

  it("rejects duplicate weekdays", () => {
    const result = structuredRecurrenceSchema.safeParse({
      freq: "WEEKLY",
      byDay: ["SA", "SA"],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(["byDay"]);
    }
  });

  it("accepts a safe structured schedule but never a raw RRULE", () => {
    const input = {
      recurrence: { freq: "WEEKLY", interval: 2, byDay: ["SA"] },
      startAt: "2026-08-08T23:00:00.000Z",
      timeZone: "America/New_York",
      durationMinutes: 240,
    };
    expect(campaignScheduleSchema.safeParse(input).success).toBe(true);
    expect(
      campaignScheduleSchema.safeParse({
        ...input,
        recurrence: "FREQ=SECONDLY",
      }).success,
    ).toBe(false);
  });

  it("rejects an unknown time zone", () => {
    expect(
      campaignScheduleSchema.safeParse({
        recurrence: { freq: "WEEKLY", interval: 1 },
        startAt: "2026-08-08T23:00:00.000Z",
        timeZone: "Middle/Earth",
        durationMinutes: 240,
      }).success,
    ).toBe(false);
  });

  it("rejects a recurrence that ends before its first session", () => {
    expect(
      campaignScheduleSchema.safeParse({
        recurrence: {
          freq: "WEEKLY",
          until: "2026-08-01T23:00:00.000Z",
        },
        startAt: "2026-08-08T23:00:00.000Z",
        timeZone: "UTC",
        durationMinutes: 180,
      }).success,
    ).toBe(false);
  });

  it("does not coerce an empty recurrence end into a date", () => {
    expect(
      structuredRecurrenceSchema.safeParse({ freq: "DAILY", until: "" })
        .success,
    ).toBe(false);
  });

  it("requires a destination and duration for rescheduled and added occurrences", () => {
    expect(
      occurrenceOverrideSchema.safeParse({
        kind: "rescheduled",
        occurrenceStartAt: "2026-08-08T23:00:00.000Z",
      }).success,
    ).toBe(false);
    expect(
      occurrenceOverrideSchema.safeParse({
        kind: "added",
        occurrenceStartAt: "2026-08-08T23:00:00.000Z",
      }).success,
    ).toBe(false);
  });
});
