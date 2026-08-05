import { TRPCError } from "@trpc/server";
import { z } from "zod";

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
  WikiSource,
  WikiSpecies,
  WikiSpeciesListItem,
  WikiSpell,
  WikiSpellListItem,
} from "@/types/wiki";

import { OPEN5E_SOURCE_KEY } from "./client";

const referenceSchema = z.object({
  key: z.string(),
  name: z.string(),
});

export const documentSchema = z.object({
  key: z.string(),
  name: z.string(),
  display_name: z.string(),
  publisher: referenceSchema,
  gamesystem: referenceSchema,
  permalink: z.string(),
});

function assertSource(sourceKey: string, entity: string) {
  if (sourceKey !== OPEN5E_SOURCE_KEY) {
    throw new TRPCError({
      code: "BAD_GATEWAY",
      message: `The reference-data service returned ${entity} from an unexpected source`,
    });
  }
}

function mapSource(document: z.infer<typeof documentSchema>): WikiSource {
  assertSource(document.key, "content");
  return {
    key: document.key,
    name: document.name,
    displayName: document.display_name,
    gameSystem: document.gamesystem,
    permalink: document.permalink,
    publisher: document.publisher,
  };
}

export const catalogListItemSchema = z.object({
  key: z.string(),
  name: z.string(),
  document: documentSchema,
});

export function mapCatalogListItem(
  value: z.infer<typeof catalogListItemSchema>,
): WikiCatalogListItem {
  return {
    key: value.key,
    name: value.name,
    source: mapSource(value.document),
  };
}

export const classListItemSchema = catalogListItemSchema.extend({
  hit_dice: z.string(),
  caster_type: z.string(),
  subclass_of: referenceSchema.nullable(),
});

export function mapClassListItem(
  value: z.infer<typeof classListItemSchema>,
): WikiClassListItem {
  return {
    ...mapCatalogListItem(value),
    hitDice: value.hit_dice,
    casterType: value.caster_type,
    isSubclass: value.subclass_of !== null,
    parentClass: value.subclass_of,
  };
}

export const creatureListItemSchema = catalogListItemSchema.extend({
  type: referenceSchema,
  size: referenceSchema,
  challenge_rating: z.number(),
  category: z.string(),
  armor_class: z.number(),
  hit_points: z.number().int(),
});

export function mapCreatureListItem(
  value: z.infer<typeof creatureListItemSchema>,
): WikiCreatureListItem {
  return {
    ...mapCatalogListItem(value),
    type: value.type,
    size: value.size,
    challengeRating: value.challenge_rating,
    category: value.category,
    armorClass: value.armor_class,
    hitPoints: value.hit_points,
  };
}

export const featListItemSchema = catalogListItemSchema.extend({
  type: z.string(),
  has_prerequisite: z.boolean(),
});

export function mapFeatListItem(
  value: z.infer<typeof featListItemSchema>,
): WikiFeatListItem {
  return {
    ...mapCatalogListItem(value),
    type: value.type,
    hasPrerequisite: value.has_prerequisite,
  };
}

export const speciesListItemSchema = catalogListItemSchema.extend({
  is_subspecies: z.boolean(),
  subspecies_of: referenceSchema.nullable(),
});

export function mapSpeciesListItem(
  value: z.infer<typeof speciesListItemSchema>,
): WikiSpeciesListItem {
  return {
    ...mapCatalogListItem(value),
    isSubspecies: value.is_subspecies,
    parentSpecies: value.subspecies_of,
  };
}

export const itemListItemSchema = catalogListItemSchema.extend({
  category: referenceSchema,
});

export function mapItemListItem(
  value: z.infer<typeof itemListItemSchema>,
): WikiItemListItem {
  return {
    ...mapCatalogListItem(value),
    category: value.category,
  };
}

export const magicItemListItemSchema = itemListItemSchema.extend({
  rarity: referenceSchema.extend({ rank: z.number().int() }).nullable(),
  requires_attunement: z.boolean(),
});

export function mapMagicItemListItem(
  value: z.infer<typeof magicItemListItemSchema>,
): WikiMagicItemListItem {
  return {
    ...mapItemListItem(value),
    rarity: value.rarity,
    requiresAttunement: value.requires_attunement,
  };
}

export const ruleListItemSchema = z.object({
  key: z.string(),
  name: z.string(),
  document: z.string(),
});

