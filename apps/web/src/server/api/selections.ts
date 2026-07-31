/**
 * Reusable GraphQL selection sets for the dnd5eapi schema.
 *
 * These are plain strings rather than named GraphQL fragments because most of
 * them (`REFERENCE` above all) apply to many unrelated object types, and a named
 * fragment needs a single type condition.
 */

/** Every field modelled as `apiReferenceSchema` needs exactly this selection. */
export const REFERENCE = `{
    index
    name
}`;

export const LEVEL_VALUE = `{
    level
    value
}`;

export const DAMAGE = `{
    damage_type ${REFERENCE}
    damage_dice
}`;

export const DIFFICULTY_CLASS = `{
    dc_type ${REFERENCE}
    dc_value
    success_type
}`;

export const LANGUAGE_OPTIONS = `{
    choose
    type
    from {
        option_set_type
        options {
            option_type
            item ${REFERENCE}
        }
    }
}`;

export const ABILITY_BONUS_OPTIONS = `{
    choose
    type
    desc
    from {
        option_set_type
        options {
            option_type
            ability_score ${REFERENCE}
            bonus
        }
    }
}`;

/** The `IEquipment` interface fields, shared by all seven equipment types. */
export const EQUIPMENT_BASE = `index
    name
    desc
    equipment_category ${REFERENCE}
    gear_category ${REFERENCE}
    cost {
        quantity
        unit
    }
    weight
    properties ${REFERENCE}`;

const EQUIPMENT_TYPES = [
  "Armor",
  "Weapon",
  "Tool",
  "Gear",
  "Pack",
  "Ammunition",
  "Vehicle",
] as const;

/**
 * Spreads one selection across all seven `AnyEquipment` members. The union has no
 * shared interface in the GraphQL schema that exposes every field, so a field is
 * only reachable through an inline fragment per member.
 */
export const onEveryEquipmentType = (fields: string) =>
  EQUIPMENT_TYPES.map(
    (type) => `... on ${type} {
        ${fields}
    }`,
  ).join("\n    ");

/**
 * For fields typed as the `AnyEquipment` union where only the shared fields are
 * wanted. Matches `anyEquipmentBaseSchema`.
 */
export const ANY_EQUIPMENT_BASE = `{
    __typename
    ${onEveryEquipmentType(EQUIPMENT_BASE)}
}`;

/**
 * A `ProficiencyChoice` nests: an option's `item` is either a proficiency or
 * another choice. GraphQL cannot express unbounded recursion, so the selection is
 * expanded to a fixed depth.
 */
const proficiencyChoiceAtDepth = (depth: number): string => `{
    choose
    type
    desc
    from {
        option_set_type
        options {
            option_type
            item {
                __typename
                ... on Proficiency {
                    index
                    name
                }${
                  depth > 0
                    ? `
                ... on ProficiencyChoice ${proficiencyChoiceAtDepth(depth - 1)}`
                    : ""
                }
            }
        }
    }
}`;

export const PROFICIENCY_CHOICE = proficiencyChoiceAtDepth(2);

const COUNTED_REFERENCE_OPTION = `option_type
        count
        of {
            ${EQUIPMENT_BASE}
        }
        prerequisites {
            type
            proficiency ${REFERENCE}
        }`;

const EQUIPMENT_CATEGORY_CHOICE_OPTION = `option_type
        choice {
            choose
            type
            desc
            from {
                option_set_type
                equipment_category ${REFERENCE}
            }
        }`;

/** Shared by `Class.starting_equipment_options` and the background equivalent. */
export const STARTING_EQUIPMENT_OPTIONS = `{
    choose
    type
    desc
    from {
        ... on EquipmentCategorySet {
            option_set_type
            equipment_category ${REFERENCE}
        }
        ... on EquipmentOptionSet {
            option_set_type
            options {
                ... on CountedReferenceOption {
                    ${COUNTED_REFERENCE_OPTION}
                }
                ... on EquipmentCategoryChoiceOption {
                    ${EQUIPMENT_CATEGORY_CHOICE_OPTION}
                }
                ... on MultipleItemsOption {
                    option_type
                    items {
                        ... on CountedReferenceOption {
                            ${COUNTED_REFERENCE_OPTION}
                        }
                        ... on EquipmentCategoryChoiceOption {
                            ${EQUIPMENT_CATEGORY_CHOICE_OPTION}
                        }
                    }
                }
            }
        }
    }
}`;
