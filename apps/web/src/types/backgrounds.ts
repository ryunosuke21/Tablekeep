import { z } from "zod";

import {
  apiReferenceSchema,
  choice,
  languageChoiceSchema,
  optionSet,
} from "@/types/common";
import {
  baseEquipmentSchema,
  startingEquipmentChoiceSchema,
} from "@/types/equipments";

/** A roll table of flavour text — personality traits, ideals, bonds, flaws. */
export const stringChoiceSchema = choice(
  optionSet(
    z.object({
      option_type: z.literal("string"),
      string: z.string(),
    }),
  ),
);
export type StringChoice = z.infer<typeof stringChoiceSchema>;

/** Ideals carry the alignments they suit, so they get their own option shape. */
export const idealChoiceSchema = choice(
  optionSet(
    z.object({
      option_type: z.literal("ideal"),
      desc: z.string(),
      alignments: z.array(apiReferenceSchema),
    }),
  ),
);
export type IdealChoice = z.infer<typeof idealChoiceSchema>;

export const backgroundFeatureSchema = z.object({
  name: z.string(),
  desc: z.array(z.string()),
});
export type BackgroundFeature = z.infer<typeof backgroundFeatureSchema>;

/** Full `Background` — for the `background(index:)` query. */
export const backgroundSchema = z.object({
  index: z.string(),
  name: z.string(),
  feature: backgroundFeatureSchema,
  starting_proficiencies: z.array(apiReferenceSchema),
  starting_equipment: z.array(
    z.object({
      quantity: z.number().int(),
      equipment: baseEquipmentSchema,
    }),
  ),
  starting_equipment_options: z.array(startingEquipmentChoiceSchema).nullable(),
  language_options: languageChoiceSchema.nullable(),
  personality_traits: stringChoiceSchema.nullable(),
  ideals: idealChoiceSchema.nullable(),
  bonds: stringChoiceSchema.nullable(),
  flaws: stringChoiceSchema.nullable(),
});
export type Background = z.infer<typeof backgroundSchema>;

/** Narrow shape for the `backgrounds` list query. */
export const backgroundListItemSchema = backgroundSchema.pick({
  index: true,
  name: true,
  feature: true,
});
export type BackgroundListItem = z.infer<typeof backgroundListItemSchema>;

export const backgroundListSchema = z.array(backgroundListItemSchema);
export type BackgroundList = z.infer<typeof backgroundListSchema>;
