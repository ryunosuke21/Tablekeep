import { z } from "zod";

import { apiReferenceSchema, costSchema, damageSchema } from "@/types/common";

/**
 * `equipment(index:)` returns the `AnyEquipment` union and `equipments` returns
 * a list of it, so both are discriminated on `__typename`. Every equipment query
 * must select `__typename` for these schemas to parse.
 */

export const equipmentTypeNameSchema = z.enum([
  "Armor",
  "Weapon",
  "Tool",
  "Gear",
  "Pack",
  "Ammunition",
  "Vehicle",
]);
export type EquipmentTypeName = z.infer<typeof equipmentTypeNameSchema>;

/** Fields shared by every `AnyEquipment` member (the `IEquipment` interface). */
export const equipmentBaseShape = {
  index: z.string(),
  name: z.string(),
  desc: z.array(z.string()).nullable(),
  equipment_category: apiReferenceSchema,
  gear_category: apiReferenceSchema.nullable(),
  cost: costSchema,
  weight: z.number().nullable(),
  properties: z.array(apiReferenceSchema).nullable(),
};

/**
 * The bare `Equipment` object type, without any subtype fields. Used where the
 * API points at an item without exposing the union — e.g. a background's
 * `starting_equipment[].equipment`.
 */
export const baseEquipmentSchema = z.object(equipmentBaseShape);
export type BaseEquipment = z.infer<typeof baseEquipmentSchema>;

/**
 * Where the API exposes the `AnyEquipment` union but only the shared fields are
 * useful — a class's fixed starting equipment, a pack's contents. The query still
 * needs an inline fragment per member; select `__typename` plus the base fields.
 */
export const anyEquipmentBaseSchema = z.object({
  __typename: equipmentTypeNameSchema,
  ...equipmentBaseShape,
});
export type AnyEquipmentBase = z.infer<typeof anyEquipmentBaseSchema>;

export const armorClassSchema = z.object({
  base: z.number().int(),
  dex_bonus: z.boolean(),
  max_bonus: z.number().int().nullable(),
});
export type ArmorClass = z.infer<typeof armorClassSchema>;

export const weaponRangeSchema = z.object({
  normal: z.number().int(),
  long: z.number().int().nullable(),
});
export type WeaponRange = z.infer<typeof weaponRangeSchema>;

export const throwRangeSchema = z.object({
  normal: z.number().int(),
  long: z.number().int(),
});
export type ThrowRange = z.infer<typeof throwRangeSchema>;

export const vehicleSpeedSchema = z.object({
  quantity: z.number(),
  unit: z.string(),
});
export type VehicleSpeed = z.infer<typeof vehicleSpeedSchema>;

export const armorSchema = z.object({
  __typename: z.literal("Armor"),
  ...equipmentBaseShape,
  armor_category: z.string(),
  armor_class: armorClassSchema,
  str_minimum: z.number().int().nullable(),
  stealth_disadvantage: z.boolean().nullable(),
});
export type Armor = z.infer<typeof armorSchema>;

export const weaponSchema = z.object({
  __typename: z.literal("Weapon"),
  ...equipmentBaseShape,
  weapon_category: z.string(),
  weapon_range: z.string(),
  category_range: z.string(),
  damage: damageSchema.nullable(),
  two_handed_damage: damageSchema.nullable(),
  range: weaponRangeSchema.nullable(),
  throw_range: throwRangeSchema.nullable(),
});
export type Weapon = z.infer<typeof weaponSchema>;

export const toolSchema = z.object({
  __typename: z.literal("Tool"),
  ...equipmentBaseShape,
  tool_category: z.string(),
});
export type Tool = z.infer<typeof toolSchema>;

export const gearSchema = z.object({
  __typename: z.literal("Gear"),
  ...equipmentBaseShape,
});
export type Gear = z.infer<typeof gearSchema>;

export const ammunitionSchema = z.object({
  __typename: z.literal("Ammunition"),
  ...equipmentBaseShape,
  quantity: z.number().int(),
});
export type Ammunition = z.infer<typeof ammunitionSchema>;

