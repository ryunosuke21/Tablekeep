import type { ReactNode } from "react";
import {
  IconArrowUpRight,
  IconBolt,
  IconClock,
  IconHeart,
  IconShield,
  IconSparkles,
} from "@tabler/icons-react";
import Link from "next/link";

import { Badge } from "@tablekeep/ui/components/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@tablekeep/ui/components/table";

import {
  WIKI_CATEGORY_META,
  type WikiCategory,
  type WikiItemKind,
  type WikiListItem,
} from "@/lib/wiki/catalog";
import type {
  WikiClassListItem,
  WikiCreatureListItem,
  WikiFeatListItem,
  WikiItemListItem,
  WikiMagicItemListItem,
  WikiSpeciesListItem,
  WikiSpellListItem,
} from "@/types/wiki";

import { DiceRoll } from "./dice-roll";
import { WikiArtwork } from "./wiki-artwork";

type Fact = { label: string; value: ReactNode; icon?: ReactNode };

function sourceName(item: WikiListItem) {
  return "source" in item ? item.source.displayName : "2024 rules";
}

function spellLevel(level: number) {
  return level === 0 ? "Cantrip" : `Level ${level}`;
}

function readableValue(value: string | null | undefined, fallback = "None") {
  if (!value) return fallback;
  return value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function factsFor(category: WikiCategory, item: WikiListItem): Fact[] {
  switch (category) {
    case "classes": {
      const value = item as WikiClassListItem;
      return [
        {
          label: "Hit die",
          value: <DiceRoll expression={value.hitDice} compact />,
        },
        {
          label: "Magic",
          value: readableValue(value.casterType),
          icon: <IconSparkles />,
        },
        ...(value.parentClass
          ? [{ label: "Base", value: value.parentClass.name }]
          : []),
      ];
    }
    case "creatures": {
      const value = item as WikiCreatureListItem;
      return [
        { label: "CR", value: value.challengeRating, icon: <IconBolt /> },
        { label: "AC", value: value.armorClass, icon: <IconShield /> },
        { label: "HP", value: value.hitPoints, icon: <IconHeart /> },
      ];
    }
    case "spells": {
      const value = item as WikiSpellListItem;
      return [
        { label: "Level", value: spellLevel(value.level) },
        { label: "School", value: value.school.name, icon: <IconSparkles /> },
        { label: "Cast", value: value.castingTime, icon: <IconClock /> },
      ];
    }
    case "species": {
      const value = item as WikiSpeciesListItem;
      return [
        { label: "Kind", value: value.isSubspecies ? "Subspecies" : "Species" },
        ...(value.parentSpecies
          ? [{ label: "Parent", value: value.parentSpecies.name }]
          : []),
      ];
    }
    case "feats": {
      const value = item as WikiFeatListItem;
      return [
        { label: "Type", value: value.type || "Feat" },
        {
          label: "Needs",
          value: value.hasPrerequisite ? "Prerequisite" : "None",
        },
      ];
    }
    case "items": {
      const value = item as WikiItemListItem | WikiMagicItemListItem;
      return [
        { label: "Category", value: value.category.name },
        ...("rarity" in value && value.rarity
          ? [{ label: "Rarity", value: value.rarity.name }]
          : []),
        ...("requiresAttunement" in value
          ? [
              {
                label: "Attune",
                value: value.requiresAttunement ? "Yes" : "No",
              },
            ]
          : []),
      ];
    }
    default:
      return [{ label: "Source", value: sourceName(item) }];
  }
}

function detailHref(
  category: WikiCategory,
  item: WikiListItem,
  itemKind?: WikiItemKind,
) {
  const base = `/wiki/${category}/${encodeURIComponent(item.key)}`;
  return category === "items" && itemKind === "magic"
    ? `${base}?kind=magic`
    : base;
}

export function WikiCard({
  category,
  item,
  itemKind,
  priority = false,
}: {
  category: WikiCategory;
  item: WikiListItem;
  itemKind?: WikiItemKind;
  priority?: boolean;
}) {
  const facts = factsFor(category, item).slice(0, 3);
  return (
    <Link
      href={detailHref(category, item, itemKind)}
      className="group flex h-full min-h-[21rem] flex-col overflow-hidden rounded-2xl border bg-card shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 motion-reduce:transform-none motion-reduce:transition-none"
    >
      <WikiArtwork
        category={category}
        recordKey={item.key}
        priority={priority}
        className="aspect-[16/9] w-full"
      />
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] text-tk-ember uppercase tracking-[0.16em]">
              {itemKind === "magic"
                ? "Magic item"
                : WIKI_CATEGORY_META[category].singular}
            </p>
            <h2 className="mt-2 font-semibold text-xl tracking-[-0.03em]">
              {item.name}
            </h2>
          </div>
          <IconArrowUpRight className="mt-1 size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 motion-reduce:transition-none" />
        </div>
        <dl className="mt-auto grid grid-cols-2 gap-x-4 gap-y-3 border-t pt-4">
          {facts.map((fact) => (
            <div key={fact.label} className="min-w-0">
              <dt className="flex items-center gap-1 font-mono text-[10px] text-muted-foreground uppercase tracking-[0.12em] [&_svg]:size-3">
                {fact.icon}
                {fact.label}
              </dt>
              <dd className="mt-1 truncate text-sm">{fact.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </Link>
  );
}

export function WikiTableView({
  category,
  items,
  itemKind,
}: {
  category: WikiCategory;
  items: WikiListItem[];
  itemKind?: WikiItemKind;
}) {
  const labels = factsFor(
    category,
    items[0] ?? ({ key: "", name: "", sourceKey: "" } as WikiListItem),
  )
    .slice(0, 3)
    .map((fact) => fact.label);

  return (
    <div className="overflow-x-auto rounded-xl border bg-card">
      <Table className="min-w-[42rem]">
        <TableHeader>
          <TableRow>
            <TableHead className="sticky left-0 z-10 min-w-48 bg-card">
              Name
            </TableHead>
            {labels.map((label) => (
              <TableHead key={label}>{label}</TableHead>
            ))}
            <TableHead>Source</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => {
            const facts = factsFor(category, item).slice(0, 3);
            return (
              <TableRow key={item.key}>
                <TableCell className="sticky left-0 z-10 bg-card font-medium">
                  <Link
                    className="rounded-sm underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    href={detailHref(category, item, itemKind)}
                  >
                    {item.name}
                  </Link>
                </TableCell>
                {facts.map((fact) => (
                  <TableCell key={fact.label}>{fact.value}</TableCell>
                ))}
                {labels.slice(facts.length).map((label) => (
                  <TableCell key={`empty-${label}`}>—</TableCell>
                ))}
                <TableCell>
                  <Badge variant="secondary">{sourceName(item)}</Badge>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
