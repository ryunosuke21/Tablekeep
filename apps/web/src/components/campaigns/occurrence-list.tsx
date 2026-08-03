"use client";

import { useEffect, useState } from "react";
import { IconCalendarPlus } from "@tabler/icons-react";
import { DateTime } from "luxon";
import { useRouter } from "next/navigation";

import { Badge } from "@tablekeep/ui/components/badge";
import { Button } from "@tablekeep/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@tablekeep/ui/components/dialog";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@tablekeep/ui/components/field";
import { Input } from "@tablekeep/ui/components/input";
import { LoadingSwap } from "@tablekeep/ui/components/loading-swap";
import { toast } from "@tablekeep/ui/components/sonner";

import {
  currentTimeZone,
  formatDuration,
  formatSessionDay,
  formatSessionRange,
  toDateTimeLocalValue,
} from "@/lib/campaign-format";
import { api } from "@/trpc/react";

import { ConfirmActionDialog } from "./confirm-action-dialog";
import type { CampaignSchedulePayload } from "./schedule-summary";

type Occurrence = CampaignSchedulePayload["occurrences"][number];

function stampFor(state: Occurrence["state"]) {
  switch (state) {
    case "cancelled":
      return { label: "Cancelled", variant: "destructive" as const };
    case "rescheduled":
      return { label: "Moved", variant: "outline" as const };
    case "added":
      return { label: "Added", variant: "outline" as const };
    default:
      return { label: "Scheduled", variant: "secondary" as const };
  }
}

function toInstant(value: string, timeZone: string) {
  const parsed = DateTime.fromISO(value, { zone: timeZone });
  return parsed.isValid ? parsed.toJSDate() : null;
}

