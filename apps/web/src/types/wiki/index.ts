import type { WikiReference, WikiSource } from "./common";

export * from "./common";

export interface WikiCatalogListItem {
  key: string;
  name: string;
  source: WikiSource;
}

export interface WikiClassListItem extends WikiCatalogListItem {
  casterType: string;
  hitDice: string;
  isSubclass: boolean;
  parentClass: WikiReference | null;
}

export interface WikiCreatureListItem extends WikiCatalogListItem {
  armorClass: number;
  category: string;
  challengeRating: number;
  hitPoints: number;
  size: WikiReference;
  type: WikiReference;
}

export interface WikiFeatListItem extends WikiCatalogListItem {
  hasPrerequisite: boolean;
  type: string;
}

export interface WikiItemListItem extends WikiCatalogListItem {
  category: WikiReference;
}

export interface WikiMagicItemListItem extends WikiItemListItem {
  rarity: (WikiReference & { rank: number }) | null;
  requiresAttunement: boolean;
}

export interface WikiRuleListItem {
  key: string;
  name: string;
  sourceKey: string;
}

export interface WikiSpeciesListItem extends WikiCatalogListItem {
  isSubspecies: boolean;
  parentSpecies: WikiReference | null;
}

export interface WikiSpellListItem extends WikiCatalogListItem {
  castingTime: string;
  classes: WikiReference[];
  components: Array<"V" | "S" | "M">;
  concentration: boolean;
  level: number;
  ritual: boolean;
  school: WikiReference;
}

export interface WikiBackground {
  key: string;
  name: string;
  description: string;
  benefits: Array<{
    name: string | null;
    description: string;
    type: string | null;
  }>;
  source: WikiSource;
}

export interface WikiFeat {
  key: string;
  name: string;
  description: string;
  type: string;
  hasPrerequisite: boolean;
  prerequisite: string;
  benefits: Array<{ description: string }>;
  source: WikiSource;
}

export interface WikiSpecies {
  key: string;
  name: string;
  description: string;
  isSubspecies: boolean;
  parentSpecies: WikiReference | null;
  traits: Array<{
    name: string;
    description: string;
    type: string | null;
    order: number;
  }>;
  source: WikiSource;
}

export interface WikiRule {
  key: string;
  name: string;
  description: string;
  index: number;
  initialHeaderLevel: number;
  ruleset: string;
  sourceKey: string;
}

export interface WikiClassFeature {
  key: string;
  name: string;
  description: string;
  type: string;
  gainedAt: Array<{ level: number; detail: string | null }>;
  tableData: Array<{ level: number; value: string }>;
}

export interface WikiClass {
  key: string;
  name: string;
  description: string;
  hitDice: string;
  casterType: string;
  isSubclass: boolean;
  parentClass: WikiReference | null;
  savingThrows: string[];
  hitPoints: {
    hitDice: string;
    name: string;
    atFirstLevel: string;
    atHigherLevels: string;
  };
  features: WikiClassFeature[];
  source: WikiSource;
}

export interface WikiItem {
  key: string;
  name: string;
  description: string;
  category: WikiReference;
  size: WikiReference | null;
  weight: string | null;
  weightUnit: string | null;
  cost: string | null;
  weapon: WikiReference | null;
  armor: (WikiReference & { armorClass: string | null }) | null;
  source: WikiSource;
}

export interface WikiMagicItem extends WikiItem {
  rarity: (WikiReference & { rank: number }) | null;
  requiresAttunement: boolean;
  attunementDetail: string | null;
}

export interface WikiCreature {
  key: string;
  name: string;
  type: WikiReference;
  size: WikiReference;
  category: string;
  subcategory: string | null;
  alignment: string;
  challengeRating: number;
  armorClass: number;
  armorDetail: string;
  hitPoints: number;
  hitDice: string;
  experiencePoints: number;
  speed: Record<string, number | string | boolean>;
  abilityScores: Record<string, number>;
  savingThrows: Record<string, number>;
  skillBonuses: Record<string, number>;
  passivePerception: number;
  languages: string;
  actions: Array<{
    name: string;
    description: string;
    type: string;
    legendaryActionCost: number;
  }>;
  traits: Array<{ name: string; description: string }>;
  source: WikiSource;
}

export interface WikiSpellCastingOption {
  type: string;
  damageRoll: string | null;
  targetCount: number | null;
  duration: string | null;
  range: number | null;
  concentration: boolean | null;
  shapeSize: number | null;
  description: string | null;
}

export interface WikiSpell {
  key: string;
  name: string;
  description: string;
  higherLevel: string;
  level: number;
  school: WikiReference;
  classes: WikiReference[];
  castingTime: string;
  reactionCondition: string | null;
  range: number | null;
  rangeText: string;
  rangeUnit: string | null;
  duration: string;
  concentration: boolean;
  ritual: boolean;
  components: Array<"V" | "S" | "M">;
  material: string | null;
  materialCost: string | null;
  materialConsumed: boolean;
  targetType: string;
  targetCount: number | null;
  savingThrowAbility: string;
  attackRoll: boolean;
  damageRoll: string;
  damageTypes: string[];
  shapeType: string | null;
  shapeSize: number | null;
  shapeSizeUnit: string | null;
  castingOptions: WikiSpellCastingOption[];
  source: WikiSource;
}
