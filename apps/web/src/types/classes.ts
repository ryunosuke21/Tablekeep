import { z } from "zod";

import {
  abilityScorePrerequisiteSchema,
  apiReferenceSchema,
  choice,
  optionSet,
  proficiencyChoiceSchema,
} from "@/types/common";
import {
  equipmentQuantitySchema,
  startingEquipmentChoiceSchema,
} from "@/types/equipments";

export const spellcastingSchema = z.object({
  level: z.number().int(),
  spellcasting_ability: apiReferenceSchema,
  info: z.array(
    z.object({
      name: z.string(),
      desc: z.array(z.string()),
    }),
  ),
});
export type Spellcasting = z.infer<typeof spellcastingSchema>;

/** Ability-score minimums a character must meet to multiclass into the class. */
export const prerequisiteChoiceSchema = choice(
  optionSet(
    z.object({
      option_type: z.literal("score_prerequisite"),
      ability_score: apiReferenceSchema,
      minimum_score: z.number().int(),
    }),
  ),
);
export type PrerequisiteChoice = z.infer<typeof prerequisiteChoiceSchema>;

export const multiClassingSchema = z.object({
  prerequisites: z.array(abilityScorePrerequisiteSchema).nullable(),
  /**
   * Declared non-null by the API but absent for most classes — the server
   * returns a GraphQL error rather than `null`, so only select it when the class
   * actually offers a prerequisite choice (currently just the Fighter).
   */
  prerequisite_options: prerequisiteChoiceSchema.nullable().optional(),
  proficiencies: z.array(apiReferenceSchema).nullable(),
  proficiency_choices: z.array(proficiencyChoiceSchema),
});
export type MultiClassing = z.infer<typeof multiClassingSchema>;

/** Per-class progression counters. Every field is null for classes that lack it. */
export const classSpecificSchema = z.object({
  action_surges: z.number().int().nullable(),
  arcane_recovery_levels: z.number().int().nullable(),
  aura_range: z.number().int().nullable(),
  bardic_inspiration_die: z.number().int().nullable(),
  brutal_critical_dice: z.number().int().nullable(),
  channel_divinity_charges: z.number().int().nullable(),
  creating_spell_slots: z
    .array(
      z.object({
        sorcery_point_cost: z.number().int(),
        spell_slot_level: z.number().int(),
      }),
    )
    .nullable(),
  destroy_undead_cr: z.number().nullable(),
  extra_attacks: z.number().int().nullable(),
  favored_enemies: z.number().int().nullable(),
  favored_terrain: z.number().int().nullable(),
  indomitable_uses: z.number().int().nullable(),
  invocations_known: z.number().int().nullable(),
  ki_points: z.number().int().nullable(),
  magical_secrets_max_5: z.number().int().nullable(),
  magical_secrets_max_7: z.number().int().nullable(),
  magical_secrets_max_9: z.number().int().nullable(),
  martial_arts: z
    .object({
      dice_count: z.number().int(),
      dice_value: z.number().int(),
    })
    .nullable(),
  metamagic_known: z.number().int().nullable(),
  mystic_arcanum_level_6: z.number().int().nullable(),
  mystic_arcanum_level_7: z.number().int().nullable(),
  mystic_arcanum_level_8: z.number().int().nullable(),
  mystic_arcanum_level_9: z.number().int().nullable(),
  rage_count: z.number().int().nullable(),
  rage_damage_bonus: z.number().int().nullable(),
  sneak_attack: z
    .object({
      dice_count: z.number().int(),
      dice_value: z.number().int(),
    })
    .nullable(),
  song_of_rest_die: z.number().int().nullable(),
  sorcery_points: z.number().int().nullable(),
  unarmored_movement: z.number().int().nullable(),
  wild_shape_fly: z.boolean().nullable(),
  wild_shape_max_cr: z.number().nullable(),
  wild_shape_swim: z.boolean().nullable(),
});
export type ClassSpecific = z.infer<typeof classSpecificSchema>;

export const levelSpellcastingSchema = z.object({
  cantrips_known: z.number().int().nullable(),
  spells_known: z.number().int().nullable(),
  spell_slots_level_1: z.number().int(),
  spell_slots_level_2: z.number().int(),
  spell_slots_level_3: z.number().int(),
  spell_slots_level_4: z.number().int(),
  spell_slots_level_5: z.number().int(),
  spell_slots_level_6: z.number().int().nullable(),
  spell_slots_level_7: z.number().int().nullable(),
  spell_slots_level_8: z.number().int().nullable(),
  spell_slots_level_9: z.number().int().nullable(),
});
export type LevelSpellcasting = z.infer<typeof levelSpellcastingSchema>;

/**
 * A `Level` row. `Level` has no `name`, so it is keyed by `index` + `level`.
 * Also reachable directly via the `level(index:)` / `levels` queries.
 */
export const classLevelSchema = z.object({
  index: z.string(),
  level: z.number().int(),
  ability_score_bonuses: z.number().int().nullable(),
  prof_bonus: z.number().int().nullable(),
  features: z.array(apiReferenceSchema).nullable(),
  spellcasting: levelSpellcastingSchema.nullable(),
  class_specific: classSpecificSchema.nullable(),
  subclass: apiReferenceSchema.nullable(),
  subclass_specific: z
    .object({
      additional_magical_secrets_max_lvl: z.number().int().nullable(),
      aura_range: z.number().int().nullable(),
    })
    .nullable(),
});
export type ClassLevel = z.infer<typeof classLevelSchema>;

/** Full `Class` — for the `class(index:)` query. */
export const classSchema = z.object({
  index: z.string(),
  name: z.string(),
  hit_die: z.number().int(),
  proficiencies: z.array(apiReferenceSchema).nullable(),
  proficiency_choices: z.array(proficiencyChoiceSchema),
  saving_throws: z.array(apiReferenceSchema).nullable(),
  starting_equipment: z.array(equipmentQuantitySchema).nullable(),
  starting_equipment_options: z.array(startingEquipmentChoiceSchema).nullable(),
  spellcasting: spellcastingSchema.nullable(),
  spells: z.array(apiReferenceSchema),
  subclasses: z.array(apiReferenceSchema).nullable(),
  class_levels: z.array(classLevelSchema),
  multi_classing: multiClassingSchema.nullable(),
});
export type Class = z.infer<typeof classSchema>;

/** Narrow shape for the `classes` list query. */
export const classListItemSchema = classSchema.pick({
  index: true,
  name: true,
  hit_die: true,
  subclasses: true,
});
export type ClassListItem = z.infer<typeof classListItemSchema>;

export const classListSchema = z.array(classListItemSchema);
export type ClassList = z.infer<typeof classListSchema>;