export function mapRuleListItem(
  value: z.infer<typeof ruleListItemSchema>,
): WikiRuleListItem {
  assertSource(value.document, "rule");
  return { key: value.key, name: value.name, sourceKey: value.document };
}

export const spellListItemSchema = catalogListItemSchema.extend({
  level: z.number().int(),
  school: referenceSchema,
  classes: z.array(referenceSchema),
  casting_time: z.string(),
  concentration: z.boolean(),
  ritual: z.boolean(),
  verbal: z.boolean(),
  somatic: z.boolean(),
  material: z.boolean(),
});

export function mapSpellListItem(
  value: z.infer<typeof spellListItemSchema>,
): WikiSpellListItem {
  const components: Array<"V" | "S" | "M"> = [];
  if (value.verbal) components.push("V");
  if (value.somatic) components.push("S");
  if (value.material) components.push("M");
  return {
    ...mapCatalogListItem(value),
    level: value.level,
    school: value.school,
    classes: value.classes,
    castingTime: value.casting_time,
    concentration: value.concentration,
    ritual: value.ritual,
    components,
  };
}

export const backgroundSchema = z.object({
  key: z.string(),
  name: z.string(),
  desc: z.string(),
  benefits: z.array(
    z.object({
      name: z.string().nullish(),
      desc: z.string(),
      type: z.string().nullish(),
    }),
  ),
  document: documentSchema,
});

export function mapBackground(
  value: z.infer<typeof backgroundSchema>,
): WikiBackground {
  return {
    key: value.key,
    name: value.name,
    description: value.desc,
    benefits: value.benefits.map((benefit) => ({
      name: benefit.name ?? null,
      description: benefit.desc,
      type: benefit.type ?? null,
    })),
    source: mapSource(value.document),
  };
}

export const featSchema = z.object({
  key: z.string(),
  name: z.string(),
  desc: z.string(),
  type: z.string(),
  has_prerequisite: z.boolean(),
  prerequisite: z.string(),
  benefits: z.array(z.object({ desc: z.string() })),
  document: documentSchema,
});

export function mapFeat(value: z.infer<typeof featSchema>): WikiFeat {
  return {
    key: value.key,
    name: value.name,
    description: value.desc,
    type: value.type,
    hasPrerequisite: value.has_prerequisite,
    prerequisite: value.prerequisite,
    benefits: value.benefits.map((benefit) => ({
      description: benefit.desc,
    })),
    source: mapSource(value.document),
  };
}

export const speciesSchema = z.object({
  key: z.string(),
  name: z.string(),
  desc: z.string(),
  is_subspecies: z.boolean(),
  subspecies_of: referenceSchema.nullable(),
  traits: z.array(
    z.object({
      name: z.string(),
      desc: z.string(),
      type: z.string().nullable(),
      order: z.number().int(),
    }),
  ),
  document: documentSchema,
});

export function mapSpecies(value: z.infer<typeof speciesSchema>): WikiSpecies {
  return {
    key: value.key,
    name: value.name,
    description: value.desc,
    isSubspecies: value.is_subspecies,
    parentSpecies: value.subspecies_of,
    traits: value.traits.map((trait) => ({
      name: trait.name,
      description: trait.desc,
      type: trait.type,
      order: trait.order,
    })),
    source: mapSource(value.document),
  };
}

export const ruleSchema = z.object({
  key: z.string(),
  name: z.string(),
  desc: z.string(),
  index: z.number().int(),
  initialHeaderLevel: z.number().int(),
  document: z.string(),
  ruleset: z.string(),
});

export function mapRule(value: z.infer<typeof ruleSchema>): WikiRule {
  assertSource(value.document, "rule");
  return {
    key: value.key,
    name: value.name,
    description: value.desc,
    index: value.index,
    initialHeaderLevel: value.initialHeaderLevel,
    ruleset: value.ruleset,
    sourceKey: value.document,
  };
}

const classFeatureSchema = z.object({
  key: z.string(),
  name: z.string(),
  desc: z.string(),
  feature_type: z.string(),
  gained_at: z.array(
    z.object({
      level: z.number().int(),
      detail: z.string().nullable(),
    }),
  ),
  data_for_class_table: z.array(
    z.object({
      level: z.number().int(),
      column_value: z.string(),
    }),
  ),
});

