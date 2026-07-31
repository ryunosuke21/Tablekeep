import { z } from "zod";

import {
  apiReferenceSchema,
  areaOfEffectSchema,
  levelValueSchema,
} from "@/types/common";

export const spellComponentSchema = z.enum(["V", "S", "M"]);
export type SpellComponent = z.infer<typeof spellComponentSchema>;

/**
 * `SpellDamage`. Cantrips scale by character level, leveled spells by slot, and
 * only one of the two is ever populated.
 *
 * Both are declared non-null by the API but are actually absent on the other
 * kind of spell, and the server answers with a GraphQL error rather than `null`.
 * Select `damage_at_slot_level` only when querying leveled spells and
 * `damage_at_character_level` only when querying cantrips — hence `.optional()`.
 */
export const spellDamageSchema = z.object({
  damage_type: apiReferenceSchema.nullable(),
  damage_at_slot_level: z.array(levelValueSchema).nullable().optional(),
  damage_at_character_level: z.array(levelValueSchema).nullable().optional(),
});
export type SpellDamage = z.infer<typeof spellDamageSchema>;

/**
 * `SpellDC`. `dc_success` is `"half" | "none" | "other"` in the 2014 data —
 * left as a plain string so a new value cannot break a spell page.
 */
export const spellDcSchema = z.object({
  dc_type: apiReferenceSchema,
  dc_success: z.string(),
  desc: z.string().nullable(),
});
export type SpellDc = z.infer<typeof spellDcSchema>;

/** Full `Spell` — for the `spell(index:)` query. */
export const spellSchema = z.object({
  index: z.string(),
  name: z.string(),
  desc: z.array(z.string()),
  higher_level: z.array(z.string()).nullable(),
  level: z.number().int(),
  school: apiReferenceSchema.nullable(),
  casting_time: z.string(),
  range: z.string(),
  duration: z.string(),
  concentration: z.boolean(),
  ritual: z.boolean(),
  components: z.array(spellComponentSchema),
  material: z.string().nullable(),
  attack_type: z.string().nullable(),
  area_of_effect: areaOfEffectSchema.nullable(),
  damage: spellDamageSchema.nullable(),
  heal_at_slot_level: z.array(levelValueSchema).nullable(),
  dc: spellDcSchema.nullable(),
  classes: z.array(apiReferenceSchema).nullable(),
  subclasses: z.array(apiReferenceSchema).nullable(),
});
export type Spell = z.infer<typeof spellSchema>;

/** Narrow shape for the `spells` list query. */
export const spellListItemSchema = spellSchema.pick({
  index: true,
  name: true,
  level: true,
  school: true,
  casting_time: true,
  range: true,
  duration: true,
  concentration: true,
  ritual: true,
  components: true,
  attack_type: true,
});
export type SpellListItem = z.infer<typeof spellListItemSchema>;

export const spellListSchema = z.array(spellListItemSchema);
export type SpellList = z.infer<typeof spellListSchema>;
