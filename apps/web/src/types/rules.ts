import { z } from "zod";

import { apiReferenceSchema } from "@/types/common";

/**
 * A `RuleSection` is its own top-level entity (`ruleSection(index:)` /
 * `ruleSections`), so both shapes live here too.
 */
export const ruleSectionSchema = z.object({
  index: z.string(),
  name: z.string(),
  desc: z.string(),
});
export type RuleSection = z.infer<typeof ruleSectionSchema>;

export const ruleSectionListItemSchema = ruleSectionSchema.pick({
  index: true,
  name: true,
});
export type RuleSectionListItem = z.infer<typeof ruleSectionListItemSchema>;

export const ruleSectionListSchema = z.array(ruleSectionListItemSchema);
export type RuleSectionList = z.infer<typeof ruleSectionListSchema>;

/** Full `Rule` — for the `rule(index:)` query. */
export const ruleSchema = z.object({
  index: z.string(),
  name: z.string(),
  desc: z.string(),
  subsections: z.array(apiReferenceSchema),
});
export type Rule = z.infer<typeof ruleSchema>;

/** Narrow shape for the `rules` list query. */
export const ruleListItemSchema = ruleSchema.pick({
  index: true,
  name: true,
  subsections: true,
});
export type RuleListItem = z.infer<typeof ruleListItemSchema>;

export const ruleListSchema = z.array(ruleListItemSchema);
export type RuleList = z.infer<typeof ruleListSchema>;
