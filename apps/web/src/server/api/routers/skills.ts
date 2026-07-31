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
import { skillListSchema, skillSchema } from "@/types/skills";

const SKILLS_QUERY = gql`
    query Skills(
        $skip: Int
        $limit: Int
        $name: String
        $ability_score: [String!]
    ) {
        skills(
            skip: $skip
            limit: $limit
            name: $name
            ability_score: $ability_score
        ) {
            index
            name
            ability_score ${REFERENCE}
        }
    }
`;

const SKILL_QUERY = gql`
    query Skill($index: String!) {
        skill(index: $index) {
            index
            name
            desc
            ability_score ${REFERENCE}
        }
    }
`;

export const skillsRouter = createTRPCRouter({
  list: publicProcedure
    .input(
      z
        .object({
          name: z.string().optional(),
          abilityScore: z.array(z.string()).optional(),
        })
        .extend(paginationSchema.shape)
        .optional(),
    )
    .use(paginationMiddleware)
    .query(async ({ ctx, input }) => {
      const { skills } = await ctx.graphql.request<{ skills: unknown[] }>(
        SKILLS_QUERY,
        {
          skip: input?.cursor,
          limit: input?.limit,
          name: input?.name,
          ability_score: input?.abilityScore,
        },
      );

      return parseEntity(skillListSchema, skills, "skill");
    }),
  get: publicProcedure
    .input(z.object({ index: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const { skill } = await ctx.graphql.request<{ skill: unknown }>(
        SKILL_QUERY,
        { index: input.index },
      );

      return parseFoundEntity(skillSchema, skill, "Skill");
    }),
});
