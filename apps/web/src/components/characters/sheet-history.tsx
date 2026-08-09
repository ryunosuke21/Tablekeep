"use client";

import { Badge } from "@tablekeep/ui/components/badge";
import { Spinner } from "@tablekeep/ui/components/spinner";

import { MAX_SHEET_EVENTS_PAGE } from "@/lib/constants";
import { api } from "@/trpc/react";

import { EmptyNote } from "./sheet-readouts";

const dateFormat = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});

/**
 * Who changed what, and when. This is the one tab with no editing at all: the
 * history is append-only, so nobody — DM included — rewrites it from here.
 */
export function SheetHistory({
  campaignId,
  sheetId,
}: {
  campaignId: string;
  sheetId: string;
}) {
  const events = api.character.sheet.events.useQuery(
    { campaignId, sheetId, limit: MAX_SHEET_EVENTS_PAGE },
    { staleTime: 10_000 },
  );

  if (events.isPending) {
    return (
      <p className="flex items-center gap-2 text-muted-foreground text-sm">
        <Spinner /> Reading the sheet's history…
      </p>
    );
  }

  if (events.isError) {
    return <EmptyNote>This sheet's history could not be read.</EmptyNote>;
  }

  if (events.data.length === 0) {
    return (
      <EmptyNote>
        Nothing has changed on this sheet yet. Every edit from here on is
        recorded.
      </EmptyNote>
    );
  }

  return (
    <>
      <ol className="rounded-xl border px-4 py-4">
        {events.data.map((event) => (
          <li
            key={event.id}
            className="border-b py-3 first:pt-0 last:border-b-0 last:pb-0"
          >
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <p className="font-medium text-sm">{event.summary}</p>
              <Badge variant={event.actorRole === "dm" ? "default" : "outline"}>
                {event.actorRole === "dm" ? "DM" : "Player"}
              </Badge>
            </div>
            <p className="mt-1 text-muted-foreground text-xs">
              {event.actorName}
              <span aria-hidden="true"> · </span>
              <time dateTime={new Date(event.createdAt).toISOString()}>
                {dateFormat.format(new Date(event.createdAt))}
              </time>
            </p>
          </li>
        ))}
      </ol>
      {events.data.length === MAX_SHEET_EVENTS_PAGE ? (
        <p className="mt-4 text-muted-foreground text-sm">
          Showing the {MAX_SHEET_EVENTS_PAGE} most recent changes.
        </p>
      ) : null}
    </>
  );
}
