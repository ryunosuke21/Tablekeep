import { z } from "zod";

/**
 * Shared building blocks for the dnd5eapi GraphQL schema (2014 ruleset).
 *
 * Two conventions apply across every `types/*.ts` file in this folder:
 *
 * 1. Because GraphQL is field-selected, a schema only validates a payload whose
 *    query selected every field the schema requires. Each category therefore
 *    exports both a full `<x>Schema` (for the singular `x(index:)` query) and a
 *    narrow `<x>ListItemSchema` / `<x>ListSchema` (for the plural `xs` query).
 * 2. Fields that point at another top-level entity are modelled as
 *    `apiReferenceSchema`, so the query must select `{ index name }` on them.
 */

/** A pointer to another top-level entity. Select `{ index name }`. */
export const apiReferenceSchema = z.object({
  index: z.string(),
  name: z.string(),
});
export type ApiReference = z.infer<typeof apiReferenceSchema>;

/** `Level` has no `name`, so it cannot use {@link apiReferenceSchema}. */
export const levelReferenceSchema = z.object({
  index: z.string(),
  level: z.number().int(),
});
export type LevelReference = z.infer<typeof levelReferenceSchema>;

export const areaOfEffectTypeSchema = z.enum([
  "sphere",
  "cube",
  "cylinder",
  "line",
  "cone",
]);
export type AreaOfEffectType = z.infer<typeof areaOfEffectTypeSchema>;

export const areaOfEffectSchema = z.object({
  size: z.number().int(),
  type: areaOfEffectTypeSchema,
});
export type AreaOfEffect = z.infer<typeof areaOfEffectSchema>;

export const sizeSchema = z.enum([
  "Tiny",
  "Small",
  "Medium",
  "Large",
  "Huge",
  "Gargantuan",
]);
export type Size = z.infer<typeof sizeSchema>;

/** Coin abbreviations: copper, silver, electrum, gold, platinum. */
export const costSchema = z.object({
  quantity: z.number().int(),
  unit: z.enum(["cp", "sp", "ep", "gp", "pp"]),
});
export type Cost = z.infer<typeof costSchema>;

/** A `{ level, value }` progression row (damage or healing per slot/level). */
export const levelValueSchema = z.object({
  level: z.number().int(),
  value: z.string(),
});
export type LevelValue = z.infer<typeof levelValueSchema>;

export const damageSchema = z.object({
  damage_type: apiReferenceSchema.nullable(),
  damage_dice: z.string(),
});
export type Damage = z.infer<typeof damageSchema>;

/** `DifficultyClass`. `success_type` is `"half" | "none" | "other"` in the data. */
export const difficultyClassSchema = z.object({
  dc_type: apiReferenceSchema,
  dc_value: z.number().int(),
  success_type: z.string(),
});
export type DifficultyClass = z.infer<typeof difficultyClassSchema>;

/** `option_set_type` on a `from` block. */
export const optionSetTypeSchema = z.enum([
  "options_array",
  "resource_list",
  "equipment_category",
]);
export type OptionSetType = z.infer<typeof optionSetTypeSchema>;

/** Wraps an options array in the API's `{ option_set_type, options }` envelope. */
export const optionSet = <T extends z.ZodTypeAny>(option: T) =>
  z.object({
    option_set_type: optionSetTypeSchema,
    options: z.array(option),
  });

/** Wraps a `from` block in the API's `{ choose, type, from, desc? }` envelope. */
export const choice = <T extends z.ZodTypeAny>(from: T) =>
  z.object({
    choose: z.number().int(),
    type: z.string(),
    desc: z.string().nullable().optional(),
    from,
  });

/** `{ ability_score, minimum_score }` — feats and multiclassing prerequisites. */
export const abilityScorePrerequisiteSchema = z.object({
  ability_score: apiReferenceSchema.nullable(),
  minimum_score: z.number().int(),
});
export type AbilityScorePrerequisite = z.infer<
  typeof abilityScorePrerequisiteSchema
>;

export const abilityBonusSchema = z.object({
  ability_score: apiReferenceSchema.nullable(),
  bonus: z.number().int(),
});
export type AbilityBonus = z.infer<typeof abilityBonusSchema>;

export const languageChoiceSchema = choice(
  optionSet(
    z.object({
      option_type: z.literal("reference"),
      item: apiReferenceSchema,
    }),
  ),
);
export type LanguageChoice = z.infer<typeof languageChoiceSchema>;

export const abilityBonusChoiceSchema = choice(
  optionSet(
    z.object({
      option_type: z.literal("ability_bonus"),
      ability_score: apiReferenceSchema,
      bonus: z.number().int(),
    }),
  ),
);
export type AbilityBonusChoice = z.infer<typeof abilityBonusChoiceSchema>;

/** A `ProficiencyChoice` option is either a reference or a nested choice. */
export type ProficiencyChoice = {
  choose: number;
  type: string;
  desc?: string | null;
  from: {
    option_set_type: OptionSetType;
    options: Array<
      | { option_type: "reference"; item: ApiReference }
      | { option_type: "choice"; item: ProficiencyChoice }
    >;
  };
};

export const proficiencyChoiceSchema: z.ZodType<ProficiencyChoice> = z.lazy(
  () =>
    choice(
      optionSet(
        z.union([
          z.object({
            option_type: z.literal("reference"),
            item: apiReferenceSchema,
          }),
          z.object({
            option_type: z.literal("choice"),
            item: proficiencyChoiceSchema,
          }),
        ]),
      ),
    ),
);

/**
 * The API has three separate usage types with different fields, so they are
 * modelled separately rather than merged.
 */

/** `ActionUsage` — `"recharge on roll"` and friends, on monster actions. */
export const actionUsageSchema = z.object({
  type: z.string(),
  dice: z.string().nullable(),
  min_value: z.number().int().nullable(),
});
export type ActionUsage = z.infer<typeof actionUsageSchema>;

/** `SpecialAbilityUsage` — `"per day"` / `"recharge after rest"`. */
export const specialAbilityUsageSchema = z.object({
  type: z.string(),
  times: z.number().int().nullable(),
  rest_types: z.array(z.string()).nullable(),
});
export type SpecialAbilityUsage = z.infer<typeof specialAbilityUsageSchema>;

/** `Usage` — the minimal variant, used by racial trait actions. */
export const usageSchema = z.object({
  type: z.string(),
  times: z.number().int(),
});
export type Usage = z.infer<typeof usageSchema>;
