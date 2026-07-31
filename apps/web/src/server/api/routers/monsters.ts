import { gql } from "graphql-request";
import { z } from "zod";

import { parseEntity, parseFoundEntity } from "@/server/api/parse";
import { DAMAGE, DIFFICULTY_CLASS, REFERENCE } from "@/server/api/selections";
import {
  createTRPCRouter,
  paginationMiddleware,
  paginationSchema,
  publicProcedure,
} from "@/server/api/trpc";
import { monsterListSchema, monsterSchema } from "@/types/monsters";

/**
 * The API caps an unbounded list at 100 rows, so pass `limit` to page past it.
 *
 * There is no usable `challenge_rating` filter here: the API types that filter's
 * `eq` as an `Int`, which cannot express the fractional CRs (1/8, 1/4, 1/2) that
 * a third of the low-level monsters use.
 */
const MONSTERS_QUERY = gql`
    query Monsters($skip: Int, $limit: Int, $name: String) {
        monsters(skip: $skip, limit: $limit, name: $name) {
            index
            name
            image
            size
            type
            subtype
            alignment
            challenge_rating
            xp
            hit_points
        }
    }
`;

const SPECIAL_ABILITY_USAGE = `{
    type
    times
    rest_types
}`;

/**
 * `Monster.desc` is deliberately absent: it is declared `String!` but null for
 * essentially every monster, and selecting it makes the whole query fail.
 */
const MONSTER_QUERY = gql`
    query Monster($index: String!) {
        monster(index: $index) {
            index
            name
            image
            size
            type
            subtype
            alignment
            challenge_rating
            xp
            hit_points
            hit_dice
            hit_points_roll
            speed {
                walk
                burrow
                climb
                fly
                swim
                hover
            }
            strength
            dexterity
            constitution
            intelligence
            wisdom
            charisma
            senses {
                passive_perception
                blindsight
                darkvision
                tremorsense
                truesight
            }
            languages
            proficiencies {
                proficiency ${REFERENCE}
                value
            }
            damage_vulnerabilities
            damage_resistances
            damage_immunities
            condition_immunities ${REFERENCE}
            forms ${REFERENCE}
            armor_class {
                ... on ArmorClassDex {
                    type
                    value
                    desc
                }
                ... on ArmorClassNatural {
                    type
                    value
                    desc
                }
                ... on ArmorClassArmor {
                    type
                    value
                    desc
                    armor ${REFERENCE}
                }
                ... on ArmorClassSpell {
                    type
                    value
                    desc
                    spell ${REFERENCE}
                }
                ... on ArmorClassCondition {
                    type
                    value
                    desc
                    condition ${REFERENCE}
                }
            }
            actions {
                name
                desc
                attack_bonus
                multiattack_type
                dc ${DIFFICULTY_CLASS}
                usage {
                    type
                    dice
                    min_value
                }
                damage {
                    ... on Damage {
                        damage_type ${REFERENCE}
                        damage_dice
                    }
                    ... on DamageChoice {
                        choose
                        type
                        desc
                        from {
                            option_set_type
                            options {
                                option_type
                                damage ${DAMAGE}
                            }
                        }
                    }
                }
                actions {
                    action_name
                    count
                    type
                }
                action_options {
                    choose
                    type
                    desc
                    from {
                        option_set_type
                        options {
                            ... on ActionChoiceOption {
                                option_type
                                action_name
                                count
                                type
                                notes
                            }
                            ... on MultipleActionChoiceOption {
                                option_type
                                items {
                                    option_type
                                    action_name
                                    count
                                    type
                                    notes
                                }
                            }
                        }
                    }
                }
                options {
                    choose
                    type
                    desc
                    from {
                        option_set_type
                        options {
                            option_type
                            name
                            dc ${DIFFICULTY_CLASS}
                            damage ${DAMAGE}
                        }
                    }
                }
            }
            legendary_actions {
                name
                desc
                attack_bonus
                dc ${DIFFICULTY_CLASS}
                damage ${DAMAGE}
            }
            reactions {
                name
                desc
                dc ${DIFFICULTY_CLASS}
            }
            special_abilities {
                name
                desc
                attack_bonus
                dc ${DIFFICULTY_CLASS}
                damage ${DAMAGE}
                usage ${SPECIAL_ABILITY_USAGE}
                spellcasting {
                    level
                    ability ${REFERENCE}
                    dc
                    modifier
                    school
                    components_required
                    slots {
                        slot_level
                        count
                    }
                    spells {
                        level
                        notes
                        usage ${SPECIAL_ABILITY_USAGE}
                        spell ${REFERENCE}
                    }
                }
            }
        }
    }
`;

export const monstersRouter = createTRPCRouter({
  list: publicProcedure
    .input(
      z
        .object({
          name: z.string().optional(),
        })
        .extend(paginationSchema.shape)
        .optional(),
    )
    .use(paginationMiddleware)
    .query(async ({ ctx, input }) => {
      const { monsters } = await ctx.graphql.request<{ monsters: unknown[] }>(
        MONSTERS_QUERY,
        {
          skip: input?.cursor,
          limit: input?.limit,
          name: input?.name,
        },
      );

      return parseEntity(monsterListSchema, monsters, "monster");
    }),
  get: publicProcedure
    .input(z.object({ index: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const { monster } = await ctx.graphql.request<{ monster: unknown }>(
        MONSTER_QUERY,
        { index: input.index },
      );

      return parseFoundEntity(monsterSchema, monster, "Monster");
    }),
});
