import { z } from "zod";

import { abilityBonusSchema, apiReferenceSchema } from "@/types/common";

/** Full `Subrace` — for the `subrace(index:)` query. */
export const subraceSchema = z.object({
  index: z.string(),
  name: z.string(),
  desc: z.string(),
  race: apiReferenceSchema.nullable(),
  ability_bonuses: z.array(abilityBonusSchema),
  racial_traits: z.array(apiReferenceSchema).nullable(),
});
export type Subrace = z.infer<typeof subraceSchema>;

/** Narrow shape for the `subraces` list query. */
export const subraceListItemSchema = subraceSchema.pick({
  index: true,
  name: true,
  race: true,
  ability_bonuses: true,
});
export type SubraceListItem = z.infer<typeof subraceListItemSchema>;

export const subraceListSchema = z.array(subraceListItemSchema);
export type SubraceList = z.infer<typeof subraceListSchema>;
