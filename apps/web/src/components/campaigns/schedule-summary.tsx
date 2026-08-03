import { describeRecurrence, formatSessionTime } from "@/lib/campaign-format";
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

/** A compact summary of when the table plays. */
export function ScheduleSummary({
  schedule,
}: {
  schedule: CampaignSchedulePayload;
}) {
  if (!schedule.recurrence || !schedule.startAt) {
    return (
      <p className="text-muted-foreground text-sm">
        No repeating schedule yet. One-off sessions still appear below.
      </p>
    );
  }

  return (
    <dl className="grid gap-3 sm:grid-cols-2">
      <Line
        label="Repeats"
        value={describeRecurrence(
          schedule.recurrence,
          schedule.startAt,
          schedule.timeZone,
        )}
      />
      <Line
        label="Starts"
        value={formatSessionTime(schedule.startAt, schedule.timeZone)}
      />
    </dl>
  );
}