export const classSchema = z.object({
  key: z.string(),
  name: z.string(),
  desc: z.string(),
  hit_dice: z.string(),
  caster_type: z.string(),
  subclass_of: referenceSchema.nullable(),
  saving_throws: z.array(z.object({ name: z.string() })),
  hit_points: z.object({
    hit_dice: z.string(),
    hit_dice_name: z.string(),
    hit_points_at_1st_level: z.string(),
    hit_points_at_higher_levels: z.string(),
  }),
  features: z.array(classFeatureSchema),
  document: documentSchema,
});

export function mapClass(value: z.infer<typeof classSchema>): WikiClass {
  return {
    key: value.key,
    name: value.name,
    description: value.desc,
    hitDice: value.hit_dice,
    casterType: value.caster_type,
    isSubclass: value.subclass_of !== null,
    parentClass: value.subclass_of,
    savingThrows: value.saving_throws.map(({ name }) => name),
    hitPoints: {
      hitDice: value.hit_points.hit_dice,
      name: value.hit_points.hit_dice_name,
      atFirstLevel: value.hit_points.hit_points_at_1st_level,
      atHigherLevels: value.hit_points.hit_points_at_higher_levels,
    },
    features: value.features.map((feature) => ({
      key: feature.key,
      name: feature.name,
      description: feature.desc,
      type: feature.feature_type,
      gainedAt: feature.gained_at,
      tableData: feature.data_for_class_table.map((row) => ({
        level: row.level,
        value: row.column_value,
      })),
    })),
    source: mapSource(value.document),
  };
}

const itemBaseShape = {
  key: z.string(),
  name: z.string(),
  desc: z.string(),
  category: referenceSchema,
  size: referenceSchema.nullable(),
  weight: z.union([z.string(), z.number()]).nullish(),
  weight_unit: z.string().nullish(),
  cost: z.union([z.string(), z.number()]).nullish(),
  weapon: referenceSchema.passthrough().nullable(),
  armor: referenceSchema
    .extend({ ac_display: z.string().nullish() })
    .passthrough()
    .nullable(),
  document: documentSchema,
};

export const itemSchema = z.object(itemBaseShape);
export const magicItemSchema = z.object({
  ...itemBaseShape,
  rarity: referenceSchema.extend({ rank: z.number().int() }).nullable(),
  requires_attunement: z.boolean(),
  attunement_detail: z.string().nullable(),
});

function mapItemBase(value: z.infer<typeof itemSchema>): WikiItem {
  return {
    key: value.key,
    name: value.name,
    description: value.desc,
    category: value.category,
    size: value.size,
    weight: value.weight == null ? null : String(value.weight),
    weightUnit: value.weight_unit ?? null,
    cost: value.cost == null ? null : String(value.cost),
    weapon: value.weapon
      ? { key: value.weapon.key, name: value.weapon.name }
      : null,
    armor: value.armor
      ? {
          key: value.armor.key,
          name: value.armor.name,
          armorClass: value.armor.ac_display ?? null,
        }
      : null,
    source: mapSource(value.document),
  };
}

export const mapItem = mapItemBase;

export function mapMagicItem(
  value: z.infer<typeof magicItemSchema>,
): WikiMagicItem {
  return {
    ...mapItemBase(value),
    rarity: value.rarity,
    requiresAttunement: value.requires_attunement,
    attunementDetail: value.attunement_detail,
  };
}

const numericRecordSchema = z.record(z.string(), z.number());
const speedSchema = z.record(
  z.string(),
  z.union([z.number(), z.string(), z.boolean()]),
);

export const creatureSchema = z.object({
  key: z.string(),
  name: z.string(),
  type: referenceSchema,
  size: referenceSchema,
  challenge_rating: z.number(),
  speed_all: speedSchema,
  category: z.string(),
  subcategory: z.string().nullable(),
  alignment: z.string(),
  armor_class: z.number(),
  armor_detail: z.string(),
  hit_points: z.number().int(),
  hit_dice: z.string(),
  experience_points: z.number().int(),
  ability_scores: numericRecordSchema,
  saving_throws: numericRecordSchema,
  skill_bonuses: numericRecordSchema,
  passive_perception: z.number().int(),
  languages: z.object({ as_string: z.string() }),
  actions: z.array(
    z.object({
      name: z.string(),
      desc: z.string(),
      action_type: z.string(),
      legendary_action_cost: z.number().int().nullish(),
    }),
  ),
  traits: z.array(z.object({ name: z.string(), desc: z.string() })),
  document: documentSchema,
});

