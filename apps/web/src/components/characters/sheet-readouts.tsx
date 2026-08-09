import type { ReactNode } from "react";

import { Badge } from "@tablekeep/ui/components/badge";
import { cn } from "@tablekeep/ui/lib/utils";

/**
 * The reading half of the sheet. Every tab renders through these so a player
 * looking at a profile and a DM looking at the same profile see the same facts
 * in the same order; only the editors below them differ.
 */

/** A section with nothing in it yet. Never a form, never a call to action. */
export function EmptyNote({ children }: { children: ReactNode }) {
  return <p className="text-muted-foreground text-sm">{children}</p>;
}

/** Label over value, for a fact that is one line long. */
export function ReadField({
  label,
  value,
  className,
}: {
  label: string;
  value: string | null | undefined;
  className?: string;
}) {
  const shown = value?.trim();
  return (
    <div className={className}>
      <dt className="text-[10px] text-muted-foreground uppercase tracking-[0.14em]">
        {label}
      </dt>
      <dd
        className={cn(
          "mt-1 text-base",
          shown ? "font-medium" : "text-muted-foreground",
        )}
      >
        {shown || "Not set"}
      </dd>
    </div>
  );
}

/** Free-form writing: a bio, an appearance, a backstory. */
export function ReadProse({
  value,
  empty,
}: {
  value: string | null | undefined;
  empty: string;
}) {
  const shown = value?.trim();
  if (!shown) return <EmptyNote>{empty}</EmptyNote>;

  return (
    <div className="max-w-2xl whitespace-pre-wrap text-sm leading-relaxed">
      {shown}
    </div>
  );
}

/** A numbered card, used for ability scores. */
export function ReadStat({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-xl border bg-muted/20 px-3 py-3 text-center">
      <p className="truncate text-[10px] text-muted-foreground uppercase tracking-[0.14em]">
        {label}
      </p>
      <p className="mt-1 font-semibold text-2xl tabular-nums tracking-[-0.03em]">
        {value}
      </p>
    </div>
  );
}

/** One entry in a list: a name, an optional aside, and optional prose. */
export function ReadEntry({
  name,
  meta,
  notes,
  badges,
  muted = false,
}: {
  name: string;
  meta?: string | null;
  notes?: string | null;
  badges?: ReactNode;
  muted?: boolean;
}) {
  return (
    <div
      className={cn(
        "border-b py-3 first:pt-0 last:border-b-0 last:pb-0",
        muted ? "opacity-60" : undefined,
      )}
    >
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <p className="font-medium text-sm">{name}</p>
        {meta?.trim() ? (
          <p className="text-muted-foreground text-xs">{meta}</p>
        ) : null}
        {badges}
      </div>
      {notes?.trim() ? (
        <p className="mt-1 whitespace-pre-wrap text-muted-foreground text-sm leading-relaxed">
          {notes}
        </p>
      ) : null}
    </div>
  );
}

/** The bordered plate a ReadEntry list sits on. */
export function ReadList({ children }: { children: ReactNode }) {
  return <div className="rounded-xl border px-4 py-4">{children}</div>;
}

/** A small chip, for conditions and other at-a-glance flags. */
export function ReadChip({
  children,
  tone = "secondary",
}: {
  children: ReactNode;
  tone?: "secondary" | "outline";
}) {
  return <Badge variant={tone}>{children}</Badge>;
}
