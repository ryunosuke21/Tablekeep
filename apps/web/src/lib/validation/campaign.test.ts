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
  recurrenceRuleSchema,
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

  it("accepts a bounded RRULE schedule", () => {
    const input = {
      recurrenceRule: "FREQ=WEEKLY;INTERVAL=2;BYDAY=SA",
      startAt: "2026-08-08T23:00:00.000Z",
      timeZone: "America/New_York",
    };
    expect(campaignScheduleSchema.safeParse(input).success).toBe(true);
    expect(
      campaignScheduleSchema.safeParse({
        ...input,
        recurrenceRule: "FREQ=SECONDLY",
      }).success,
    ).toBe(false);
    expect(recurrenceRuleSchema.safeParse("FREQ=DAILY;COUNT=257").success).toBe(
      false,
    );
  });

  it("rejects an unknown time zone", () => {
    expect(
      campaignScheduleSchema.safeParse({
        recurrenceRule: "FREQ=WEEKLY;INTERVAL=1",
        startAt: "2026-08-08T23:00:00.000Z",
        timeZone: "Middle/Earth",
      }).success,
    ).toBe(false);
  });

  it("requires a destination for rescheduled occurrences and allows timeless added sessions", () => {
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
    ).toBe(true);
  });
});
