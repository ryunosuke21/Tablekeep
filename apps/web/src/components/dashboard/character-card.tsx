import { Card, CardContent } from "@tablekeep/ui/components/card";
import { D20Icon } from "@tablekeep/ui/icons/d20";
import { IconHeart, IconMapPin } from "@tabler/icons-react";
import Image from "next/image";
import Link from "next/link";

import type { CharacterSummary } from "@/server/api/mocks/dashboard";

export function CharacterCard({ character }: { character: CharacterSummary }) {
  const classSummary = character.classes
    .map((characterClass) => characterClass.name)
    .join(" / ");

  return (
    <Link
      href={`/characters/${character.slug}`}
      aria-label={`Open ${character.name}`}
      className="group block h-full rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <Card className="relative h-full min-h-56 overflow-hidden bg-card py-0 transition-[transform,box-shadow,ring-color] duration-200 group-hover:-translate-y-0.5 group-hover:shadow-lg group-hover:ring-foreground/20 motion-reduce:transform-none motion-reduce:transition-none">
        {character.artworkUrl ? (
          <div
            aria-hidden="true"
            className="absolute right-0 bottom-0 h-full w-[68%] [mask-composite:intersect] [mask-image:linear-gradient(to_right,transparent_0%,black_58%),linear-gradient(to_bottom,transparent_0%,black_35%)]"
          >
            <Image
              src={character.artworkUrl}
              alt=""
              fill
              sizes="(min-width: 1280px) 24vw, (min-width: 640px) 46vw, 68vw"
              className="object-cover object-[58%_center] opacity-55 saturate-75 transition-[opacity,transform] duration-300 group-hover:scale-[1.02] group-hover:opacity-70 motion-reduce:transform-none motion-reduce:transition-none dark:opacity-45 dark:group-hover:opacity-60"
            />
          </div>
        ) : null}

        <CardContent className="relative z-10 flex h-full min-h-56 flex-col p-5">
          <div className="flex items-start gap-3">
            <div
              role="img"
              aria-label={`Level ${character.totalLevel}`}
              className="relative flex size-14 shrink-0 items-center justify-center"
            >
              <D20Icon
                aria-hidden="true"
                className="absolute inset-0 size-14 text-foreground/75"
              />
              <span className="relative font-semibold text-sm tabular-nums">
                {character.totalLevel}
              </span>
            </div>

            <div className="min-w-0 pt-1">
              <h3 className="truncate font-semibold text-lg tracking-[-0.025em]">
                {character.name}
              </h3>
              <p className="mt-1 flex items-center gap-1.5 text-muted-foreground text-xs">
                <IconMapPin className="size-3.5" />
                <span className="truncate">
                  {character.campaign?.name ?? "No campaign"}
                </span>
              </p>
            </div>
          </div>

          <div className="mt-auto flex items-end justify-between gap-3 pt-8">
            <p className="max-w-[60%] font-medium text-sm">
              {character.ancestry}
              <span className="mx-1.5 text-muted-foreground">·</span>
              {classSummary}
            </p>

            <div className="flex shrink-0 items-center gap-1.5 rounded-full bg-background/80 px-3 py-1.5 text-xs shadow-sm ring-1 ring-foreground/10 backdrop-blur-sm">
              <IconHeart className="size-3.5 text-muted-foreground" />
              <span className="font-medium tabular-nums">
                {character.hitPoints
                  ? `${character.hitPoints.current} / ${character.hitPoints.maximum} HP`
                  : "HP —"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
