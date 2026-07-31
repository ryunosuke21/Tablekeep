import { gql } from "graphql-request";
import { z } from "zod";

import { parseEntity, parseFoundEntity } from "@/server/api/parse";
import {
  ABILITY_BONUS_OPTIONS,
  LANGUAGE_OPTIONS,
  REFERENCE,
} from "@/server/api/selections";
import {
  createTRPCRouter,
  paginationMiddleware,
  paginationSchema,
  publicProcedure,
} from "@/server/api/trpc";
import { raceListSchema, raceSchema } from "@/types/races";

const ABILITY_BONUSES = `{
    ability_score ${REFERENCE}
    bonus
}`;

const RACES_QUERY = gql`
    query Races(
        $skip: Int
        $limit: Int
        $name: String
        $size: [String!]
        $ability_bonus: [String!]
        $language: [String!]
    ) {
        races(
            skip: $skip
            limit: $limit
            name: $name
            size: $size
            ability_bonus: $ability_bonus
            language: $language
        ) {
            index
            name
            size
            speed
            ability_bonuses ${ABILITY_BONUSES}
        }
    }
`;

const RACE_QUERY = gql`
    query Race($index: String!) {
        race(index: $index) {
            index
            name
            speed
            size
            size_description
            age
            alignment
            language_desc
            ability_bonuses ${ABILITY_BONUSES}
            ability_bonus_options ${ABILITY_BONUS_OPTIONS}
            languages ${REFERENCE}
            language_options ${LANGUAGE_OPTIONS}
            traits ${REFERENCE}
            subraces ${REFERENCE}
        }
    }
`;

export const racesRouter = createTRPCRouter({
  list: publicProcedure
    .input(
      z
        .object({
          name: z.string().optional(),
          size: z.array(z.string()).optional(),
          abilityBonus: z.array(z.string()).optional(),
          language: z.array(z.string()).optional(),
        })
        .extend(paginationSchema.shape)
        .optional(),
    )
    .use(paginationMiddleware)
    .query(async ({ ctx, input }) => {
      const { races } = await ctx.graphql.request<{ races: unknown[] }>(
        RACES_QUERY,
        {
          skip: input?.cursor,
          limit: input?.limit,
          name: input?.name,
          size: input?.size,
          ability_bonus: input?.abilityBonus,
          language: input?.language,
        },
      );

      return parseEntity(raceListSchema, races, "race");
    }),
  get: publicProcedure
    .input(z.object({ index: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const { race } = await ctx.graphql.request<{ race: unknown }>(
        RACE_QUERY,
        {
          index: input.index,
        },
      );

      return parseFoundEntity(raceSchema, race, "Race");
    }),
});
