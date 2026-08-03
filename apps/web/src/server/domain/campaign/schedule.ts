import { DateTime } from "luxon";
import { RRule } from "rrule";

import {
  CAMPAIGN_SCHEDULE_HORIZON_DAYS,
  MAX_CAMPAIGN_SCHEDULE_OCCURRENCES,
} from "@/lib/constants";

export const RECURRENCE_FREQUENCIES = ["DAILY", "WEEKLY", "MONTHLY"] as const;
export const RECURRENCE_WEEKDAYS = [
  "MO",
  "TU",
  "WE",
  "TH",
  "FR",
  "SA",
  "SU",
] as const;

export type RecurrenceFrequency = (typeof RECURRENCE_FREQUENCIES)[number];
export type RecurrenceWeekday = (typeof RECURRENCE_WEEKDAYS)[number];

export type StructuredRecurrence = {
  freq: RecurrenceFrequency;
  interval: number;
  byDay?: RecurrenceWeekday[];
  until?: Date;
  count?: number;
};

export type CampaignSchedule = {
  recurrence: string | null;
  recurrenceStartAt: Date | null;
  recurrenceTimeZone: string | null;
  recurrenceDurationMinutes: number | null;
};

export type OccurrenceOverride = {
  occurrenceStartAt: Date;
  kind: "cancelled" | "rescheduled" | "added";
  startsAt?: Date | null;
  durationMinutes?: number | null;
};

export type ResolvedOccurrence = {
  startsAt: Date;
  endsAt: Date | null;
  timeZone: string;
};

const FREQUENCY_TO_RRULE = {
  DAILY: RRule.DAILY,
  WEEKLY: RRule.WEEKLY,
  MONTHLY: RRule.MONTHLY,
} as const;

const RRULE_TO_FREQUENCY = new Map<number, RecurrenceFrequency>([
  [RRule.DAILY, "DAILY"],
  [RRule.WEEKLY, "WEEKLY"],
  [RRule.MONTHLY, "MONTHLY"],
]);

const WEEKDAY_TO_RRULE = {
  MO: RRule.MO,
  TU: RRule.TU,
  WE: RRule.WE,
  TH: RRule.TH,
  FR: RRule.FR,
  SA: RRule.SA,
  SU: RRule.SU,
} as const;

export function isSupportedTimeZone(timeZone: string): boolean {
  if (typeof Intl.supportedValuesOf === "function") {
    return Intl.supportedValuesOf("timeZone").includes(timeZone);
  }

  try {
    new Intl.DateTimeFormat("en-US", { timeZone }).format();
    return true;
  } catch {
    return false;
  }
}

/** Serialize only the safe RRULE body; DTSTART and TZID live in separate columns. */
export function serializeRecurrence(recurrence: StructuredRecurrence): string {
  const rule = new RRule({
    freq: FREQUENCY_TO_RRULE[recurrence.freq],
    interval: recurrence.interval,
    byweekday: recurrence.byDay?.map((day) => WEEKDAY_TO_RRULE[day]),
    until: recurrence.until,
    count: recurrence.count,
  });

  return rule.toString().replace(/^RRULE:/, "");
}

export function deserializeRecurrence(value: string): StructuredRecurrence {
  const options = RRule.parseString(value.replace(/^RRULE:/, ""));
  const freq =
    options.freq === undefined
      ? undefined
      : RRULE_TO_FREQUENCY.get(options.freq);
  if (!freq) throw new Error("Unsupported campaign recurrence frequency.");

  const parsedWeekdays = options.byweekday
    ? Array.isArray(options.byweekday)
      ? options.byweekday
      : [options.byweekday]
    : [];
  const byDay = parsedWeekdays.map((weekday): RecurrenceWeekday => {
    const day =
      typeof weekday === "number"
        ? RECURRENCE_WEEKDAYS[weekday]
        : (weekday.toString() as RecurrenceWeekday);
    if (!day) throw new Error("Unsupported campaign recurrence weekday.");
    return day;
  });
  if (byDay?.some((day) => !RECURRENCE_WEEKDAYS.includes(day))) {
    throw new Error("Unsupported campaign recurrence weekday.");
  }

  return {
    freq,
    interval: options.interval ?? 1,
    ...(byDay?.length ? { byDay } : {}),
    ...(options.until ? { until: options.until } : {}),
    ...(options.count ? { count: options.count } : {}),
  };
}

/** Parse and validate the normalized RFC 5545 rule accepted by the API. */
export const parseRecurrenceRule = deserializeRecurrence;

export function assertCompleteSchedule(schedule: CampaignSchedule): void {
  const values = [
    schedule.recurrence,
    schedule.recurrenceStartAt,
    schedule.recurrenceTimeZone,
  ];
  const populated = values.filter((value) => value !== null).length;
  if (populated !== 0 && populated !== values.length) {
    throw new Error(
      "A campaign schedule must provide its rule, start, and time zone together.",
    );
  }
}

function floatingDate(date: Date, timeZone: string): Date {
  const local = DateTime.fromJSDate(date, { zone: timeZone });
  if (!local.isValid)
    throw new Error("Invalid campaign schedule date or time zone.");
  return new Date(
    Date.UTC(
      local.year,
      local.month - 1,
      local.day,
      local.hour,
      local.minute,
      local.second,
      local.millisecond,
    ),
  );
}

