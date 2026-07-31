import { z } from "zod";

import {
  apiReferenceSchema,
  areaOfEffectSchema,
  choice,
  languageChoiceSchema,
  levelValueSchema,
  optionSet,
  proficiencyChoiceSchema,
  usageSchema,
} from "@/types/common";

/** A choice between other traits (`trait_specific.subtrait_options`). */
export const traitChoiceSchema = choice(
  optionSet(
    z.object({
      option_type: z.literal("reference"),
      item: apiReferenceSchema,
    }),
  ),
);
export type TraitChoice = z.infer<typeof traitChoiceSchema>;

/** A choice between spells (`trait_specific.spell_options`). */
export const traitSpellChoiceSchema = choice(
  optionSet(
    z.object({
      option_type: z.literal("reference"),
      item: apiReferenceSchema,
    }),
  ),
);
export type TraitSpellChoice = z.infer<typeof traitSpellChoiceSchema>;

/**
 * `Action` as used by `trait_specific.breath_weapon`. Unlike a monster action it
 * has no attack bonus, and its DC carries no numeric value.
 */
export const traitActionSchema = z.object({
  name: z.string(),
  desc: z.string(),
  usage: usageSchema.nullable(),
  /** Trait breath weapons expose a DC type and success type but no value. */
  dc: z
    .object({
      dc_type: apiReferenceSchema,
      success_type: z.string(),
    })
    .nullable(),
  damage: z
    .array(
      z.object({
        damage_type: apiReferenceSchema.nullable(),
        damage_at_character_level: z.array(levelValueSchema).nullable(),
      }),
    )
    .nullable(),
  area_of_effect: areaOfEffectSchema.nullable(),
});
export type TraitAction = z.infer<typeof traitActionSchema>;

export const traitSpecificSchema = z.object({
  breath_weapon: traitActionSchema.nullable(),
  damage_type: apiReferenceSchema.nullable(),
  subtrait_options: traitChoiceSchema.nullable(),
  spell_options: traitSpellChoiceSchema.nullable(),
});
export type TraitSpecific = z.infer<typeof traitSpecificSchema>;

/** Full `Trait` — for the `trait(index:)` query. */
export const traitSchema = z.object({
  index: z.string(),
  name: z.string(),
  desc: z.array(z.string()),
  races: z.array(apiReferenceSchema).nullable(),
  subraces: z.array(apiReferenceSchema).nullable(),
  proficiencies: z.array(apiReferenceSchema).nullable(),
  proficiency_choices: proficiencyChoiceSchema.nullable(),
  language_options: languageChoiceSchema.nullable(),
  /** Subtraits point back at their parent; modelled as a reference only. */
  parent: apiReferenceSchema.nullable(),
  trait_specific: traitSpecificSchema.nullable(),
});
export type Trait = z.infer<typeof traitSchema>;

/** Narrow shape for the `traits` list query. */
export const traitListItemSchema = traitSchema.pick({
  index: true,
  name: true,
  races: true,
  subraces: true,
});
export type TraitListItem = z.infer<typeof traitListItemSchema>;

export const traitListSchema = z.array(traitListItemSchema);
export type TraitList = z.infer<typeof traitListSchema>;