function OccurrenceDialog({
  open,
  onOpenChange,
  title,
  description,
  submitLabel,
  isPending,
  defaultValue,
  defaultDuration,
  timeZone,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  submitLabel: string;
  isPending: boolean;
  defaultValue: string;
  defaultDuration: number;
  timeZone: string;
  onSubmit: (values: {
    startsAt: Date;
    durationMinutes: number;
    title: string;
  }) => void;
}) {
  const [value, setValue] = useState(defaultValue);
  const [duration, setDuration] = useState(String(defaultDuration));
  const [label, setLabel] = useState("");
  const [error, setError] = useState<string | null>(null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <FieldGroup className="my-4">
          <Field>
            <FieldLabel htmlFor="occurrence-start">Date and time</FieldLabel>
            <Input
              id="occurrence-start"
              type="datetime-local"
              value={value}
              onChange={(event) => setValue(event.target.value)}
              disabled={isPending}
            />
            <FieldDescription>
              Entered in {timeZone}, the campaign&apos;s time zone.
            </FieldDescription>
          </Field>

          <Field>
            <FieldLabel htmlFor="occurrence-duration">
              Length in minutes
            </FieldLabel>
            <Input
              id="occurrence-duration"
              type="number"
              min={15}
              max={1440}
              step={15}
              value={duration}
              onChange={(event) => setDuration(event.target.value)}
              disabled={isPending}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="occurrence-title">Label (optional)</FieldLabel>
            <Input
              id="occurrence-title"
              value={label}
              maxLength={80}
              placeholder="Finale"
              onChange={(event) => setLabel(event.target.value)}
              disabled={isPending}
            />
          </Field>
        </FieldGroup>

        <div aria-live="polite" className="min-h-5 text-sm">
          {error ? <p className="text-destructive">{error}</p> : null}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={isPending}
            onClick={() => {
              const startsAt = toInstant(value, timeZone);
              const durationMinutes = Number(duration);

              if (!startsAt) {
                setError("Choose a valid date and time.");
                return;
              }
              if (
                !Number.isInteger(durationMinutes) ||
                durationMinutes < 15 ||
                durationMinutes > 1440
              ) {
                setError("Use a length between 15 and 1440 minutes.");
                return;
              }

              setError(null);
              onSubmit({
                startsAt,
                durationMinutes,
                title: label.trim(),
              });
            }}
          >
            <LoadingSwap isLoading={isPending}>{submitLabel}</LoadingSwap>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * The session ledger: generated occurrences with their exceptions in place, so
 * a DM can see at a glance which weeks moved and which are off.
 */
export function OccurrenceList({
  campaignId,
  schedule,
  canManage,
}: {
  campaignId: string;
  schedule: CampaignSchedulePayload;
  canManage: boolean;
}) {
  const router = useRouter();
  const defaultDuration = schedule.durationMinutes ?? 180;
  const [moving, setMoving] = useState<Occurrence | null>(null);
  const [adding, setAdding] = useState(false);
  // A campaign with no cadence has no zone of its own. Read the browser zone
  // after mount so the server-rendered markup and the first client render match.
  const [timeZone, setTimeZone] = useState(schedule.timeZone ?? "UTC");

  useEffect(() => {
    if (!schedule.timeZone) {
      setTimeZone(currentTimeZone());
    }
  }, [schedule.timeZone]);

  const override = api.campaign.schedule.override.useMutation({
    onSuccess: () => {
      setMoving(null);
      setAdding(false);
      router.refresh();
    },
    onError: (error) => {
      toast.error("The session was not updated", {
        description: error.message,
      });
    },
  });

  const removeOverride = api.campaign.schedule.removeOverride.useMutation({
    onSuccess: () => {
      router.refresh();
    },
    onError: (error) => {
      toast.error("The session was not updated", {
        description: error.message,
      });
    },
  });

  const isPending = override.isPending || removeOverride.isPending;

  if (schedule.occurrences.length === 0 && !canManage) {
    return (
      <p className="text-muted-foreground text-sm">
        No sessions in the next 90 days. Your DM sets the cadence.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {schedule.occurrences.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          No sessions in the next 90 days. Set a cadence in Settings, or add a
          single session below.
        </p>
      ) : null}
      <ol
        className={
          schedule.occurrences.length > 0 ? "divide-y border-y" : "hidden"
        }
      >
        {schedule.occurrences.map((occurrence) => {
          const stamp = stampFor(occurrence.state);
          const shownStart =
            occurrence.startsAt ?? occurrence.occurrenceStartAt;
          const length = formatDuration(occurrence.durationMinutes);

          return (
            <li
              key={occurrence.occurrenceStartAt.toISOString()}
              className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={
                      occurrence.state === "cancelled"
                        ? "text-muted-foreground text-sm line-through"
                        : "font-medium text-sm"
                    }
                  >
                    {formatSessionDay(shownStart, timeZone)}
                  </span>
                  <Badge variant={stamp.variant}>{stamp.label}</Badge>
                  {occurrence.title ? (
                    <span className="text-muted-foreground text-sm">
                      {occurrence.title}
                    </span>
                  ) : null}
                </div>
                <p className="mt-0.5 text-muted-foreground text-xs tabular-nums">
                  {occurrence.state === "cancelled"
                    ? "Not playing"
                    : formatSessionRange(
                        shownStart,
                        occurrence.endsAt,
                        timeZone,
                      )}
                  {length && occurrence.state !== "cancelled"
                    ? ` · ${length}`
                    : ""}
                  {occurrence.state === "rescheduled"
                    ? ` · moved from ${formatSessionDay(
                        occurrence.occurrenceStartAt,
                        timeZone,
                      )}`
                    : ""}
                </p>
                {occurrence.notes ? (
                  <p className="mt-1 text-muted-foreground text-xs">
                    {occurrence.notes}
                  </p>
                ) : null}
              </div>

              {canManage ? (
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  {occurrence.state === "scheduled" ? (
                    <>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isPending}
                        onClick={() => setMoving(occurrence)}
                      >
                        Move
                      </Button>
                      <ConfirmActionDialog
                        trigger={
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={isPending}
                          >
                            Cancel session
                          </Button>
                        }
                        title="Cancel this session?"
                        consequence={`${formatSessionDay(
                          shownStart,
                          timeZone,
                        )} will show as cancelled for everyone in the campaign, and the next session becomes the one after it.`}
                        confirmLabel="Cancel session"
                        cancelLabel="Keep the session"
                        isPending={override.isPending}
                        onConfirm={() =>
                          override.mutate({
                            campaignId,
                            override: {
                              kind: "cancelled",
                              occurrenceStartAt: occurrence.occurrenceStartAt,
                            },
                          })
                        }
                      />
                    </>
                  ) : null}

                  {occurrence.state === "rescheduled" ? (
                    <>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isPending}
                        onClick={() => setMoving(occurrence)}
                      >
                        Move again
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={isPending}
                        onClick={() =>
                          removeOverride.mutate({
                            campaignId,
                            occurrenceStartAt: occurrence.occurrenceStartAt,
                          })
                        }
                      >
                        Undo move
                      </Button>
                    </>
                  ) : null}

                  {occurrence.state === "cancelled" ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isPending}
                      onClick={() =>
                        removeOverride.mutate({
                          campaignId,
                          occurrenceStartAt: occurrence.occurrenceStartAt,
                        })
                      }
                    >
                      Put it back
                    </Button>
                  ) : null}

                  {occurrence.state === "added" ? (
                    <ConfirmActionDialog
                      trigger={
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={isPending}
                        >
                          Remove
                        </Button>
                      }
                      title="Remove this session?"
                      consequence={`${formatSessionDay(
                        shownStart,
                        timeZone,
                      )} was added by hand. Removing it takes it off the ledger for everyone.`}
                      confirmLabel="Remove session"
                      isPending={removeOverride.isPending}
                      onConfirm={() =>
                        removeOverride.mutate({
                          campaignId,
                          occurrenceStartAt: occurrence.occurrenceStartAt,
                        })
                      }
                    />
                  ) : null}
                </div>
              ) : null}
            </li>
          );
        })}
      </ol>

      {canManage ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isPending}
          onClick={() => setAdding(true)}
        >
          <IconCalendarPlus />
          Add a session
        </Button>
      ) : null}

      {moving ? (
        <OccurrenceDialog
          key={`move-${moving.occurrenceStartAt.toISOString()}`}
          open
          onOpenChange={(next) => {
            if (!next) setMoving(null);
          }}
          title="Move this session"
          description={`Originally ${formatSessionDay(
            moving.occurrenceStartAt,
            timeZone,
          )}. Everyone in the campaign sees the new time.`}
          submitLabel="Move session"
          isPending={override.isPending}
          defaultValue={toDateTimeLocalValue(
            moving.startsAt ?? moving.occurrenceStartAt,
            timeZone,
          )}
          defaultDuration={moving.durationMinutes ?? defaultDuration}
          timeZone={timeZone}
          onSubmit={({ startsAt, durationMinutes, title }) =>
            override.mutate({
              campaignId,
              override: {
                kind: "rescheduled",
                occurrenceStartAt: moving.occurrenceStartAt,
                startsAt,
                durationMinutes,
                ...(title ? { title } : {}),
              },
            })
          }
        />
      ) : null}

      {adding ? (
        <OccurrenceDialog
          key="add"
          open
          onOpenChange={setAdding}
          title="Add a session"
          description="A one-off session outside the usual cadence."
          submitLabel="Add session"
          isPending={override.isPending}
          defaultValue={toDateTimeLocalValue(new Date(), timeZone)}
          defaultDuration={defaultDuration}
          timeZone={timeZone}
          onSubmit={({ startsAt, durationMinutes, title }) =>
            override.mutate({
              campaignId,
              override: {
                kind: "added",
                occurrenceStartAt: startsAt,
                durationMinutes,
                ...(title ? { title } : {}),
              },
            })
          }
        />
      ) : null}
    </div>
  );
}
