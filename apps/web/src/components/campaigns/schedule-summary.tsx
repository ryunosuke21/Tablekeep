import {
  describeRecurrence,
  formatDate,
  formatDuration,
  formatSessionRange,
} from "@/lib/campaign-format";
import type { RouterOutputs } from "@/trpc/react";

export type CampaignSchedulePayload =
  RouterOutputs["campaign"]["schedule"]["get"];

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5">
      <dt className="text-[11px] text-muted-foreground uppercase tracking-[0.1em]">
        {label}
      </dt>
      <dd className="text-right text-sm tabular-nums">{value}</dd>
    </div>
  );
}

/** The cadence half of the session ledger: what the table agreed to. */
export function ScheduleSummary({
  schedule,
}: {
  schedule: CampaignSchedulePayload;
}) {
  if (!schedule.recurrence || !schedule.startAt) {
    return (
      <p className="text-muted-foreground text-sm">
        No cadence set. Sessions added by hand still show in the ledger.
      </p>
    );
  }

  const duration = formatDuration(schedule.durationMinutes);
  const endsAt =
    schedule.durationMinutes === null
      ? null
      : new Date(
          schedule.startAt.getTime() + schedule.durationMinutes * 60_000,
        );

  return (
    <dl className="divide-y">
      <Line
        label="Cadence"
        value={describeRecurrence(
          schedule.recurrence,
          schedule.startAt,
          schedule.timeZone,
        )}
      />
      <Line
        label="Time"
        value={formatSessionRange(schedule.startAt, endsAt, schedule.timeZone)}
      />
      {duration ? <Line label="Length" value={duration} /> : null}
      <Line label="Time zone" value={schedule.timeZone ?? "Not set"} />
      <Line
        label="Started"
        value={formatDate(schedule.startAt, schedule.timeZone)}
      />
      {schedule.recurrence.until ? (
        <Line
          label="Ends"
          value={formatDate(schedule.recurrence.until, schedule.timeZone)}
        />
      ) : null}
    </dl>
  );
}
