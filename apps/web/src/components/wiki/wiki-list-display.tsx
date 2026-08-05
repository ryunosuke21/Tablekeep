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

function softBadge(value: ReactNode) {
  return <Badge variant="secondary">{value}</Badge>;
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
        { label: "Type", value: readableValue(value.type, "Feat") },
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

function tableFactsFor(
  category: WikiCategory,
  item: WikiListItem,
  itemKind?: WikiItemKind,
): Fact[] {
  switch (category) {
    case "classes": {
      const value = item as WikiClassListItem;
      return [
        {
          label: "Kind",
          value: softBadge(value.isSubclass ? "Subclass" : "Class"),
        },
        {
          label: "Hit die",
          value: <DiceRoll expression={value.hitDice} compact />,
        },
        { label: "Magic", value: softBadge(readableValue(value.casterType)) },
        { label: "Base class", value: value.parentClass?.name ?? "—" },
        { label: "Source", value: softBadge(sourceName(item)) },
      ];
    }
    case "creatures": {
      const value = item as WikiCreatureListItem;
      return [
        { label: "CR", value: softBadge(value.challengeRating) },
        {
          label: "Armor",
          value: (
            <span className="inline-flex items-center gap-1.5">
              <IconShield className="size-4 text-tk-ember" />
              {value.armorClass}
            </span>
          ),
        },
        {
          label: "Hit points",
          value: (
            <span className="inline-flex items-center gap-1.5">
              <IconHeart className="size-4 text-tk-ember" />
              {value.hitPoints}
            </span>
          ),
        },
        { label: "Size", value: softBadge(value.size.name) },
        { label: "Type", value: value.type.name },
        { label: "Source", value: softBadge(sourceName(item)) },
      ];
    }
    case "spells": {
      const value = item as WikiSpellListItem;
      return [
        { label: "Level", value: softBadge(spellLevel(value.level)) },
        { label: "School", value: softBadge(value.school.name) },
        { label: "Casting time", value: value.castingTime },
        {
          label: "Components",
          value: (
            <div className="flex gap-1">
              {value.components.length
                ? value.components.map((part) => (
                    <Badge key={part} variant="secondary">
                      {part}
                    </Badge>
                  ))
                : "—"}
            </div>
          ),
        },
        {
          label: "Classes",
          value:
            value.classes
              .slice(0, 3)
              .map((entry) => entry.name)
              .join(", ") || "—",
        },
        { label: "Source", value: softBadge(sourceName(item)) },
      ];
    }
    case "species": {
      const value = item as WikiSpeciesListItem;
      return [
        {
          label: "Kind",
          value: softBadge(value.isSubspecies ? "Subspecies" : "Species"),
        },
        { label: "Parent", value: value.parentSpecies?.name ?? "—" },
        { label: "Use", value: "Character option" },
        { label: "Rules", value: "2024 rules" },
        { label: "Source", value: softBadge(sourceName(item)) },
      ];
    }
    case "feats": {
      const value = item as WikiFeatListItem;
      return [
        { label: "Type", value: softBadge(readableValue(value.type, "Feat")) },
        {
          label: "Prerequisite",
          value: value.hasPrerequisite ? softBadge("Required") : "None",
        },
        { label: "Use", value: "Character option" },
        { label: "Rules", value: "2024 rules" },
        { label: "Source", value: softBadge(sourceName(item)) },
      ];
    }
    case "items": {
      const value = item as WikiItemListItem | WikiMagicItemListItem;
      return [
        {
          label: "Kind",
          value: softBadge(itemKind === "magic" ? "Magic" : "Everyday"),
        },
        { label: "Category", value: value.category.name },
        {
          label: "Rarity",
          value:
            "rarity" in value ? softBadge(value.rarity?.name ?? "Common") : "—",
        },
        {
          label: "Attunement",
          value:
            "requiresAttunement" in value
              ? value.requiresAttunement
                ? softBadge("Required")
                : "No"
              : "—",
        },
        { label: "Source", value: softBadge(sourceName(item)) },
      ];
    }
    case "backgrounds":
      return [
        { label: "Kind", value: softBadge("Background") },
        { label: "Use", value: "Character option" },
        { label: "Rules", value: "2024 rules" },
        { label: "Source", value: softBadge(sourceName(item)) },
      ];
    case "rules":
      return [
        { label: "Kind", value: softBadge("Rule") },
        { label: "Library", value: "Core rules" },
        { label: "Rules", value: "2024 rules" },
        { label: "Source", value: softBadge(sourceName(item)) },
      ];
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
  const columns = items[0]
    ? tableFactsFor(category, items[0], itemKind).map((fact) => fact.label)
    : [];
  return (
    <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
      <div className="overflow-x-auto">
        <Table className="min-w-[64rem]">
          <TableHeader className="bg-muted/55">
            <TableRow className="hover:bg-transparent">
              <TableHead className="sticky left-0 z-20 min-w-72 bg-muted/95 pl-5 backdrop-blur">
                Entry
              </TableHead>
              {columns.map((label) => (
                <TableHead key={label} className="whitespace-nowrap">
                  {label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => {
              const facts = tableFactsFor(category, item, itemKind);
              return (
                <TableRow
                  key={item.key}
                  className="group h-[4.75rem] hover:bg-muted/35"
                >
                  <TableCell className="sticky left-0 z-10 bg-card py-2 pl-3 group-hover:bg-[color-mix(in_oklch,var(--card),var(--muted)_35%)]">
                    <Link
                      href={detailHref(category, item, itemKind)}
                      className="flex items-center gap-3 rounded-lg p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <WikiArtwork
                        category={category}
                        recordKey={item.key}
                        className="h-12 w-16 shrink-0 rounded-lg border"
                        sizes="64px"
                      />
                      <span className="min-w-0">
                        <span className="block truncate font-semibold">
                          {item.name}
                        </span>
                        <span className="mt-0.5 block truncate font-mono text-[10px] text-muted-foreground">
                          {item.key}
                        </span>
                      </span>
                    </Link>
                  </TableCell>
                  {facts.map((fact) => (
                    <TableCell
                      key={fact.label}
                      className="whitespace-nowrap text-sm"
                    >
                      {fact.value}
                    </TableCell>
                  ))}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
