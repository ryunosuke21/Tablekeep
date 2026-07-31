import type * as React from "react";
import { IconArrowUpRight } from "@tabler/icons-react";
import Image from "next/image";
import Link from "next/link";

import { cn } from "@tablekeep/ui/lib/utils";

import { docsRoute } from "@/lib/shared";

import { Eyebrow } from "./primitives";

const ART = {
  character: "/character.jpg",
  encounter: "/encounter.jpg",
  spells: "/spells.jpg",
  shops: "/shop.jpg",
} as const;

function Tile({
  className,
  children,
  ...props
}: React.ComponentProps<"article">) {
  return (
    <article
      className={cn(
        "tk-grain group relative isolate overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/10",
        "transition-transform duration-300 hover:-translate-y-0.5",
        className,
      )}
      {...props}
    >
      {children}
    </article>
  );
}

function TileLink({ children, href }: { children: string; href: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 font-medium text-sm text-tk-ember transition-colors hover:text-foreground"
    >
      {children}
      <IconArrowUpRight className="size-3.5" aria-hidden />
    </Link>
  );
}

export function Bento() {
  return (
    <section className="px-6 pb-24 sm:pb-32">
      <div className="mx-auto w-full max-w-6xl">
        <div className="text-center">
          <Eyebrow>What Tablekeep holds</Eyebrow>
          <h2 className="mx-auto mt-4 max-w-xl font-semibold text-[clamp(2rem,4vw,3rem)] leading-[1.05] tracking-tight">
            The bookkeeping, not the game.
          </h2>
        </div>

        <div className="mt-14 grid gap-4 md:grid-cols-3 md:grid-rows-[22rem_16rem]">
          {/* Character sheets — the tall anchor tile. */}
          <Tile className="md:row-span-2 md:flex md:flex-col">
            <div className="relative h-56 shrink-0 md:h-1/2">
              <Image
                src={ART.character}
                alt=""
                fill
                sizes="(min-width: 768px) 33vw, 100vw"
                className="object-cover"
              />
              <div
                aria-hidden
                className="absolute inset-0 bg-gradient-to-t from-card via-card/45 to-transparent"
              />
            </div>
            <div className="flex flex-1 flex-col justify-end bg-card p-6">
              <h3 className="font-semibold text-3xl leading-tight tracking-tight">
                Character sheets
              </h3>
              <p className="mt-3 text-muted-foreground text-sm leading-relaxed">
                Abilities, defenses, hit points, and conditions — with room for
                the notes that only make sense at your table.
              </p>
              <div className="mt-5">
                <TileLink href={docsRoute}>See what a sheet holds</TileLink>
              </div>
            </div>
          </Tile>

          {/* Encounters — the wide tile with text over art. */}
          <Tile className="md:col-span-2">
            <Image
              src={ART.encounter}
              alt=""
              fill
              sizes="(min-width: 768px) 66vw, 100vw"
              className="object-cover"
            />
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-r from-tk-keep via-tk-keep/75 to-tk-keep/25"
            />
            <div className="relative flex h-full min-h-56 flex-col justify-center p-6 sm:p-8">
              <h3 className="max-w-sm font-semibold text-3xl text-white leading-tight tracking-tight sm:text-4xl">
                Encounters that keep pace
              </h3>
              <p className="mt-3 max-w-sm text-sm text-white/70 leading-relaxed">
                Initiative order and hit points, shared so the DM and the party
                read the same fight.
              </p>
              <div className="mt-5">
                <TileLink href={docsRoute}>How a round runs</TileLink>
              </div>
            </div>
          </Tile>

          {/* Two small tiles. */}
          <Tile>
            <Image
              src={ART.spells}
              alt=""
              fill
              sizes="(min-width: 768px) 33vw, 100vw"
              className="object-cover"
            />
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-t from-tk-keep via-tk-keep/70 to-tk-keep/20"
            />
            <div className="relative flex h-full min-h-56 flex-col justify-end p-6">
              <h3 className="font-semibold text-2xl text-white tracking-tight">
                Spellbooks
              </h3>
              <p className="mt-2 text-sm text-white/70">
                Known, prepared, and which slots are still open.
              </p>
            </div>
          </Tile>

          <Tile>
            <Image
              src={ART.shops}
              alt=""
              fill
              sizes="(min-width: 768px) 33vw, 100vw"
              className="object-cover"
            />
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-t from-tk-keep via-tk-keep/70 to-tk-keep/20"
            />
            <div className="relative flex h-full min-h-56 flex-col justify-end p-6">
              <h3 className="font-semibold text-2xl text-white tracking-tight">
                Shops &amp; loot
              </h3>
              <p className="mt-2 text-sm text-white/70">
                Vendors stocked in advance, inventory that stays current.
              </p>
            </div>
          </Tile>
        </div>
      </div>
    </section>
  );
}
