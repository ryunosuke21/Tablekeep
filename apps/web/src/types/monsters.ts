import { z } from "zod";

import {
  actionUsageSchema,
  apiReferenceSchema,
  damageSchema,
  difficultyClassSchema,
  sizeSchema,
  specialAbilityUsageSchema,
} from "@/types/common";

/**
 * `Monster.type` is left as a plain string: alongside the twelve creature types
 * the 2014 data also contains values like `"swarm of Tiny beasts"`.
 */

export const monsterSpeedSchema = z.object({
  walk: z.string().nullable(),
  burrow: z.string().nullable(),
  climb: z.string().nullable(),
  fly: z.string().nullable(),
  swim: z.string().nullable(),
  hover: z.boolean().nullable(),
});
export type MonsterSpeed = z.infer<typeof monsterSpeedSchema>;

export const monsterSensesSchema = z.object({
  passive_perception: z.number().int(),
  blindsight: z.string().nullable(),
  darkvision: z.string().nullable(),
  tremorsense: z.string().nullable(),
  truesight: z.string().nullable(),
});
export type MonsterSenses = z.infer<typeof monsterSensesSchema>;

export const monsterProficiencySchema = z.object({
  proficiency: apiReferenceSchema,
  value: z.number().int(),
});
export type MonsterProficiency = z.infer<typeof monsterProficiencySchema>;

/**
 * `MonsterArmorClass` union. The `type` field mirrors `__typename` one-for-one,
 * so it is used as the discriminator — every inline fragment must select it.
 */
export const monsterArmorClassSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("dex"),
    value: z.number().int(),
    desc: z.string().nullable(),
  }),
  z.object({
    type: z.literal("natural"),
    value: z.number().int(),
    desc: z.string().nullable(),
  }),
  z.object({
    type: z.literal("armor"),
    value: z.number().int(),
    desc: z.string().nullable(),
    armor: z.array(apiReferenceSchema).nullable(),
  }),
  z.object({
    type: z.literal("spell"),
    value: z.number().int(),
    desc: z.string().nullable(),
    spell: apiReferenceSchema,
  }),
  z.object({
    type: z.literal("condition"),
    value: z.number().int(),
    desc: z.string().nullable(),
    condition: apiReferenceSchema,
  }),
]);
export type MonsterArmorClass = z.infer<typeof monsterArmorClassSchema>;

/** `Damage | DamageChoice` — an action can roll fixed damage or offer a choice. */
export const damageChoiceSchema = z.object({
  choose: z.number(),
  type: z.string(),
  desc: z.string().nullable().optional(),
  from: z.object({
    option_set_type: z.string(),
    options: z.array(
      z.object({
        option_type: z.literal("damage"),
        damage: damageSchema,
      }),
    ),
  }),
});
export type DamageChoice = z.infer<typeof damageChoiceSchema>;

export const damageOrDamageChoiceSchema = z.union([
  damageSchema,
  damageChoiceSchema,
]);
export type DamageOrDamageChoice = z.infer<typeof damageOrDamageChoiceSchema>;

const actionChoiceOptionSchema = z.object({
  option_type: z.literal("action"),
  action_name: z.string(),
  count: z.number().int(),
  type: z.string(),
  notes: z.string().nullable().optional(),
});

/** `ActionChoice` — used by multiattacks that let the DM pick attacks. */
export const actionChoiceSchema = z.object({
  choose: z.number().int(),
  type: z.string(),
  desc: z.string().nullable().optional(),
  from: z.object({
    option_set_type: z.string(),
    options: z.array(
      z.discriminatedUnion("option_type", [
        actionChoiceOptionSchema,
        z.object({
          option_type: z.literal("multiple"),
          items: z.array(actionChoiceOptionSchema),
        }),
      ]),
    ),
  }),
});
export type ActionChoice = z.infer<typeof actionChoiceSchema>;

/** `BreathChoice` — `MonsterAction.options`, e.g. a dragon's breath weapons. */
export const breathChoiceSchema = z.object({
  choose: z.number().int(),
  type: z.string(),
  desc: z.string().nullable().optional(),
  from: z.object({
    option_set_type: z.string(),
    options: z.array(
      z.object({
        option_type: z.literal("breath"),
        name: z.string(),
        dc: difficultyClassSchema,
        damage: z.array(damageSchema).nullable(),
      }),
    ),
  }),
});
export type BreathChoice = z.infer<typeof breathChoiceSchema>;

