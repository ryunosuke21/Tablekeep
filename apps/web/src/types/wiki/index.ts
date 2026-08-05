import { z } from "zod";

import { wikiReferenceSchema, wikiSourceSchema } from "./common";

export * from "./common";

const nullableReferenceSchema = wikiReferenceSchema.nullable().default(null);
const rankedReferenceSchema = wikiReferenceSchema.extend({
  rank: z.number().int(),
});
const spellComponentSchema = z.enum(["V", "S", "M"]);

export const wikiCatalogListItemSchema = z.object({
  key: z.string().min(1),
  name: z.string().min(1),
  source: wikiSourceSchema,
});
export type WikiCatalogListItem = z.infer<typeof wikiCatalogListItemSchema>;

export const wikiClassListItemSchema = wikiCatalogListItemSchema.extend({
  casterType: z.string(),
  hitDice: z.string(),
  isSubclass: z.boolean().default(false),
  parentClass: nullableReferenceSchema,
});
export type WikiClassListItem = z.infer<typeof wikiClassListItemSchema>;

export const wikiCreatureListItemSchema = wikiCatalogListItemSchema.extend({
  armorClass: z.number(),
  category: z.string(),
  challengeRating: z.number().nonnegative(),
  hitPoints: z.number().int().nonnegative(),
  size: wikiReferenceSchema,
  type: wikiReferenceSchema,
});
export type WikiCreatureListItem = z.infer<typeof wikiCreatureListItemSchema>;

export const wikiFeatListItemSchema = wikiCatalogListItemSchema.extend({
  hasPrerequisite: z.boolean().default(false),
  type: z.string(),
});
export type WikiFeatListItem = z.infer<typeof wikiFeatListItemSchema>;

export const wikiItemListItemSchema = wikiCatalogListItemSchema.extend({
  category: wikiReferenceSchema,
});
export type WikiItemListItem = z.infer<typeof wikiItemListItemSchema>;

export const wikiMagicItemListItemSchema = wikiItemListItemSchema.extend({
  rarity: rankedReferenceSchema.nullable().default(null),
  requiresAttunement: z.boolean().default(false),
});
export type WikiMagicItemListItem = z.infer<typeof wikiMagicItemListItemSchema>;

export const wikiRuleListItemSchema = z.object({
  key: z.string().min(1),
  name: z.string().min(1),
  sourceKey: z.string().min(1),
});
export type WikiRuleListItem = z.infer<typeof wikiRuleListItemSchema>;

export const wikiSpeciesListItemSchema = wikiCatalogListItemSchema.extend({
  isSubspecies: z.boolean().default(false),
  parentSpecies: nullableReferenceSchema,
});
export type WikiSpeciesListItem = z.infer<typeof wikiSpeciesListItemSchema>;

export const wikiSpellListItemSchema = wikiCatalogListItemSchema.extend({
  castingTime: z.string(),
  classes: z.array(wikiReferenceSchema).default([]),
  components: z.array(spellComponentSchema).default([]),
  concentration: z.boolean().default(false),
  level: z.number().int().min(0).max(9),
  ritual: z.boolean().default(false),
  school: wikiReferenceSchema,
});
export type WikiSpellListItem = z.infer<typeof wikiSpellListItemSchema>;

const wikiBackgroundBenefitSchema = z.object({
  name: z.string().nullable().default(null),
  description: z.string().default(""),
  type: z.string().nullable().default(null),
});

export const wikiBackgroundSchema = z.object({
  key: z.string().min(1),
  name: z.string().min(1),
  description: z.string().default(""),
  benefits: z.array(wikiBackgroundBenefitSchema).default([]),
  source: wikiSourceSchema,
});
export type WikiBackground = z.infer<typeof wikiBackgroundSchema>;

const wikiFeatBenefitSchema = z.object({
  description: z.string().default(""),
});

export const wikiFeatSchema = z.object({
  key: z.string().min(1),
  name: z.string().min(1),
  description: z.string().default(""),
  type: z.string(),
  hasPrerequisite: z.boolean().default(false),
  prerequisite: z.string().default(""),
  benefits: z.array(wikiFeatBenefitSchema).default([]),
  source: wikiSourceSchema,
});
export type WikiFeat = z.infer<typeof wikiFeatSchema>;

const wikiSpeciesTraitSchema = z.object({
  name: z.string().min(1),
  description: z.string().default(""),
  type: z.string().nullable().default(null),
  order: z.number().int(),
});

export const wikiSpeciesSchema = z.object({
  key: z.string().min(1),
  name: z.string().min(1),
  description: z.string().default(""),
  isSubspecies: z.boolean().default(false),
  parentSpecies: nullableReferenceSchema,
  traits: z.array(wikiSpeciesTraitSchema).default([]),
  source: wikiSourceSchema,
});
export type WikiSpecies = z.infer<typeof wikiSpeciesSchema>;

export const wikiRuleSchema = z.object({
  key: z.string().min(1),
  name: z.string().min(1),
  description: z.string().default(""),
  index: z.number().int(),
  initialHeaderLevel: z.number().int().nonnegative(),
  ruleset: z.string(),
  sourceKey: z.string().min(1),
});
export type WikiRule = z.infer<typeof wikiRuleSchema>;

export const wikiClassFeatureSchema = z.object({
  key: z.string().min(1),
  name: z.string().min(1),
  description: z.string().default(""),
  type: z.string(),
  gainedAt: z
    .array(
      z.object({
        level: z.number().int().min(1),
        detail: z.string().nullable().default(null),
      }),
    )
    .default([]),
  tableData: z
    .array(
      z.object({
        level: z.number().int().min(1),
        value: z.string(),
      }),
    )
    .default([]),
});
export type WikiClassFeature = z.infer<typeof wikiClassFeatureSchema>;

