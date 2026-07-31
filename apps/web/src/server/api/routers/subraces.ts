import { gql } from "graphql-request";
import { z } from "zod";

import { parseEntity, parseFoundEntity } from "@/server/api/parse";
import { REFERENCE } from "@/server/api/selections";
import {
  createTRPCRouter,
  paginationMiddleware,
  paginationSchema,
  publicProcedure,
} from "@/server/api/trpc";
import { subraceListSchema, subraceSchema } from "@/types/subraces";

const ABILITY_BONUSES = `{
    ability_score ${REFERENCE}
    bonus
}`;

const SUBRACES_QUERY = gql`
    query Subraces($skip: Int, $limit: Int, $name: String) {
        subraces(skip: $skip, limit: $limit, name: $name) {
            index
            name
            race ${REFERENCE}
            ability_bonuses ${ABILITY_BONUSES}
        }
    }
`;

const SUBRACE_QUERY = gql`
    query Subrace($index: String!) {
        subrace(index: $index) {
            index
            name
            desc
            race ${REFERENCE}
            ability_bonuses ${ABILITY_BONUSES}
            racial_traits ${REFERENCE}
        }
    }
`;

export const subracesRouter = createTRPCRouter({
  list: publicProcedure
    .input(
      z
        .object({ name: z.string().optional() })
        .extend(paginationSchema.shape)
        .optional(),
    )
    .use(paginationMiddleware)
    .query(async ({ ctx, input }) => {
      const { subraces } = await ctx.graphql.request<{ subraces: unknown[] }>(
        SUBRACES_QUERY,
        { skip: input?.cursor, limit: input?.limit, name: input?.name },
      );

      return parseEntity(subraceListSchema, subraces, "subrace");
    }),
  get: publicProcedure
    .input(z.object({ index: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const { subrace } = await ctx.graphql.request<{ subrace: unknown }>(
        SUBRACE_QUERY,
        { index: input.index },
      );

      return parseFoundEntity(subraceSchema, subrace, "Subrace");
    }),
});
