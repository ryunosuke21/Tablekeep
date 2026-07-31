import { z } from "zod";

import { abilityScorePrerequisiteSchema } from "@/types/common";

/** Full `Feat` — for the `feat(index:)` query. */
export const featSchema = z.object({
  index: z.string(),
  name: z.string(),
  desc: z.array(z.string()),
  prerequisites: z.array(abilityScorePrerequisiteSchema),
});
export type Feat = z.infer<typeof featSchema>;

/** Narrow shape for the `feats` list query. */
export const featListItemSchema = featSchema.pick({
  index: true,
  name: true,
  prerequisites: true,
});
export type FeatListItem = z.infer<typeof featListItemSchema>;

export const featListSchema = z.array(featListItemSchema);
export type FeatList = z.infer<typeof featListSchema>;
