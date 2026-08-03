"use client";

import { useEffect, useMemo, useState } from "react";
import { DateTime } from "luxon";
import { useRouter } from "next/navigation";

import { Button } from "@tablekeep/ui/components/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@tablekeep/ui/components/field";
import { Input } from "@tablekeep/ui/components/input";
import { LoadingSwap } from "@tablekeep/ui/components/loading-swap";
import {
  NativeSelect,
  NativeSelectOption,
} from "@tablekeep/ui/components/native-select";
import { toast } from "@tablekeep/ui/components/sonner";
import { cn } from "@tablekeep/ui/lib/utils";

import { currentTimeZone, WEEKDAY_LABELS } from "@/lib/campaign-format";
import {
  type RecurrenceFrequency,
  type RecurrenceWeekday,
  serializeRecurrence,
} from "@/server/domain/campaign/schedule";
import { api } from "@/trpc/react";

import { ConfirmActionDialog } from "./confirm-action-dialog";
import type { CampaignSchedulePayload } from "./schedule-summary";

type RepeatChoice = "daily" | "weekdays" | "weekly" | "monthly" | "custom";

const weekdays = Object.keys(WEEKDAY_LABELS) as RecurrenceWeekday[];
const luxonWeekday: Record<number, RecurrenceWeekday> = {
  1: "MO",
  2: "TU",
  3: "WE",
  4: "TH",
  5: "FR",
  6: "SA",
  7: "SU",
};

function timeValue(date: Date | null, timeZone: string | null) {
  const value = date
    ? DateTime.fromJSDate(date, { zone: timeZone ?? undefined })
    : DateTime.now()
        .setZone(timeZone ?? undefined)
        .plus({ days: 1 })
        .set({ hour: 19, minute: 0 });
  return value.toFormat("HH:mm");
}

function initialChoice(schedule: CampaignSchedulePayload): RepeatChoice {
  const recurrence = schedule.recurrence;
  if (!recurrence) return "weekly";
  if (recurrence.interval !== 1) return "custom";
  if (recurrence.freq === "DAILY") return "daily";
  if (recurrence.freq === "MONTHLY") return "monthly";
  if (recurrence.byDay?.join(",") === "MO,TU,WE,TH,FR") return "weekdays";
  return recurrence.byDay && recurrence.byDay.length > 1 ? "custom" : "weekly";
}

function anchorFor(
  time: string,
  timeZone: string,
  byDay?: RecurrenceWeekday[],
) {
  const [hour = 19, minute = 0] = time.split(":").map(Number);
  let anchor = DateTime.now()
    .setZone(timeZone)
    .set({ hour, minute, second: 0, millisecond: 0 });
  if (anchor <= DateTime.now().setZone(timeZone))
    anchor = anchor.plus({ days: 1 });
  if (byDay?.length) {
    for (let offset = 0; offset < 7; offset += 1) {
      const candidate = anchor.plus({ days: offset });
      if (byDay.includes(luxonWeekday[candidate.weekday] ?? "MO"))
        return candidate;
    }
  }
  return anchor;
}

