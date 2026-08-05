import type { ReactNode } from "react";
import Link from "next/link";

import { Badge } from "@tablekeep/ui/components/badge";

/**
 * The one signature surface of the sheet: a folio plate that answers "who is
 * this, at what table, how far along, and how much can they take" before any
 * editing starts. Everything below it stays plain and ruled.
 */
export function SheetFolioHeader({
  displayName,
  characterName,
  campaignName,
  campaignSlug,
  totalLevel,
  maxHp,
  ancestry,
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
  retired: boolean;
  actions?: ReactNode;
}) {
  const aliasShown = displayName !== characterName;

  return (
    <header className="rounded-2xl border bg-muted/25 px-5 py-6 sm:px-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
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
        </div>

        {actions ? (
          <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>
        ) : null}
      </div>

      <dl className="mt-6 grid grid-cols-2 border-t pt-4 sm:grid-cols-3">
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
        <div className="col-span-2 mt-4 border-t pt-4 sm:col-span-1 sm:mt-0 sm:border-t-0 sm:border-l sm:pt-0 sm:pl-4">
          <dt className="text-[10px] text-muted-foreground uppercase tracking-[0.14em]">
            Ancestry
          </dt>
          <dd className="mt-1 font-medium text-base">
            {ancestry?.trim() ? ancestry : "Not set"}
          </dd>
        </div>
      </dl>
    </header>
  );
}
