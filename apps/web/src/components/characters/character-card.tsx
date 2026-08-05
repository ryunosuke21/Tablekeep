import { IconHeartFilled, IconMapPin } from "@tabler/icons-react";
import Link from "next/link";

import { Card, CardContent } from "@tablekeep/ui/components/card";
import { D20Icon } from "@tablekeep/ui/icons/d20";

import type { RouterOutputs } from "@/trpc/react";

export type CharacterListItem =
  RouterOutputs["character"]["list"]["items"][number];
export type CharacterSheetSummary = CharacterListItem["sheets"][number];

/**
 * The most recently touched sheet the caller may see. `character.list` already
 * scopes sheets to campaigns the caller belongs to and drops retired ones, so
 * the first entry is the one worth showing on a card.
 */
export function primarySheet(
  character: CharacterListItem,
): CharacterSheetSummary | null {
  return character.sheets[0] ?? null;
}

export function CharacterCard({ character }: { character: CharacterListItem }) {
  const sheet = primarySheet(character);
  const alias = sheet?.name?.trim() ? sheet.name.trim() : null;

  return (
    <Link
      href={`/characters/${character.slug}`}
      aria-label={`Open ${character.name}`}
      className="group block h-full rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <Card className="h-full min-h-44 gap-0 overflow-hidden bg-card py-0 transition-[transform,box-shadow,ring-color] duration-200 group-hover:-translate-y-0.5 group-hover:shadow-lg group-hover:ring-foreground/20 motion-reduce:transform-none motion-reduce:transition-none">
        <CardContent className="flex h-full min-h-44 flex-col p-5">
          <div className="flex items-start gap-3">
            <div
              role="img"
              aria-label={
                sheet ? `Level ${sheet.totalLevel}` : "No level recorded"
              }
              className="relative flex size-14 shrink-0 items-center justify-center"
            >
              <D20Icon
                aria-hidden="true"
                className="absolute inset-0 size-14 text-foreground/75"
              />
              <span className="relative font-semibold text-sm tabular-nums">
                {sheet ? sheet.totalLevel : "—"}
              </span>
            </div>

            <div className="min-w-0 pt-1">
              <h3 className="truncate font-semibold text-lg tracking-[-0.025em]">
                {character.name}
              </h3>
              <p className="mt-1 flex items-center gap-1.5 text-muted-foreground text-xs">
                <IconMapPin className="size-3.5" aria-hidden="true" />
                <span className="truncate">
                  {sheet ? sheet.campaignName : "Not in a campaign yet"}
                </span>
              </p>
            </div>
          </div>

          <div className="mt-auto flex items-end justify-between gap-3 pt-7">
            <p className="min-w-0 font-medium text-sm">
              {sheet ? (
                <span className="block truncate">
                  {sheet.ancestry?.trim() ? sheet.ancestry : "Ancestry not set"}
                  {alias ? (
                    <>
                      <span
                        aria-hidden="true"
                        className="mx-1.5 text-muted-foreground"
                      >
                        ·
                      </span>
                      <span className="text-muted-foreground">
                        Plays as {alias}
                      </span>
                    </>
                  ) : null}
                </span>
              ) : (
                <span className="text-muted-foreground">
                  Attach this character to a campaign to start a sheet.
                </span>
              )}
            </p>

            {sheet ? (
              <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-background/80 px-3 py-1.5 text-xs shadow-sm ring-1 ring-foreground/10">
                <IconHeartFilled
                  className="size-3.5 text-muted-foreground"
                  aria-hidden="true"
                />
                <span className="font-medium tabular-nums">
                  {sheet.maxHp} max HP
                </span>
              </span>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
