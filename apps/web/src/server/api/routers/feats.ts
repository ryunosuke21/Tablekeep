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
import { featListSchema, featSchema } from "@/types/feats";

const PREREQUISITES = `{
    ability_score ${REFERENCE}
    minimum_score
}`;

const FEATS_QUERY = gql`
    query Feats($skip: Int, $limit: Int, $name: String) {
        feats(skip: $skip, limit: $limit, name: $name) {
            index
            name
            prerequisites ${PREREQUISITES}
        }
    }
`;

const FEAT_QUERY = gql`
    query Feat($index: String!) {
        feat(index: $index) {
            index
            name
            desc
            prerequisites ${PREREQUISITES}
        }
    }
`;

export const featsRouter = createTRPCRouter({
  list: publicProcedure
    .input(
      z
        .object({ name: z.string().optional() })
        .extend(paginationSchema.shape)
        .optional(),
    )
    .use(paginationMiddleware)
    .query(async ({ ctx, input }) => {
      const { feats } = await ctx.graphql.request<{ feats: unknown[] }>(
        FEATS_QUERY,
        { skip: input?.cursor, limit: input?.limit, name: input?.name },
      );

      return parseEntity(featListSchema, feats, "feat");
    }),
  get: publicProcedure
    .input(z.object({ index: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const { feat } = await ctx.graphql.request<{ feat: unknown }>(
        FEAT_QUERY,
        {
          index: input.index,
        },
      );

      return parseFoundEntity(featSchema, feat, "Feat");
    }),
});