export const monsterActionSchema = z.object({
  name: z.string(),
  desc: z.string(),
  attack_bonus: z.number().int().nullable(),
  dc: difficultyClassSchema.nullable(),
  usage: actionUsageSchema.nullable(),
  multiattack_type: z.string().nullable(),
  damage: z.array(damageOrDamageChoiceSchema).nullable(),
  actions: z
    .array(
      z.object({
        action_name: z.string(),
        count: z.string(),
        type: z.string(),
      }),
    )
    .nullable(),
  action_options: actionChoiceSchema.nullable(),
  options: breathChoiceSchema.nullable(),
});
export type MonsterAction = z.infer<typeof monsterActionSchema>;

export const legendaryActionSchema = z.object({
  name: z.string(),
  desc: z.string(),
  attack_bonus: z.number().int().nullable(),
  dc: difficultyClassSchema.nullable(),
  damage: z.array(damageSchema).nullable(),
});
export type LegendaryAction = z.infer<typeof legendaryActionSchema>;

export const monsterReactionSchema = z.object({
  name: z.string(),
  desc: z.string(),
  dc: difficultyClassSchema.nullable(),
});
export type MonsterReaction = z.infer<typeof monsterReactionSchema>;

export const specialAbilitySpellcastingSchema = z.object({
  level: z.number().int().nullable(),
  ability: apiReferenceSchema,
  dc: z.number().int().nullable(),
  modifier: z.number().int().nullable(),
  school: z.string().nullable(),
  components_required: z.array(z.string()),
  slots: z
    .array(
      z.object({
        slot_level: z.number().int(),
        count: z.number().int(),
      }),
    )
    .nullable(),
  spells: z.array(
    z.object({
      level: z.number().int(),
      notes: z.string().nullable(),
      usage: specialAbilityUsageSchema.nullable(),
      spell: apiReferenceSchema,
    }),
  ),
});
export type SpecialAbilitySpellcasting = z.infer<
  typeof specialAbilitySpellcastingSchema
>;

export const specialAbilitySchema = z.object({
  name: z.string(),
  desc: z.string(),
  attack_bonus: z.number().int().nullable(),
  dc: difficultyClassSchema.nullable(),
  damage: z.array(damageSchema).nullable(),
  usage: specialAbilityUsageSchema.nullable(),
  spellcasting: specialAbilitySpellcastingSchema.nullable(),
});
export type SpecialAbility = z.infer<typeof specialAbilitySchema>;

/** Full `Monster` — for the `monster(index:)` query. */
export const monsterSchema = z.object({
  index: z.string(),
  name: z.string(),
  /**
   * Declared `String!` but null for essentially every monster in the 2014 data,
   * and the server answers with a GraphQL error rather than `null` — so this is
   * safest left out of the query entirely.
   */
  desc: z.string().nullable().optional(),
  image: z.string().nullable(),
  size: sizeSchema,
  type: z.string(),
  subtype: z.string().nullable(),
  alignment: z.string(),
  challenge_rating: z.number(),
  xp: z.number().int(),
  armor_class: z.array(monsterArmorClassSchema),
  hit_points: z.number().int(),
  hit_dice: z.string(),
  hit_points_roll: z.string(),
  speed: monsterSpeedSchema,
  strength: z.number().int(),
  dexterity: z.number().int(),
  constitution: z.number().int(),
  intelligence: z.number().int(),
  wisdom: z.number().int(),
  charisma: z.number().int(),
  senses: monsterSensesSchema,
  languages: z.string(),
  proficiencies: z.array(monsterProficiencySchema).nullable(),
  damage_vulnerabilities: z.array(z.string()),
  damage_resistances: z.array(z.string()),
  damage_immunities: z.array(z.string()),
  condition_immunities: z.array(apiReferenceSchema).nullable(),
  actions: z.array(monsterActionSchema).nullable(),
  legendary_actions: z.array(legendaryActionSchema).nullable(),
  reactions: z.array(monsterReactionSchema).nullable(),
  special_abilities: z.array(specialAbilitySchema).nullable(),
  /**
   * Alternate forms (e.g. a were-creature). `Monster.forms` returns full
   * monsters; only `{ index name }` is modelled so the type stays non-recursive.
   */
  forms: z.array(apiReferenceSchema).nullable(),
});
export type Monster = z.infer<typeof monsterSchema>;

/** Narrow shape for the `monsters` list query. */
export const monsterListItemSchema = monsterSchema.pick({
  index: true,
  name: true,
  image: true,
  size: true,
  type: true,
  subtype: true,
  alignment: true,
  challenge_rating: true,
  xp: true,
  hit_points: true,
});
export type MonsterListItem = z.infer<typeof monsterListItemSchema>;

export const monsterListSchema = z.array(monsterListItemSchema);
export type MonsterList = z.infer<typeof monsterListSchema>;