export function ScheduleForm({
  campaignId,
  schedule,
}: {
  campaignId: string;
  schedule: CampaignSchedulePayload;
}) {
  const router = useRouter();
  const [timeZone, setTimeZone] = useState(schedule.timeZone ?? "UTC");
  const [time, setTime] = useState(() =>
    timeValue(schedule.startAt, schedule.timeZone),
  );
  const [repeat, setRepeat] = useState<RepeatChoice>(() =>
    initialChoice(schedule),
  );
  const [frequency, setFrequency] = useState<RecurrenceFrequency>(
    schedule.recurrence?.freq ?? "WEEKLY",
  );
  const [interval, setInterval] = useState(schedule.recurrence?.interval ?? 1);
  const [byDay, setByDay] = useState<RecurrenceWeekday[]>(
    schedule.recurrence?.byDay ?? [],
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setTimeZone(currentTimeZone());
  }, []);

  const displayAnchor = schedule.startAt
    ? DateTime.fromJSDate(schedule.startAt).setZone(timeZone)
    : DateTime.now().setZone(timeZone);
  const localDay =
    schedule.recurrence?.byDay?.[0] ??
    luxonWeekday[displayAnchor.weekday] ??
    "MO";
  const localDayLabel = WEEKDAY_LABELS[localDay];
  const localDate = displayAnchor.day;
  const repeatOptions = useMemo(
    () =>
      [
        { value: "daily", label: "Every day" },
        { value: "weekdays", label: "Every weekday (Monday to Friday)" },
        { value: "weekly", label: `Every week on ${localDayLabel}` },
        { value: "monthly", label: `Every month on day ${localDate}` },
        { value: "custom", label: "Custom…" },
      ] satisfies Array<{ value: RepeatChoice; label: string }>,
    [localDate, localDayLabel],
  );

  const setSchedule = api.campaign.schedule.set.useMutation({
    onSuccess: () => {
      toast.success("Schedule saved");
      router.refresh();
    },
    onError: (mutationError) => setError(mutationError.message),
  });
  const clearSchedule = api.campaign.schedule.clear.useMutation({
    onSuccess: () => {
      toast.success("Schedule cleared");
      router.refresh();
    },
    onError: (mutationError) => setError(mutationError.message),
  });
  const isPending = setSchedule.isPending || clearSchedule.isPending;

  function submit() {
    setError(null);
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) {
      setError("Choose a valid start time.");
      return;
    }

    const recurrence =
      repeat === "daily"
        ? { freq: "DAILY" as const, interval: 1 }
        : repeat === "weekdays"
          ? {
              freq: "WEEKLY" as const,
              interval: 1,
              byDay: ["MO", "TU", "WE", "TH", "FR"] as RecurrenceWeekday[],
            }
          : repeat === "weekly"
            ? { freq: "WEEKLY" as const, interval: 1, byDay: [localDay] }
            : repeat === "monthly"
              ? { freq: "MONTHLY" as const, interval: 1 }
              : {
                  freq: frequency,
                  interval,
                  ...(frequency === "WEEKLY" && byDay.length ? { byDay } : {}),
                };
    const startAt = anchorFor(time, timeZone, recurrence.byDay).toJSDate();

    setSchedule.mutate({
      campaignId,
      recurrenceRule: serializeRecurrence(recurrence),
      startAt,
      timeZone,
    });
  }

  return (
    <div className="space-y-6">
      <FieldGroup>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="schedule-time">Session starts at</FieldLabel>
            <Input
              id="schedule-time"
              type="time"
              value={time}
              disabled={isPending}
              onChange={(event) => setTime(event.target.value)}
            />
            <FieldDescription>
              Times use your device time zone ({timeZone}).
            </FieldDescription>
          </Field>

          <Field>
            <FieldLabel htmlFor="schedule-repeat">Repeats</FieldLabel>
            <NativeSelect
              id="schedule-repeat"
              className="w-full"
              value={repeat}
              disabled={isPending}
              onChange={(event) =>
                setRepeat(event.target.value as RepeatChoice)
              }
            >
              {repeatOptions.map((option) => (
                <NativeSelectOption key={option.value} value={option.value}>
                  {option.label}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </Field>
        </div>

        {repeat === "custom" ? (
          <div className="rounded-xl border bg-muted/25 p-4 sm:p-5">
            <div className="grid gap-4 sm:grid-cols-[1fr_1fr]">
              <Field>
                <FieldLabel htmlFor="custom-frequency">Repeat every</FieldLabel>
                <div className="grid grid-cols-[5rem_1fr] gap-2">
                  <Input
                    id="custom-interval"
                    type="number"
                    min={1}
                    max={52}
                    value={interval}
                    onChange={(event) =>
                      setInterval(Number(event.target.value))
                    }
                  />
                  <NativeSelect
                    id="custom-frequency"
                    value={frequency}
                    onChange={(event) =>
                      setFrequency(event.target.value as RecurrenceFrequency)
                    }
                  >
                    <NativeSelectOption value="DAILY">days</NativeSelectOption>
                    <NativeSelectOption value="WEEKLY">
                      weeks
                    </NativeSelectOption>
                    <NativeSelectOption value="MONTHLY">
                      months
                    </NativeSelectOption>
                  </NativeSelect>
                </div>
              </Field>
            </div>

            {frequency === "WEEKLY" ? (
              <Field className="mt-5">
                <FieldLabel>Repeat on</FieldLabel>
                <div className="flex flex-wrap gap-2">
                  {weekdays.map((day) => {
                    const selected = byDay.includes(day);
                    return (
                      <Button
                        key={day}
                        type="button"
                        size="icon-sm"
                        variant={selected ? "default" : "outline"}
                        aria-label={WEEKDAY_LABELS[day]}
                        aria-pressed={selected}
                        className={cn(
                          "rounded-full",
                          selected && "font-semibold",
                        )}
                        onClick={() =>
                          setByDay((current) =>
                            current.includes(day)
                              ? current.filter((value) => value !== day)
                              : [...current, day],
                          )
                        }
                      >
                        {WEEKDAY_LABELS[day].slice(0, 1)}
                      </Button>
                    );
                  })}
                </div>
              </Field>
            ) : null}
          </div>
        ) : null}
      </FieldGroup>

      <div aria-live="polite" className="min-h-5 text-sm">
        {error ? <p className="text-destructive">{error}</p> : null}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button type="button" onClick={submit} disabled={isPending}>
          <LoadingSwap isLoading={setSchedule.isPending}>
            Save schedule
          </LoadingSwap>
        </Button>
        {schedule.recurrence ? (
          <ConfirmActionDialog
            trigger={
              <Button type="button" variant="outline" disabled={isPending}>
                Clear schedule
              </Button>
            }
            title="Clear the schedule?"
            consequence="Upcoming repeating sessions disappear for everyone. One-off sessions stay."
            confirmLabel="Clear schedule"
            isPending={clearSchedule.isPending}
            onConfirm={() => clearSchedule.mutate({ campaignId })}
          />
        ) : null}
      </div>
    </div>
  );
}