const wikiClassHitPointsSchema = z.object({
  hitDice: z.string(),
  name: z.string(),
  atFirstLevel: z.string(),
  atHigherLevels: z.string(),
});

export const wikiClassSchema = z.object({
  key: z.string().min(1),
  name: z.string().min(1),
  description: z.string().default(""),
  hitDice: z.string(),
  casterType: z.string(),
  isSubclass: z.boolean().default(false),
  parentClass: nullableReferenceSchema,
  savingThrows: z.array(z.string()).default([]),
  hitPoints: wikiClassHitPointsSchema,
  features: z.array(wikiClassFeatureSchema).default([]),
  source: wikiSourceSchema,
});
export type WikiClass = z.infer<typeof wikiClassSchema>;

const wikiArmorReferenceSchema = wikiReferenceSchema.extend({
  armorClass: z.string().nullable().default(null),
});

export const wikiItemSchema = z.object({
  key: z.string().min(1),
  name: z.string().min(1),
  description: z.string().default(""),
  category: wikiReferenceSchema,
  size: nullableReferenceSchema,
  weight: z.string().nullable().default(null),
  weightUnit: z.string().nullable().default(null),
  cost: z.string().nullable().default(null),
  weapon: nullableReferenceSchema,
  armor: wikiArmorReferenceSchema.nullable().default(null),
  source: wikiSourceSchema,
});
export type WikiItem = z.infer<typeof wikiItemSchema>;

export const wikiMagicItemSchema = wikiItemSchema.extend({
  rarity: rankedReferenceSchema.nullable().default(null),
  requiresAttunement: z.boolean().default(false),
  attunementDetail: z.string().nullable().default(null),
});
export type WikiMagicItem = z.infer<typeof wikiMagicItemSchema>;

const creatureStatRecordSchema = z.record(z.string(), z.number());
const creatureSpeedSchema = z.record(
  z.string(),
  z.union([z.number(), z.string(), z.boolean()]),
);
const wikiCreatureActionSchema = z.object({
  name: z.string().min(1),
  description: z.string().default(""),
  type: z.string(),
  legendaryActionCost: z.number().int().nonnegative().default(0),
});
const wikiCreatureTraitSchema = z.object({
  name: z.string().min(1),
  description: z.string().default(""),
});

export const wikiCreatureSchema = z.object({
  key: z.string().min(1),
  name: z.string().min(1),
  type: wikiReferenceSchema,
  size: wikiReferenceSchema,
  category: z.string(),
  subcategory: z.string().nullable().default(null),
  alignment: z.string(),
  challengeRating: z.number().nonnegative(),
  armorClass: z.number(),
  armorDetail: z.string().default(""),
  hitPoints: z.number().int().nonnegative(),
  hitDice: z.string(),
  experiencePoints: z.number().int().nonnegative(),
  speed: creatureSpeedSchema.default({}),
  abilityScores: creatureStatRecordSchema.default({}),
  savingThrows: creatureStatRecordSchema.default({}),
  skillBonuses: creatureStatRecordSchema.default({}),
  passivePerception: z.number().int().nonnegative(),
  languages: z.string().default(""),
  actions: z.array(wikiCreatureActionSchema).default([]),
  traits: z.array(wikiCreatureTraitSchema).default([]),
  source: wikiSourceSchema,
});
export type WikiCreature = z.infer<typeof wikiCreatureSchema>;

export const wikiSpellCastingOptionSchema = z.object({
  type: z.string(),
  damageRoll: z.string().nullable().default(null),
  targetCount: z.number().int().nullable().default(null),
  duration: z.string().nullable().default(null),
  range: z.number().nullable().default(null),
  concentration: z.boolean().nullable().default(null),
  shapeSize: z.number().nullable().default(null),
  description: z.string().nullable().default(null),
});
export type WikiSpellCastingOption = z.infer<
  typeof wikiSpellCastingOptionSchema
>;

export const wikiSpellSchema = z.object({
  key: z.string().min(1),
  name: z.string().min(1),
  description: z.string().default(""),
  higherLevel: z.string().default(""),
  level: z.number().int().min(0).max(9),
  school: wikiReferenceSchema,
  classes: z.array(wikiReferenceSchema).default([]),
  castingTime: z.string(),
  reactionCondition: z.string().nullable().default(null),
  range: z.number().nullable().default(null),
  rangeText: z.string(),
  rangeUnit: z.string().nullable().default(null),
  duration: z.string(),
  concentration: z.boolean().default(false),
  ritual: z.boolean().default(false),
  components: z.array(spellComponentSchema).default([]),
  material: z.string().nullable().default(null),
  materialCost: z.string().nullable().default(null),
  materialConsumed: z.boolean().default(false),
  targetType: z.string(),
  targetCount: z.number().int().nullable().default(null),
  savingThrowAbility: z.string().default(""),
  attackRoll: z.boolean().default(false),
  damageRoll: z.string().default(""),
  damageTypes: z.array(z.string()).default([]),
  shapeType: z.string().nullable().default(null),
  shapeSize: z.number().nullable().default(null),
  shapeSizeUnit: z.string().nullable().default(null),
  castingOptions: z.array(wikiSpellCastingOptionSchema).default([]),
  source: wikiSourceSchema,
});
export type WikiSpell = z.infer<typeof wikiSpellSchema>;
