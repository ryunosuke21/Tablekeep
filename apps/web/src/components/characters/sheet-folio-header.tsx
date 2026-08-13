import type { ReactNode } from "react";
import Link from "next/link";

import { Badge } from "@tablekeep/ui/components/badge";

/**
 * The profile plate: who this is, at what table, and the handful of numbers
 * worth reading before any tab is opened. Everything else lives in a tab, so
 * this stays a portrait rather than a summary of the whole sheet.
 */
export function SheetFolioHeader({
  displayName,
  characterName,
  campaignName,
  campaignSlug,
  totalLevel,
  maxHp,
  ancestry,
  alignment,
  classSummary,
  retired,
  actions,
}: {
  displayName: string;
  characterName: string;
  campaignName: string;
  campaignSlug: string;
  totalLevel: number;
  maxHp: number;
  ancestry: string | null;
  alignment: string | null;
  classSummary: string | null;
  retired: boolean;
  actions?: ReactNode;
}) {
  const aliasShown = displayName !== characterName;
  const monogram = displayName.trim().charAt(0).toUpperCase() || "?";
  const chips = [ancestry, classSummary, alignment].filter(
    (chip): chip is string => Boolean(chip?.trim()),
  );

  return (
    <header className="rounded-2xl border bg-muted/25 px-5 py-6 sm:px-7">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <span
            aria-hidden="true"
            className="hidden size-14 shrink-0 items-center justify-center rounded-2xl border bg-background font-semibold text-2xl tracking-[-0.03em] sm:flex"
          >
            {monogram}
          </span>

          <div className="min-w-0">
            <p className="text-[10px] text-tk-ember uppercase tracking-[0.18em]">
              Campaign sheet
            </p>
            <h1 className="mt-2 font-semibold text-3xl tracking-[-0.04em] sm:text-4xl">
              {displayName}
            </h1>
            <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-muted-foreground text-sm">
              {aliasShown ? <span>{characterName}</span> : null}
              {aliasShown ? <span aria-hidden="true">·</span> : null}
              <Link
                href={`/campaigns/${campaignSlug}`}
                className="underline-offset-4 hover:text-foreground hover:underline"
              >
                {campaignName}
              </Link>
              {retired ? (
                <Badge variant="secondary" className="ml-1">
                  Retired
                </Badge>
              ) : null}
            </p>

            {chips.length > 0 ? (
              <ul className="mt-3 flex flex-wrap gap-2">
                {chips.map((chip) => (
                  <li key={chip}>
                    <Badge variant="outline">{chip}</Badge>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>

        {actions ? (
          <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>
        ) : null}
      </div>

      <dl className="mt-6 grid grid-cols-2 border-t pt-4">
        <div className="pr-4">
          <dt className="text-[10px] text-muted-foreground uppercase tracking-[0.14em]">
            Level
          </dt>
          <dd className="mt-1 font-semibold text-2xl tabular-nums tracking-[-0.03em]">
            {totalLevel}
          </dd>
        </div>
        <div className="border-l pl-4">
          <dt className="text-[10px] text-muted-foreground uppercase tracking-[0.14em]">
            Max HP
          </dt>
          <dd className="mt-1 font-semibold text-2xl tabular-nums tracking-[-0.03em]">
            {maxHp}
          </dd>
        </div>
      </dl>
    </header>
  );
}
