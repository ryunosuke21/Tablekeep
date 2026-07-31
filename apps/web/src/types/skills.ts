import { z } from "zod";

import { apiReferenceSchema } from "@/types/common";

/** Full `Skill` — for the `skill(index:)` query. */
export const skillSchema = z.object({
  index: z.string(),
  name: z.string(),
  desc: z.array(z.string()),
  ability_score: apiReferenceSchema,
});
export type Skill = z.infer<typeof skillSchema>;

/** Narrow shape for the `skills` list query. */
export const skillListItemSchema = skillSchema.pick({
  index: true,
  name: true,
  ability_score: true,
});
export type SkillListItem = z.infer<typeof skillListItemSchema>;

export const skillListSchema = z.array(skillListItemSchema);
export type SkillList = z.infer<typeof skillListSchema>;
