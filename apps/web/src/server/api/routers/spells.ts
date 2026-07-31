import { gql } from "graphql-request";
import { z } from "zod";

import { parseEntity, parseFoundEntity } from "@/server/api/parse";
import { LEVEL_VALUE, REFERENCE } from "@/server/api/selections";
import {
  createTRPCRouter,
  paginationMiddleware,
  paginationSchema,
  publicProcedure,
} from "@/server/api/trpc";
import type { LevelValue } from "@/types/common";
import { spellListSchema, spellSchema } from "@/types/spells";

/** The API caps an unbounded list at 100 rows, so pass `limit` to page past it. */
const SPELLS_QUERY = gql`
    query Spells(
        $skip: Int
        $limit: Int
        $level: [Int!]
        $school: [String!]
    ) {
        spells(skip: $skip, limit: $limit, level: $level, school: $school) {
            index
            name
            level
            school ${REFERENCE}
            casting_time
            range
            duration
            concentration
            ritual
            components
            attack_type
        }
    }
`;

/**
 * `SpellDamage.damage_at_slot_level` is declared non-null but is absent on
 * cantrips, and the API answers with a GraphQL error rather than `null` — which
 * nulls out the whole `damage` object. So the detail query leaves it out and it
 * is fetched in a follow-up request for leveled spells that deal damage.
 */
const SPELL_QUERY = gql`
    query Spell($index: String!) {
        spell(index: $index) {
            index
            name
            desc
            higher_level
            level
            school ${REFERENCE}
            casting_time
            range
            duration
            concentration
            ritual
            components
            material
            attack_type
            area_of_effect {
                size
                type
            }
            damage {
                damage_type ${REFERENCE}
                damage_at_character_level ${LEVEL_VALUE}
            }
            heal_at_slot_level ${LEVEL_VALUE}
            dc {
                dc_type ${REFERENCE}
                dc_success
                desc
            }
            classes ${REFERENCE}
            subclasses ${REFERENCE}
        }
    }
`;

const SLOT_LEVEL_DAMAGE_QUERY = gql`
    query SpellSlotLevelDamage($index: String!) {
        spell(index: $index) {
            damage {
                damage_at_slot_level ${LEVEL_VALUE}
            }
        }
    }
`;

export const spellsRouter = createTRPCRouter({
  list: publicProcedure
    .input(
      z
        .object({
          level: z.array(z.number()).optional(),
          school: z.array(z.string()).optional(),
        })
        .extend(paginationSchema.shape)
        .optional(),
    )
    .use(paginationMiddleware)
    .query(async ({ ctx, input }) => {
      const { spells } = await ctx.graphql.request<{ spells: unknown[] }>(
        SPELLS_QUERY,
        {
          skip: input?.cursor,
          limit: input?.limit,
          level: input?.level,
          school: input?.school,
        },
      );

      return parseEntity(spellListSchema, spells, "spell");
    }),
  get: publicProcedure
    .input(
      z.object({
        index: z.string().min(1),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { spell: spellRaw } = await ctx.graphql.request<{
        spell: unknown;
      }>(SPELL_QUERY, { index: input.index });

      const spell = parseFoundEntity(spellSchema, spellRaw, "Spell");

      if (spell.level === 0 || !spell.damage) {
        return spell;
      }

      const slotLevelRaw = await ctx.graphql.request<{
        spell: { damage: { damage_at_slot_level: LevelValue[] } | null } | null;
      }>(SLOT_LEVEL_DAMAGE_QUERY, { index: input.index });

      return {
        ...spell,
        damage: {
          ...spell.damage,
          damage_at_slot_level:
            slotLevelRaw.spell?.damage?.damage_at_slot_level ?? null,
        },
      };
    }),
});
