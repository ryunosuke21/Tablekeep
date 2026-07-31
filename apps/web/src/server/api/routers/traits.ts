import { gql } from "graphql-request";
import { z } from "zod";

import { parseEntity, parseFoundEntity } from "@/server/api/parse";
import {
  LANGUAGE_OPTIONS,
  LEVEL_VALUE,
  PROFICIENCY_CHOICE,
  REFERENCE,
} from "@/server/api/selections";
import {
  createTRPCRouter,
  paginationMiddleware,
  paginationSchema,
  publicProcedure,
} from "@/server/api/trpc";
import { traitListSchema, traitSchema } from "@/types/traits";

/** A choice of traits or of spells — both are `{ option_type, item }` references. */
const REFERENCE_CHOICE = `{
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

const TRAITS_QUERY = gql`
    query Traits($skip: Int, $limit: Int, $name: String) {
        traits(skip: $skip, limit: $limit, name: $name) {
            index
            name
            races ${REFERENCE}
            subraces ${REFERENCE}
        }
    }
`;

const TRAIT_QUERY = gql`
    query Trait($index: String!) {
        trait(index: $index) {
            index
            name
            desc
            races ${REFERENCE}
            subraces ${REFERENCE}
            proficiencies ${REFERENCE}
            proficiency_choices ${PROFICIENCY_CHOICE}
            language_options ${LANGUAGE_OPTIONS}
            parent ${REFERENCE}
            trait_specific {
                damage_type ${REFERENCE}
                breath_weapon {
                    name
                    desc
                    usage {
                        type
                        times
                    }
                    dc {
                        dc_type ${REFERENCE}
                        success_type
                    }
                    damage {
                        damage_type ${REFERENCE}
                        damage_at_character_level ${LEVEL_VALUE}
                    }
                    area_of_effect {
                        size
                        type
                    }
                }
                subtrait_options ${REFERENCE_CHOICE}
                spell_options ${REFERENCE_CHOICE}
            }
        }
    }
`;

export const traitsRouter = createTRPCRouter({
  list: publicProcedure
    .input(
      z
        .object({ name: z.string().optional() })
        .extend(paginationSchema.shape)
        .optional(),
    )
    .use(paginationMiddleware)
    .query(async ({ ctx, input }) => {
      const { traits } = await ctx.graphql.request<{ traits: unknown[] }>(
        TRAITS_QUERY,
        { skip: input?.cursor, limit: input?.limit, name: input?.name },
      );

      return parseEntity(traitListSchema, traits, "trait");
    }),
  get: publicProcedure
    .input(z.object({ index: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const { trait } = await ctx.graphql.request<{ trait: unknown }>(
        TRAIT_QUERY,
        { index: input.index },
      );

      return parseFoundEntity(traitSchema, trait, "Trait");
    }),
});
