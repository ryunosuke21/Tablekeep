import { DateTime } from "luxon";
import { describe, expect, it } from "vitest";

import {
  assertCompleteSchedule,
  type CampaignSchedule,
  deserializeRecurrence,
  expandScheduleOccurrences,
  resolveNextOccurrence,
  serializeRecurrence,
} from "./schedule";

const newYorkSchedule: CampaignSchedule = {
  recurrence: serializeRecurrence({
    freq: "WEEKLY",
    interval: 1,
    byDay: ["SA"],
  }),
  recurrenceStartAt: DateTime.fromISO("2026-02-28T19:00", {
    zone: "America/New_York",
  }).toJSDate(),
  recurrenceTimeZone: "America/New_York",
  recurrenceDurationMinutes: 240,
};

describe("campaign schedules", () => {
  it("round-trips a bounded structured recurrence", () => {
    expect(
      deserializeRecurrence(
        serializeRecurrence({
          freq: "WEEKLY",
          interval: 2,
          byDay: ["SA"],
          count: 6,
        }),
      ),
    ).toMatchObject({ freq: "WEEKLY", interval: 2, byDay: ["SA"], count: 6 });
  });

  it("keeps local wall-clock time while crossing DST", () => {
    const occurrences = expandScheduleOccurrences(newYorkSchedule, {
      from: new Date("2026-02-28T00:00:00.000Z"),
      horizon: new Date("2026-03-16T00:00:00.000Z"),
    });

    expect(occurrences.map((date) => date.toISOString())).toEqual([
      "2026-03-01T00:00:00.000Z",
      "2026-03-08T00:00:00.000Z",
      "2026-03-14T23:00:00.000Z",
    ]);
    expect(
      occurrences.map((date) =>
        DateTime.fromJSDate(date, { zone: "America/New_York" }).toFormat(
          "HH:mm",
        ),
      ),
    ).toEqual(["19:00", "19:00", "19:00"]);
  });

  it("drops one cancelled occurrence and advances to its neighbour", () => {
    const cancelled = new Date("2026-03-08T00:00:00.000Z");
    expect(
      resolveNextOccurrence(
        newYorkSchedule,
        [{ kind: "cancelled", occurrenceStartAt: cancelled }],
        {
          now: new Date("2026-03-02T00:00:00.000Z"),
          horizon: new Date("2026-03-20T00:00:00.000Z"),
        },
      )?.startsAt.toISOString(),
    ).toBe("2026-03-14T23:00:00.000Z");
  });

  it("reschedules one occurrence without moving its neighbours", () => {
    expect(
      resolveNextOccurrence(
        newYorkSchedule,
        [
          {
            kind: "rescheduled",
            occurrenceStartAt: new Date("2026-03-08T00:00:00.000Z"),
            startsAt: new Date("2026-03-10T01:00:00.000Z"),
          },
        ],
        {
          now: new Date("2026-03-02T00:00:00.000Z"),
          horizon: new Date("2026-03-20T00:00:00.000Z"),
        },
      )?.startsAt.toISOString(),
    ).toBe("2026-03-10T01:00:00.000Z");
  });

  it("finds a recent past occurrence rescheduled into the future", () => {
    expect(
      resolveNextOccurrence(
        newYorkSchedule,
        [
          {
            kind: "rescheduled",
            occurrenceStartAt: new Date("2026-03-08T00:00:00.000Z"),
            startsAt: new Date("2026-03-12T01:00:00.000Z"),
          },
        ],
        {
          now: new Date("2026-03-10T00:00:00.000Z"),
          horizon: new Date("2026-03-20T00:00:00.000Z"),
        },
      )?.startsAt.toISOString(),
    ).toBe("2026-03-12T01:00:00.000Z");
  });

  it("returns an added one-off occurrence without a recurrence rule", () => {
    expect(
      resolveNextOccurrence(
        {
          recurrence: null,
          recurrenceStartAt: null,
          recurrenceTimeZone: null,
          recurrenceDurationMinutes: null,
        },
        [
          {
            kind: "added",
            occurrenceStartAt: new Date("2026-08-10T01:00:00.000Z"),
            durationMinutes: 180,
          },
        ],
        { now: new Date("2026-08-03T00:00:00.000Z") },
      ),
    ).toEqual({
      startsAt: new Date("2026-08-10T01:00:00.000Z"),
      endsAt: new Date("2026-08-10T04:00:00.000Z"),
      timeZone: "UTC",
    });
  });

  it("returns null for a campaign with no rule or overrides", () => {
    expect(
      resolveNextOccurrence(
        {
          recurrence: null,
          recurrenceStartAt: null,
          recurrenceTimeZone: null,
          recurrenceDurationMinutes: null,
        },
        [],
        { now: new Date("2026-08-03T00:00:00.000Z") },
      ),
    ).toBeNull();
  });

  it("keeps an in-progress occurrence as the next session", () => {
    const occurrence = resolveNextOccurrence(newYorkSchedule, [], {
      now: new Date("2026-03-08T01:00:00.000Z"),
      horizon: new Date("2026-03-20T00:00:00.000Z"),
    });
    expect(occurrence?.startsAt.toISOString()).toBe("2026-03-08T00:00:00.000Z");
  });

  it("rejects a partial schedule", () => {
    expect(() =>
      assertCompleteSchedule({
        recurrence: "FREQ=WEEKLY",
        recurrenceStartAt: null,
        recurrenceTimeZone: null,
        recurrenceDurationMinutes: null,
      }),
    ).toThrow(/must provide/i);
  });
});