function floatingDateToInstant(date: Date, timeZone: string): Date {
  const local = DateTime.fromObject(
    {
      year: date.getUTCFullYear(),
      month: date.getUTCMonth() + 1,
      day: date.getUTCDate(),
      hour: date.getUTCHours(),
      minute: date.getUTCMinutes(),
      second: date.getUTCSeconds(),
      millisecond: date.getUTCMilliseconds(),
    },
    { zone: timeZone },
  );
  if (!local.isValid)
    throw new Error("The recurrence produced an invalid local date.");
  return local.toJSDate();
}

export function expandScheduleOccurrences(
  schedule: CampaignSchedule,
  context: {
    from: Date;
    horizon: Date;
    countCeiling?: number;
  },
): Date[] {
  assertCompleteSchedule(schedule);
  if (
    schedule.recurrence === null ||
    schedule.recurrenceStartAt === null ||
    schedule.recurrenceTimeZone === null
  ) {
    return [];
  }
  if (!isSupportedTimeZone(schedule.recurrenceTimeZone)) {
    throw new Error("Unsupported campaign schedule time zone.");
  }
  const timeZone = schedule.recurrenceTimeZone;

  const recurrence = deserializeRecurrence(schedule.recurrence);
  if (
    recurrence.interval < 1 ||
    recurrence.interval > 52 ||
    (recurrence.count !== undefined &&
      (recurrence.count < 1 ||
        recurrence.count > MAX_CAMPAIGN_SCHEDULE_OCCURRENCES))
  ) {
    throw new Error("Campaign recurrence exceeds its safe expansion bounds.");
  }
  const rule = new RRule({
    freq: FREQUENCY_TO_RRULE[recurrence.freq],
    interval: recurrence.interval,
    byweekday: recurrence.byDay?.map((day) => WEEKDAY_TO_RRULE[day]),
    count: recurrence.count,
    until: recurrence.until
      ? floatingDate(recurrence.until, timeZone)
      : undefined,
    dtstart: floatingDate(schedule.recurrenceStartAt, timeZone),
  });

  const ceiling = Math.min(
    Math.max(1, context.countCeiling ?? MAX_CAMPAIGN_SCHEDULE_OCCURRENCES),
    MAX_CAMPAIGN_SCHEDULE_OCCURRENCES,
  );
  const candidates = rule
    .between(
      floatingDate(context.from, timeZone),
      floatingDate(context.horizon, timeZone),
      true,
    )
    .slice(0, ceiling);

  return candidates.map((date) => floatingDateToInstant(date, timeZone));
}

export function resolveNextOccurrence(
  schedule: CampaignSchedule,
  overrides: OccurrenceOverride[],
  context: { now: Date; horizon?: Date },
): ResolvedOccurrence | null {
  assertCompleteSchedule(schedule);
  const horizon =
    context.horizon ??
    DateTime.fromJSDate(context.now)
      .plus({ days: CAMPAIGN_SCHEDULE_HORIZON_DAYS })
      .toJSDate();
  const durationMinutes = schedule.recurrenceDurationMinutes;
  // A recent original occurrence may have been moved forward into the horizon.
  // Keep the lookback bounded to the same horizon used for forward expansion.
  const expansionStart = DateTime.fromJSDate(context.now)
    .minus({ days: CAMPAIGN_SCHEDULE_HORIZON_DAYS })
    .toJSDate();
  const overrideByOriginalStart = new Map(
    overrides
      .filter((override) => override.kind !== "added")
      .map((override) => [override.occurrenceStartAt.getTime(), override]),
  );

  const generated = expandScheduleOccurrences(schedule, {
    from: expansionStart,
    horizon,
  }).flatMap((originalStart) => {
    const override = overrideByOriginalStart.get(originalStart.getTime());
    if (override?.kind === "cancelled") return [];
    const startsAt =
      override?.kind === "rescheduled" ? override.startsAt : originalStart;
    if (!startsAt) return [];
    return [
      {
        startsAt,
        durationMinutes: override?.durationMinutes ?? durationMinutes,
      },
    ];
  });

  const added = overrides
    .filter((override) => override.kind === "added")
    .map((override) => ({
      startsAt: override.occurrenceStartAt,
      durationMinutes: override.durationMinutes ?? durationMinutes,
    }));

  const timeZone = schedule.recurrenceTimeZone ?? "UTC";
  return (
    [...generated, ...added]
      .map(({ startsAt, durationMinutes: occurrenceDuration }) => ({
        startsAt,
        endsAt:
          occurrenceDuration === null
            ? null
            : new Date(startsAt.getTime() + occurrenceDuration * 60_000),
        timeZone,
      }))
      .filter(
        (occurrence) =>
          (occurrence.endsAt ?? occurrence.startsAt).getTime() >=
            context.now.getTime() &&
          occurrence.startsAt.getTime() <= horizon.getTime(),
      )
      .sort(
        (left, right) => left.startsAt.getTime() - right.startsAt.getTime(),
      )[0] ?? null
  );
}

export function isGeneratedOccurrence(
  schedule: CampaignSchedule,
  occurrenceStartAt: Date,
): boolean {
  const oneMillisecondBefore = new Date(occurrenceStartAt.getTime() - 1);
  return expandScheduleOccurrences(schedule, {
    from: oneMillisecondBefore,
    horizon: occurrenceStartAt,
    countCeiling: 1,
  }).some((occurrence) => occurrence.getTime() === occurrenceStartAt.getTime());
}
