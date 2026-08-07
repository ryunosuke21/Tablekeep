import type { CSSProperties } from "react";

import type {
  WikiBackground,
  WikiCatalogListItem,
  WikiClass,
  WikiClassListItem,
  WikiCreature,
  WikiCreatureListItem,
  WikiFeat,
  WikiFeatListItem,
  WikiItem,
  WikiItemListItem,
  WikiMagicItem,
  WikiMagicItemListItem,
  WikiRule,
  WikiRuleListItem,
  WikiSpecies,
  WikiSpeciesListItem,
  WikiSpell,
  WikiSpellListItem,
} from "@/types/wiki";

export const WIKI_CATEGORIES = [
  "species",
  "backgrounds",
  "classes",
  "spells",
  "creatures",
  "feats",
  "items",
  "rules",
] as const;

export type WikiCategory = (typeof WIKI_CATEGORIES)[number];
export type WikiView = "index" | "cards";
export type WikiItemKind = "mundane" | "magic";

export type WikiListItem =
  | WikiCatalogListItem
  | WikiClassListItem
  | WikiCreatureListItem
  | WikiFeatListItem
  | WikiItemListItem
  | WikiMagicItemListItem
  | WikiRuleListItem
  | WikiSpeciesListItem
  | WikiSpellListItem;

export type WikiDetail =
  | WikiBackground
  | WikiClass
  | WikiCreature
  | WikiFeat
  | WikiItem
  | WikiMagicItem
  | WikiRule
  | WikiSpecies
  | WikiSpell;

export type WikiCategoryMeta = {
  title: string;
  singular: string;
  description: string;
  /** What this section answers at the table, shown on the hub. */
  lookup: string;
  art:
    | "/wiki/paths.webp"
    | "/wiki/arcana.webp"
    | "/wiki/bestiary.webp"
    | "/wiki/equipment.webp";
};

export const WIKI_CATEGORY_META: Record<WikiCategory, WikiCategoryMeta> = {
  species: {
    title: "Species",
    singular: "species",
    description: "Traits and details for the people you can play.",
    lookup: "How far does a halfling move?",
    art: "/wiki/paths.webp",
  },
  backgrounds: {
    title: "Backgrounds",
    singular: "background",
    description: "The lives and skills that shaped an adventurer.",
    lookup: "What does a sage start with?",
    art: "/wiki/paths.webp",
  },
  classes: {
    title: "Classes",
    singular: "class",
    description: "Core abilities, hit dice, and features by level.",
    lookup: "When does a rogue get evasion?",
    art: "/wiki/arcana.webp",
  },
  spells: {
    title: "Spells",
    singular: "spell",
    description: "Casting details, components, effects, and damage.",
    lookup: "Is counterspell a reaction?",
    art: "/wiki/arcana.webp",
  },
  creatures: {
    title: "Creatures",
    singular: "creature",
    description: "Quick stats and actions for encounters and prep.",
    lookup: "What is an owlbear's armor class?",
    art: "/wiki/bestiary.webp",
  },
  feats: {
    title: "Feats",
    singular: "feat",
    description: "Special talents and the benefits they give.",
    lookup: "What does Alert actually do?",
    art: "/wiki/arcana.webp",
  },
  items: {
    title: "Items",
    singular: "item",
    description: "Everyday gear and magic items in one catalog.",
    lookup: "How much does plate armor cost?",
    art: "/wiki/equipment.webp",
  },
  rules: {
    title: "Rules",
    singular: "rule",
    description: "Clear answers for common moments at the table.",
    lookup: "How does grappling work?",
    art: "/wiki/arcana.webp",
  },
};

export function isWikiCategory(value: string): value is WikiCategory {
  return WIKI_CATEGORIES.includes(value as WikiCategory);
}

/** Ties a category to its accent hue, set as `--wiki-accent` on the page root. */
export function wikiAccentStyle(category: WikiCategory) {
  return { "--wiki-accent": `var(--wiki-${category})` } as CSSProperties;
}
