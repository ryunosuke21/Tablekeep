"use client";

import { useEffect, useState } from "react";
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

import {
  currentTimeZone,
  toDateTimeLocalValue,
  WEEKDAY_LABELS,
} from "@/lib/campaign-format";
import type {
  RecurrenceFrequency,
  RecurrenceWeekday,
} from "@/server/domain/campaign/schedule";
import { api } from "@/trpc/react";

import { ConfirmActionDialog } from "./confirm-action-dialog";
import type { CampaignSchedulePayload } from "./schedule-summary";

const frequencies: Array<{ value: RecurrenceFrequency; label: string }> = [
  { value: "WEEKLY", label: "Weekly" },
  { value: "DAILY", label: "Daily" },
  { value: "MONTHLY", label: "Monthly" },
];

const weekdays = Object.keys(WEEKDAY_LABELS) as RecurrenceWeekday[];

const intervals = [1, 2, 3, 4] as const;

function intervalLabel(interval: number, freq: RecurrenceFrequency) {
  const unit = freq === "WEEKLY" ? "week" : freq === "DAILY" ? "day" : "month";
  return interval === 1 ? `Every ${unit}` : `Every ${interval} ${unit}s`;
}

/** Set or clear the campaign cadence. Occurrences are derived from it. */
export function ScheduleForm({
  campaignId,
  schedule,
}: {
  campaignId: string;
  schedule: CampaignSchedulePayload;
}) {
  const router = useRouter();
  const zones =
    typeof Intl.supportedValuesOf === "function"
      ? Intl.supportedValuesOf("timeZone")
      : [];
  // The saved zone renders identically on the server and the client. Without
  // one, the browser zone is only read after mount so the markup still matches.
  const [timeZone, setTimeZone] = useState(schedule.timeZone ?? "UTC");
  const [freq, setFreq] = useState<RecurrenceFrequency>(
    schedule.recurrence?.freq ?? "WEEKLY",
  );
  const [interval, setInterval] = useState(schedule.recurrence?.interval ?? 1);
  const [byDay, setByDay] = useState<RecurrenceWeekday[]>(
    schedule.recurrence?.byDay ?? [],
  );
  const [startAt, setStartAt] = useState(
    schedule.startAt
      ? toDateTimeLocalValue(schedule.startAt, schedule.timeZone)
      : "",
  );
  const [durationMinutes, setDurationMinutes] = useState(
    String(schedule.durationMinutes ?? 180),
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (schedule.timeZone) return;

    const browserZone = currentTimeZone();
    setTimeZone(browserZone);
    setStartAt((current) =>
      current === ""
        ? toDateTimeLocalValue(nextEveningIn(browserZone), browserZone)
        : current,
    );
  }, [schedule.timeZone]);

  const setSchedule = api.campaign.schedule.set.useMutation({
    onSuccess: () => {
      toast.success("Session cadence saved");
      router.refresh();
    },
    onError: (mutationError) => setError(mutationError.message),
  });

  const clearSchedule = api.campaign.schedule.clear.useMutation({
    onSuccess: () => {
      toast.success("Session cadence cleared");
      router.refresh();
    },
    onError: (mutationError) => setError(mutationError.message),
  });

  const isPending = setSchedule.isPending || clearSchedule.isPending;

  function submit() {
    setError(null);
    const parsedStart = DateTime.fromISO(startAt, { zone: timeZone });
    const minutes = Number(durationMinutes);

    if (!parsedStart.isValid) {
      setError("Choose the date and time of the first session.");
      return;
    }
    if (!Number.isInteger(minutes) || minutes < 15 || minutes > 1440) {
      setError("Use a session length between 15 and 1440 minutes.");
      return;
    }

    setSchedule.mutate({
      campaignId,
      timeZone,
      durationMinutes: minutes,
      startAt: parsedStart.toJSDate(),
      recurrence: {
        freq,
        interval,
        ...(freq === "WEEKLY" && byDay.length > 0 ? { byDay } : {}),
      },
    });
  }

  return (
    <div className="space-y-5">
      <FieldGroup>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="schedule-freq">Repeats</FieldLabel>
            <NativeSelect
              className="w-full"
              id="schedule-freq"
              value={freq}
              disabled={isPending}
              onChange={(event) =>
                setFreq(event.target.value as RecurrenceFrequency)
              }
            >
              {frequencies.map((option) => (
                <NativeSelectOption key={option.value} value={option.value}>
                  {option.label}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </Field>

          <Field>
            <FieldLabel htmlFor="schedule-interval">How often</FieldLabel>
            <NativeSelect
              className="w-full"
              id="schedule-interval"
              value={interval}
              disabled={isPending}
              onChange={(event) => setInterval(Number(event.target.value))}
            >
              {intervals.map((option) => (
                <NativeSelectOption key={option} value={option}>
                  {intervalLabel(option, freq)}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </Field>
        </div>

        {freq === "WEEKLY" ? (
          <Field>
            <FieldLabel>Days you play</FieldLabel>
            <div className="flex flex-wrap gap-2">
              {weekdays.map((day) => {
                const selected = byDay.includes(day);

                return (
                  <Button
                    key={day}
                    type="button"
                    size="sm"
                    variant={selected ? "default" : "outline"}
                    aria-pressed={selected}
                    disabled={isPending}
                    className={cn("w-12", selected && "font-semibold")}
                    onClick={() =>
                      setByDay((current) =>
                        current.includes(day)
                          ? current.filter((value) => value !== day)
                          : [...current, day],
                      )
                    }
                  >
                    <span className="sr-only">{WEEKDAY_LABELS[day]}</span>
                    <span aria-hidden="true">{day}</span>
                  </Button>
                );
              })}
            </div>
            <FieldDescription>
              Leave empty to use the weekday of the first session.
            </FieldDescription>
          </Field>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="schedule-start">First session</FieldLabel>
            <Input
              id="schedule-start"
              type="datetime-local"
              value={startAt}
              disabled={isPending}
              onChange={(event) => setStartAt(event.target.value)}
            />
            <FieldDescription>Entered in {timeZone}.</FieldDescription>
          </Field>

          <Field>
            <FieldLabel htmlFor="schedule-duration">
              Length in minutes
            </FieldLabel>
            <Input
              id="schedule-duration"
              type="number"
              min={15}
              max={1440}
              step={15}
              value={durationMinutes}
              disabled={isPending}
              onChange={(event) => setDurationMinutes(event.target.value)}
            />
          </Field>
        </div>

        <Field>
          <FieldLabel htmlFor="schedule-zone">Time zone</FieldLabel>
          {zones.length > 0 ? (
            <NativeSelect
              className="w-full"
              id="schedule-zone"
              value={timeZone}
              disabled={isPending}
              onChange={(event) => setTimeZone(event.target.value)}
            >
              {zones.map((zone) => (
                <NativeSelectOption key={zone} value={zone}>
                  {zone}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          ) : (
            <Input
              id="schedule-zone"
              value={timeZone}
              disabled={isPending}
              onChange={(event) => setTimeZone(event.target.value)}
            />
          )}
          <FieldDescription>
            Session times stay put in this zone when clocks change.
          </FieldDescription>
        </Field>
      </FieldGroup>

      <div aria-live="polite" className="min-h-5 text-sm">
        {error ? <p className="text-destructive">{error}</p> : null}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button type="button" onClick={submit} disabled={isPending}>
          <LoadingSwap isLoading={setSchedule.isPending}>
            Save cadence
          </LoadingSwap>
        </Button>

        {schedule.recurrence ? (
          <ConfirmActionDialog
            trigger={
              <Button type="button" variant="outline" disabled={isPending}>
                Clear cadence
              </Button>
            }
            title="Clear the session cadence?"
            consequence="Upcoming recurring sessions disappear from the ledger for everyone in the campaign. Sessions you added by hand stay."
            confirmLabel="Clear cadence"
            isPending={clearSchedule.isPending}
            onConfirm={() => clearSchedule.mutate({ campaignId })}
          />
        ) : null}
      </div>
    </div>
  );
}

function nextEveningIn(timeZone: string) {
  return DateTime.now()
    .setZone(timeZone)
    .plus({ days: 1 })
    .set({ hour: 19, minute: 0, second: 0, millisecond: 0 })
    .toJSDate();
}
