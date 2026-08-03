import type { RecurrenceWeekday } from "@/server/domain/campaign/schedule";

export const CAMPAIGN_ROLE_LABELS = {
  dm: "DM",
  player: "Player",
} as const;

/** Tolerant of role values that arrive typed as a bare string. */
export function roleLabel(role: string) {
  return role === "dm" ? "DM" : "Player";
}

export const CAMPAIGN_COLOR_LABELS = {
  lilac: "Lilac",
  rose: "Rose",
  sage: "Sage",
  sky: "Sky",
} as const;

export const WEEKDAY_LABELS: Record<RecurrenceWeekday, string> = {
  MO: "Monday",
  TU: "Tuesday",
  WE: "Wednesday",
  TH: "Thursday",
  FR: "Friday",
  SA: "Saturday",
  SU: "Sunday",
};

const ORDINAL_INTERVALS: Record<number, string> = {
  1: "Every",
  2: "Every other",
  3: "Every third",
  4: "Every fourth",
};

function formatter(
  timeZone: string | null,
  options: Intl.DateTimeFormatOptions,
) {
  return new Intl.DateTimeFormat("en-US", {
    ...options,
    ...(timeZone ? { timeZone } : {}),
  });
}

export function formatSessionDay(date: Date, timeZone: string | null) {
  return formatter(timeZone, {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(date);
}

export function formatSessionTime(date: Date, timeZone: string | null) {
  return formatter(timeZone, {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function formatSessionRange(
  startsAt: Date,
  endsAt: Date | null,
  timeZone: string | null,
) {
  const start = formatSessionTime(startsAt, timeZone);
  return endsAt ? `${start}–${formatSessionTime(endsAt, timeZone)}` : start;
}

export function formatDateTime(date: Date, timeZone: string | null) {
  return formatter(timeZone, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function formatDate(date: Date, timeZone: string | null = null) {
  return formatter(timeZone, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function formatDuration(minutes: number | null) {
  if (minutes === null) return null;

  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;

  if (hours === 0) return `${rest}m`;
  return rest === 0 ? `${hours}h` : `${hours}h ${rest}m`;
}

type RecurrenceDescription = {
  freq: "DAILY" | "WEEKLY" | "MONTHLY";
  interval: number;
  byDay?: RecurrenceWeekday[];
};

/** A plain-language cadence, e.g. "Every other Saturday". */
export function describeRecurrence(
  recurrence: RecurrenceDescription,
  startAt: Date | null,
  timeZone: string | null,
): string {
  const every = ORDINAL_INTERVALS[recurrence.interval] ?? "Every";
  const days = recurrence.byDay?.length
    ? recurrence.byDay.map((day) => WEEKDAY_LABELS[day]).join(", ")
    : null;

  if (recurrence.freq === "WEEKLY") {
    if (days) return `${every} ${days}`;
    const weekday = startAt
      ? formatter(timeZone, { weekday: "long" }).format(startAt)
      : null;
    return weekday ? `${every} ${weekday}` : `${every} week`;
  }

  if (recurrence.freq === "DAILY") {
    return recurrence.interval === 1 ? "Every day" : `${every} day`;
  }

  const monthDay = startAt
    ? formatter(timeZone, { day: "numeric" }).format(startAt)
    : null;
  return monthDay ? `${every} month on day ${monthDay}` : `${every} month`;
}

/** Display grouping only; the stored value stays the normalized code. */
export function formatInviteCodeDisplay(code: string) {
  return code.replace(/^([A-Z0-9]{5})([A-Z0-9]{5})$/, "$1-$2");
}

export function inviteCodePath(code: string) {
  return `/join/${formatInviteCodeDisplay(code)}`;
}

/** The browser's zone, or a stable fallback on the server. */
export function currentTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

/** Local `datetime-local` input value for a given instant and zone. */
export function toDateTimeLocalValue(
  date: Date,
  timeZone: string | null,
): string {
  const parts = formatter(timeZone, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "00";

  return `${value("year")}-${value("month")}-${value("day")}T${value(
    "hour",
  )}:${value("minute")}`;
}
