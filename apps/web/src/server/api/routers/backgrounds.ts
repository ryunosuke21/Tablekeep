import { gql } from "graphql-request";
import { z } from "zod";

import { parseEntity, parseFoundEntity } from "@/server/api/parse";
import {
  EQUIPMENT_BASE,
  LANGUAGE_OPTIONS,
  REFERENCE,
  STARTING_EQUIPMENT_OPTIONS,
} from "@/server/api/selections";
import {
  createTRPCRouter,
  paginationMiddleware,
  paginationSchema,
  publicProcedure,
} from "@/server/api/trpc";
import { backgroundListSchema, backgroundSchema } from "@/types/backgrounds";

const STRING_CHOICE = `{
    choose
    type
    from {
        option_set_type
        options {
            option_type
            string
        }
    }
}`;

const FEATURE = `{
    name
    desc
}`;

const BACKGROUNDS_QUERY = gql`
    query Backgrounds($skip: Int, $limit: Int, $name: String) {
        backgrounds(skip: $skip, limit: $limit, name: $name) {
            index
            name
            feature ${FEATURE}
        }
    }
`;

/**
 * A background's `starting_equipment[].equipment` is a plain `Equipment`, unlike a
 * class's, which is the `AnyEquipment` union and needs inline fragments.
 */
const BACKGROUND_QUERY = gql`
    query Background($index: String!) {
        background(index: $index) {
            index
            name
            feature ${FEATURE}
            starting_proficiencies ${REFERENCE}
            starting_equipment {
                quantity
                equipment {
                    ${EQUIPMENT_BASE}
                }
            }
            starting_equipment_options ${STARTING_EQUIPMENT_OPTIONS}
            language_options ${LANGUAGE_OPTIONS}
            personality_traits ${STRING_CHOICE}
            ideals {
                choose
                type
                from {
                    option_set_type
                    options {
                        option_type
                        desc
                        alignments ${REFERENCE}
                    }
                }
            }
            bonds ${STRING_CHOICE}
            flaws ${STRING_CHOICE}
        }
    }
`;

export const backgroundsRouter = createTRPCRouter({
  list: publicProcedure
    .input(
      z
        .object({ name: z.string().optional() })
        .extend(paginationSchema.shape)
        .optional(),
    )
    .use(paginationMiddleware)
    .query(async ({ ctx, input }) => {
      const { backgrounds } = await ctx.graphql.request<{
        backgrounds: unknown[];
      }>(BACKGROUNDS_QUERY, {
        skip: input?.cursor,
        limit: input?.limit,
        name: input?.name,
      });

      return parseEntity(backgroundListSchema, backgrounds, "background");
    }),
  get: publicProcedure
    .input(z.object({ index: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const { background } = await ctx.graphql.request<{ background: unknown }>(
        BACKGROUND_QUERY,
        { index: input.index },
      );

      return parseFoundEntity(backgroundSchema, background, "Background");
    }),
});
