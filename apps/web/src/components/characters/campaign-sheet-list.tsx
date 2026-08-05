import { IconHeartFilled } from "@tabler/icons-react";
import Link from "next/link";

import { D20Icon } from "@tablekeep/ui/icons/d20";

import type { RouterOutputs } from "@/trpc/react";

export type CampaignSheetListItem =
  RouterOutputs["character"]["sheet"]["list"][number];

/** "Rogue 4 / Fighter (Champion) 2", or nothing when no class is recorded. */
export function describeClasses(classes: CampaignSheetListItem["classes"]) {
  return classes
    .map((entry) =>
      entry.subclass?.trim()
        ? `${entry.name} (${entry.subclass}) ${entry.level}`
        : `${entry.name} ${entry.level}`,
    )
    .join(" / ");
}

export function CampaignSheetList({
  sheets,
  campaignSlug,
  ownerNames,
}: {
  sheets: CampaignSheetListItem[];
  campaignSlug: string;
  ownerNames?: Record<string, string>;
}) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {sheets.map((sheet) => {
        const alias = sheet.name?.trim() ? sheet.name.trim() : null;
        const classes = describeClasses(sheet.classes);
        const playedBy = ownerNames?.[sheet.ownerId];

        return (
          <li key={sheet.id}>
            <Link
              href={`/campaigns/${campaignSlug}/characters/${sheet.id}`}
              aria-label={`Open the sheet for ${alias ?? sheet.charName}`}
              className="group flex h-full items-start gap-4 rounded-xl border bg-background px-4 py-4 outline-none transition-[border-color,box-shadow] hover:border-foreground/25 focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <span
                role="img"
                aria-label={`Level ${sheet.totalLevel}`}
                className="relative flex size-12 shrink-0 items-center justify-center"
              >
                <D20Icon
                  aria-hidden="true"
                  className="absolute inset-0 size-12 text-foreground/70"
                />
                <span className="relative font-semibold text-xs tabular-nums">
                  {sheet.totalLevel}
                </span>
              </span>

              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium tracking-[-0.02em]">
                  {alias ?? sheet.charName}
                </span>
                {alias ? (
                  <span className="block truncate text-muted-foreground text-xs">
                    {sheet.charName}
                  </span>
                ) : null}
                <span className="mt-1 block truncate text-muted-foreground text-sm">
                  {sheet.ancestry?.trim() ? sheet.ancestry : "Ancestry not set"}
                  {classes ? ` · ${classes}` : ""}
                </span>
                <span className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-muted-foreground text-xs">
                  <span className="flex items-center gap-1">
                    <IconHeartFilled className="size-3.5" aria-hidden="true" />
                    <span className="tabular-nums">{sheet.maxHp} max HP</span>
                  </span>
                  {playedBy ? <span>Played by {playedBy}</span> : null}
                </span>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