export const vehicleSchema = z.object({
  __typename: z.literal("Vehicle"),
  ...equipmentBaseShape,
  vehicle_category: z.string(),
  speed: vehicleSpeedSchema.nullable(),
  capacity: z.string().nullable(),
});
export type Vehicle = z.infer<typeof vehicleSchema>;

/**
 * A pack's `contents[].item` is itself `AnyEquipment`. Only the base fields are
 * modelled, so the type stays non-recursive.
 */
export const packSchema = z.object({
  __typename: z.literal("Pack"),
  ...equipmentBaseShape,
  contents: z
    .array(
      z.object({
        quantity: z.number().int(),
        item: anyEquipmentBaseSchema.nullable(),
      }),
    )
    .nullable(),
});
export type Pack = z.infer<typeof packSchema>;

/** The `AnyEquipment` union — the return type of `equipment(index:)`. */
export const equipmentSchema = z.discriminatedUnion("__typename", [
  armorSchema,
  weaponSchema,
  toolSchema,
  gearSchema,
  packSchema,
  ammunitionSchema,
  vehicleSchema,
]);
export type Equipment = z.infer<typeof equipmentSchema>;

/** Narrow shape for the `equipments` list query. */
export const equipmentListItemSchema = z.object({
  __typename: equipmentTypeNameSchema,
  index: z.string(),
  name: z.string(),
  equipment_category: apiReferenceSchema,
  cost: costSchema,
  weight: z.number().nullable(),
});
export type EquipmentListItem = z.infer<typeof equipmentListItemSchema>;

export const equipmentListSchema = z.array(equipmentListItemSchema);
export type EquipmentList = z.infer<typeof equipmentListSchema>;

/**
 * `EquipmentCategorySet` — a `from` block that points at a whole category
 * rather than an explicit list of options.
 */
export const equipmentCategorySetSchema = z.object({
  option_set_type: z.literal("equipment_category"),
  equipment_category: apiReferenceSchema,
});
export type EquipmentCategorySet = z.infer<typeof equipmentCategorySetSchema>;

const countedReferenceOptionSchema = z.object({
  option_type: z.literal("counted_reference"),
  count: z.number().int(),
  of: baseEquipmentSchema,
  prerequisites: z
    .array(
      z.object({
        type: z.string(),
        proficiency: apiReferenceSchema,
      }),
    )
    .nullable()
    .optional(),
});

const equipmentCategoryChoiceOptionSchema = z.object({
  option_type: z.literal("choice"),
  choice: z.object({
    choose: z.number().int(),
    type: z.string(),
    desc: z.string().nullable().optional(),
    from: equipmentCategorySetSchema,
  }),
});

const multipleItemsOptionSchema = z.object({
  option_type: z.literal("multiple"),
  items: z.array(
    z.discriminatedUnion("option_type", [
      countedReferenceOptionSchema,
      equipmentCategoryChoiceOptionSchema,
    ]),
  ),
});

/** `EquipmentOptionSet` — an explicit list of equipment options. */
export const equipmentOptionSetSchema = z.object({
  option_set_type: z.literal("options_array"),
  options: z.array(
    z.discriminatedUnion("option_type", [
      countedReferenceOptionSchema,
      equipmentCategoryChoiceOptionSchema,
      multipleItemsOptionSchema,
    ]),
  ),
});
export type EquipmentOptionSet = z.infer<typeof equipmentOptionSetSchema>;

/**
 * `StartingEquipmentChoice` — shared by `Class.starting_equipment_options` and
 * `Background.starting_equipment_options`.
 */
export const startingEquipmentChoiceSchema = z.object({
  choose: z.number().int(),
  type: z.string(),
  desc: z.string().nullable().optional(),
  from: z.discriminatedUnion("option_set_type", [
    equipmentCategorySetSchema,
    equipmentOptionSetSchema,
  ]),
});
export type StartingEquipmentChoice = z.infer<
  typeof startingEquipmentChoiceSchema
>;

/**
 * `ClassEquipment` — a fixed starting-equipment entry. `equipment` is the
 * `AnyEquipment` union here, unlike a background's, which is a plain `Equipment`.
 */
export const equipmentQuantitySchema = z.object({
  quantity: z.number().int(),
  equipment: anyEquipmentBaseSchema.nullable(),
});
export type EquipmentQuantity = z.infer<typeof equipmentQuantitySchema>;
