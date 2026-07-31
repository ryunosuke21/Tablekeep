import { z } from "zod";

import {
  abilityBonusChoiceSchema,
  abilityBonusSchema,
  apiReferenceSchema,
  languageChoiceSchema,
} from "@/types/common";

/**
 * `Race.size` is one of the six size categories, but only `Small` and `Medium`
 * appear on playable races in the 2014 data.
 */

/** Full `Race` — for the `race(index:)` query. */
export const raceSchema = z.object({
  index: z.string(),
  name: z.string(),
  speed: z.number().int(),
  size: z.string(),
  size_description: z.string(),
  age: z.string(),
  alignment: z.string(),
  language_desc: z.string(),
  ability_bonuses: z.array(abilityBonusSchema),
  ability_bonus_options: abilityBonusChoiceSchema.nullable(),
  languages: z.array(apiReferenceSchema).nullable(),
  language_options: languageChoiceSchema.nullable(),
  traits: z.array(apiReferenceSchema).nullable(),
  subraces: z.array(apiReferenceSchema).nullable(),
});
export type Race = z.infer<typeof raceSchema>;

/** Narrow shape for the `races` list query. */
export const raceListItemSchema = raceSchema.pick({
  index: true,
  name: true,
  size: true,
  speed: true,
  ability_bonuses: true,
});
export type RaceListItem = z.infer<typeof raceListItemSchema>;

export const raceListSchema = z.array(raceListItemSchema);
export type RaceList = z.infer<typeof raceListSchema>;
