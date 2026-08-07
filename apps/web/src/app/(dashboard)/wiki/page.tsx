import type { Metadata } from "next";
import {
  IconArrowRight,
  IconBackpack,
  IconBook2,
  IconCards,
  IconMasksTheater,
  IconPaw,
  IconSparkles,
  IconSword,
  IconWallpaper,
} from "@tabler/icons-react";
import Image from "next/image";
import Link from "next/link";

import {
  WIKI_CATEGORIES,
  WIKI_CATEGORY_META,
  type WikiCategory,
  wikiAccentStyle,
} from "@/lib/wiki/catalog";

export const metadata: Metadata = {
  title: "Wiki",
  description: "Rules and reference material for the table.",
};

const CATEGORY_ICONS: Record<WikiCategory, typeof IconBook2> = {
  species: IconMasksTheater,
  backgrounds: IconWallpaper,
  classes: IconSword,
  spells: IconSparkles,
  creatures: IconPaw,
  feats: IconCards,
  items: IconBackpack,
  rules: IconBook2,
};

const PLATES = [
  "/wiki/paths.webp",
  "/wiki/arcana.webp",
  "/wiki/bestiary.webp",
  "/wiki/equipment.webp",
] as const;

export default function WikiPage() {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-16 sm:px-6 lg:px-10">
      <div className="relative -mx-4 h-28 overflow-hidden sm:-mx-6 sm:h-36 lg:-mx-10">
        <div className="grid h-full grid-cols-4 gap-px">
          {PLATES.map((plate, index) => (
            <div key={plate} className="relative overflow-hidden">
              <Image
                src={plate}
                alt=""
                fill
                priority={index === 0}
                sizes="25vw"
                className="object-cover opacity-70 saturate-50"
              />
            </div>
          ))}
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-tk-keep/45 via-background/70 to-background" />
      </div>

      <header className="relative -mt-6">
        <p className="font-mono text-[0.65rem] text-muted-foreground uppercase tracking-[0.2em]">
          Reference
        </p>
        <h1 className="mt-2 font-display font-semibold text-4xl leading-none tracking-[-0.02em] sm:text-5xl">
          Rules wiki
        </h1>
        <p className="mt-3 max-w-xl text-muted-foreground">
          Every entry from the open reference libraries, filtered in your
          browser. Nothing is hidden behind a default: pick a section and narrow
          it however you like.
        </p>
      </header>

      <ul className="mt-8 overflow-hidden rounded-xl border bg-card shadow-xs">
        {WIKI_CATEGORIES.map((category) => {
          const meta = WIKI_CATEGORY_META[category];
          const Icon = CATEGORY_ICONS[category];
          return (
            <li key={category} className="border-b last:border-b-0">
              <Link
                href={`/wiki/${category}`}
                style={wikiAccentStyle(category)}
                className="group flex items-center gap-4 px-4 py-4 transition-colors hover:bg-[color-mix(in_oklab,var(--wiki-accent)_7%,transparent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset sm:px-6"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-[color-mix(in_oklab,var(--wiki-accent)_14%,transparent)] text-[var(--wiki-accent)]">
                  <Icon className="size-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-display font-semibold text-lg leading-tight tracking-[-0.01em] group-hover:text-[var(--wiki-accent)]">
                    {meta.title}
                  </span>
                  <span className="mt-0.5 block truncate text-muted-foreground text-sm">
                    {meta.description}
                  </span>
                </span>
                <span className="hidden max-w-[16rem] truncate font-mono text-muted-foreground text-xs italic lg:block">
                  “{meta.lookup}”
                </span>
                <IconArrowRight className="size-4 shrink-0 text-border transition-transform group-hover:translate-x-0.5 group-hover:text-[var(--wiki-accent)] motion-reduce:transform-none" />
              </Link>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
