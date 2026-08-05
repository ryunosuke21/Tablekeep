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
export type WikiView = "cards" | "table";
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
  art:
    | "/wiki/paths.webp"
    | "/wiki/arcana.webp"
    | "/wiki/bestiary.webp"
    | "/wiki/equipment.webp";
  accent: "lilac" | "rose" | "sage" | "sky";
};

export const WIKI_CATEGORY_META: Record<WikiCategory, WikiCategoryMeta> = {
  species: {
    title: "Species",
    singular: "species",
    description: "Traits and details for the people you can play.",
    art: "/wiki/paths.webp",
    accent: "lilac",
  },
  backgrounds: {
    title: "Backgrounds",
    singular: "background",
    description: "The lives and skills that shaped an adventurer.",
    art: "/wiki/paths.webp",
    accent: "rose",
  },
  classes: {
    title: "Classes",
    singular: "class",
    description: "Core abilities, hit dice, and features by level.",
    art: "/wiki/arcana.webp",
    accent: "lilac",
  },
  spells: {
    title: "Spells",
    singular: "spell",
    description: "Casting details, components, effects, and damage.",
    art: "/wiki/arcana.webp",
    accent: "sky",
  },
  creatures: {
    title: "Creatures",
    singular: "creature",
    description: "Quick stats and actions for encounters and prep.",
    art: "/wiki/bestiary.webp",
    accent: "sage",
  },
  feats: {
    title: "Feats",
    singular: "feat",
    description: "Special talents and the benefits they give.",
    art: "/wiki/arcana.webp",
    accent: "rose",
  },
  items: {
    title: "Items",
    singular: "item",
    description: "Everyday gear and magic items in one catalog.",
    art: "/wiki/equipment.webp",
    accent: "sky",
  },
  rules: {
    title: "Rules",
    singular: "rule",
    description: "Clear answers for common moments at the table.",
    art: "/wiki/arcana.webp",
    accent: "sage",
  },
};

export function isWikiCategory(value: string): value is WikiCategory {
  return WIKI_CATEGORIES.includes(value as WikiCategory);
}