export function mapCreature(
  value: z.infer<typeof creatureSchema>,
): WikiCreature {
  return {
    key: value.key,
    name: value.name,
    type: value.type,
    size: value.size,
    category: value.category,
    subcategory: value.subcategory,
    alignment: value.alignment,
    challengeRating: value.challenge_rating,
    armorClass: value.armor_class,
    armorDetail: value.armor_detail,
    hitPoints: value.hit_points,
    hitDice: value.hit_dice,
    experiencePoints: value.experience_points,
    speed: value.speed_all,
    abilityScores: value.ability_scores,
    savingThrows: value.saving_throws,
    skillBonuses: value.skill_bonuses,
    passivePerception: value.passive_perception,
    languages: value.languages.as_string,
    actions: value.actions.map((action) => ({
      name: action.name,
      description: action.desc,
      type: action.action_type,
      legendaryActionCost: action.legendary_action_cost ?? 0,
    })),
    traits: value.traits.map((trait) => ({
      name: trait.name,
      description: trait.desc,
    })),
    source: mapSource(value.document),
  };
}

const castingOptionSchema = z.object({
  type: z.string(),
  damage_roll: z.string().nullable(),
  target_count: z.number().int().nullable(),
  duration: z.string().nullable(),
  range: z.number().nullable(),
  concentration: z.boolean().nullable(),
  shape_size: z.number().nullable(),
  desc: z.string().nullable(),
});

export const spellSchema = z.object({
  key: z.string(),
  name: z.string(),
  desc: z.string(),
  higher_level: z.string(),
  level: z.number().int(),
  school: referenceSchema,
  classes: z.array(referenceSchema),
  casting_time: z.string(),
  reaction_condition: z.string().nullable(),
  range: z.number().nullable(),
  range_text: z.string(),
  range_unit: z.string().nullable(),
  duration: z.string(),
  concentration: z.boolean(),
  ritual: z.boolean(),
  verbal: z.boolean(),
  somatic: z.boolean(),
  material: z.boolean(),
  material_specified: z.string().nullable(),
  material_cost: z.union([z.string(), z.number()]).nullable(),
  material_consumed: z.boolean(),
  target_type: z.string(),
  target_count: z.number().int().nullable(),
  saving_throw_ability: z.string().nullish(),
  attack_roll: z.boolean(),
  damage_roll: z.string(),
  damage_types: z.array(z.string()),
  shape_type: z.string().nullable(),
  shape_size: z.number().nullable(),
  shape_size_unit: z.string().nullable(),
  casting_options: z.array(castingOptionSchema),
  document: documentSchema,
});

export function mapSpell(value: z.infer<typeof spellSchema>): WikiSpell {
  const components: Array<"V" | "S" | "M"> = [];
  if (value.verbal) components.push("V");
  if (value.somatic) components.push("S");
  if (value.material) components.push("M");

  return {
    key: value.key,
    name: value.name,
    description: value.desc,
    higherLevel: value.higher_level,
    level: value.level,
    school: value.school,
    classes: value.classes,
    castingTime: value.casting_time,
    reactionCondition: value.reaction_condition,
    range: value.range,
    rangeText: value.range_text,
    rangeUnit: value.range_unit,
    duration: value.duration,
    concentration: value.concentration,
    ritual: value.ritual,
    components,
    material: value.material_specified,
    materialCost:
      value.material_cost === null ? null : String(value.material_cost),
    materialConsumed: value.material_consumed,
    targetType: value.target_type,
    targetCount: value.target_count,
    savingThrowAbility: value.saving_throw_ability ?? "",
    attackRoll: value.attack_roll,
    damageRoll: value.damage_roll,
    damageTypes: value.damage_types,
    shapeType: value.shape_type,
    shapeSize: value.shape_size,
    shapeSizeUnit: value.shape_size_unit,
    castingOptions: value.casting_options.map((option) => ({
      type: option.type,
      damageRoll: option.damage_roll,
      targetCount: option.target_count,
      duration: option.duration,
      range: option.range,
      concentration: option.concentration,
      shapeSize: option.shape_size,
      description: option.desc,
    })),
    source: mapSource(value.document),
  };
}
