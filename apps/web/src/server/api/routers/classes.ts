import { gql } from "graphql-request";
import { z } from "zod";

import { parseEntity, parseFoundEntity } from "@/server/api/parse";
import {
  ANY_EQUIPMENT_BASE,
  PROFICIENCY_CHOICE,
  REFERENCE,
  STARTING_EQUIPMENT_OPTIONS,
} from "@/server/api/selections";
import {
  createTRPCRouter,
  paginationMiddleware,
  paginationSchema,
  publicProcedure,
} from "@/server/api/trpc";
import type { PrerequisiteChoice } from "@/types/classes";
import { classListSchema, classSchema } from "@/types/classes";

const CLASSES_QUERY = gql`
    query Classes(
        $skip: Int
        $limit: Int
        $name: String
        $hit_die: NumberFilterInput
    ) {
        classes(skip: $skip, limit: $limit, name: $name, hit_die: $hit_die) {
            index
            name
            hit_die
            subclasses ${REFERENCE}
        }
    }
`;

/**
 * `MultiClassing.prerequisite_options` is declared non-null but only the Fighter
 * has one, and the API answers with a GraphQL error rather than `null` — which
 * nulls out the whole `multi_classing` object. So it is left out here and fetched
 * separately by {@link MULTICLASS_PREREQUISITE_OPTIONS_QUERY}.
 */
const CLASS_QUERY = gql`
    query Class($index: String!) {
        class(index: $index) {
            index
            name
            hit_die
            proficiencies ${REFERENCE}
            proficiency_choices ${PROFICIENCY_CHOICE}
            saving_throws ${REFERENCE}
            starting_equipment {
                quantity
                equipment ${ANY_EQUIPMENT_BASE}
            }
            starting_equipment_options ${STARTING_EQUIPMENT_OPTIONS}
            spellcasting {
                level
                spellcasting_ability ${REFERENCE}
                info {
                    name
                    desc
                }
            }
            spells ${REFERENCE}
            subclasses ${REFERENCE}
            multi_classing {
                prerequisites {
                    ability_score ${REFERENCE}
                    minimum_score
                }
                proficiencies ${REFERENCE}
                proficiency_choices ${PROFICIENCY_CHOICE}
            }
            class_levels {
                index
                level
                ability_score_bonuses
                prof_bonus
                features ${REFERENCE}
                subclass ${REFERENCE}
                subclass_specific {
                    additional_magical_secrets_max_lvl
                    aura_range
                }
                spellcasting {
                    cantrips_known
                    spells_known
                    spell_slots_level_1
                    spell_slots_level_2
                    spell_slots_level_3
                    spell_slots_level_4
                    spell_slots_level_5
                    spell_slots_level_6
                    spell_slots_level_7
                    spell_slots_level_8
                    spell_slots_level_9
                }
                class_specific {
                    action_surges
                    arcane_recovery_levels
                    aura_range
                    bardic_inspiration_die
                    brutal_critical_dice
                    channel_divinity_charges
                    creating_spell_slots {
                        sorcery_point_cost
                        spell_slot_level
                    }
                    destroy_undead_cr
                    extra_attacks
                    favored_enemies
                    favored_terrain
                    indomitable_uses
                    invocations_known
                    ki_points
                    magical_secrets_max_5
                    magical_secrets_max_7
                    magical_secrets_max_9
                    martial_arts {
                        dice_count
                        dice_value
                    }
                    metamagic_known
                    mystic_arcanum_level_6
                    mystic_arcanum_level_7
                    mystic_arcanum_level_8
                    mystic_arcanum_level_9
                    rage_count
                    rage_damage_bonus
                    sneak_attack {
                        dice_count
                        dice_value
                    }
                    song_of_rest_die
                    sorcery_points
                    unarmored_movement
                    wild_shape_fly
                    wild_shape_max_cr
                    wild_shape_swim
                }
            }
        }
    }
`;

const MULTICLASS_PREREQUISITE_OPTIONS_QUERY = gql`
    query ClassMulticlassPrerequisiteOptions($index: String!) {
        class(index: $index) {
            multi_classing {
                prerequisite_options {
                    choose
                    type
                    desc
                    from {
                        option_set_type
                        options {
                            option_type
                            ability_score ${REFERENCE}
                            minimum_score
                        }
                    }
                }
            }
        }
    }
`;

export const classesRouter = createTRPCRouter({
  list: publicProcedure
    .input(
      z
        .object({
          name: z.string().optional(),
          hitDie: z.number().int().optional(),
        })
        .extend(paginationSchema.shape)
        .optional(),
    )
    .use(paginationMiddleware)
    .query(async ({ ctx, input }) => {
      const { classes } = await ctx.graphql.request<{ classes: unknown[] }>(
        CLASSES_QUERY,
        {
          skip: input?.cursor,
          limit: input?.limit,
          name: input?.name,
          hit_die:
            input?.hitDie === undefined ? undefined : { eq: input.hitDie },
        },
      );

      return parseEntity(classListSchema, classes, "class");
    }),
  get: publicProcedure
    .input(z.object({ index: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const { class: classRaw } = await ctx.graphql.request<{
        class: unknown;
      }>(CLASS_QUERY, { index: input.index });

      const parsed = parseFoundEntity(classSchema, classRaw, "Class");

      if (!parsed.multi_classing) {
        return parsed;
      }

      // Errors here mean the class simply has no prerequisite options.
      const prerequisiteOptions = await ctx.graphql
        .request<{
          class: {
            multi_classing: {
              prerequisite_options: PrerequisiteChoice | null;
            } | null;
          } | null;
        }>(MULTICLASS_PREREQUISITE_OPTIONS_QUERY, { index: input.index })
        .then(
          (data) => data.class?.multi_classing?.prerequisite_options ?? null,
        )
        .catch(() => null);

      return {
        ...parsed,
        multi_classing: {
          ...parsed.multi_classing,
          prerequisite_options: prerequisiteOptions,
        },
      };
    }),
});
