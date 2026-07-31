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
import {
  ruleListSchema,
  ruleSchema,
  ruleSectionListSchema,
  ruleSectionSchema,
} from "@/types/rules";

const RULES_QUERY = gql`
    query Rules($skip: Int, $limit: Int, $name: String) {
        rules(skip: $skip, limit: $limit, name: $name) {
            index
            name
            subsections ${REFERENCE}
        }
    }
`;

const RULE_QUERY = gql`
    query Rule($index: String!) {
        rule(index: $index) {
            index
            name
            desc
            subsections ${REFERENCE}
        }
    }
`;

const RULE_SECTIONS_QUERY = gql`
    query RuleSections($skip: Int, $limit: Int, $name: String) {
        ruleSections(skip: $skip, limit: $limit, name: $name) {
            index
            name
        }
    }
`;

const RULE_SECTION_QUERY = gql`
    query RuleSection($index: String!) {
        ruleSection(index: $index) {
            index
            name
            desc
        }
    }
`;

const listInput = z
  .object({ name: z.string().optional() })
  .extend(paginationSchema.shape)
  .optional();

export const rulesRouter = createTRPCRouter({
  list: publicProcedure
    .input(listInput)
    .use(paginationMiddleware)
    .query(async ({ ctx, input }) => {
      const { rules } = await ctx.graphql.request<{ rules: unknown[] }>(
        RULES_QUERY,
        { skip: input?.cursor, limit: input?.limit, name: input?.name },
      );

      return parseEntity(ruleListSchema, rules, "rule");
    }),
  get: publicProcedure
    .input(z.object({ index: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const { rule } = await ctx.graphql.request<{ rule: unknown }>(
        RULE_QUERY,
        {
          index: input.index,
        },
      );

      return parseFoundEntity(ruleSchema, rule, "Rule");
    }),
});

/** `RuleSection` is its own top-level entity, not just a nested rule field. */
export const ruleSectionsRouter = createTRPCRouter({
  list: publicProcedure
    .input(listInput)
    .use(paginationMiddleware)
    .query(async ({ ctx, input }) => {
      const { ruleSections } = await ctx.graphql.request<{
        ruleSections: unknown[];
      }>(RULE_SECTIONS_QUERY, {
        skip: input?.cursor,
        limit: input?.limit,
        name: input?.name,
      });

      return parseEntity(ruleSectionListSchema, ruleSections, "rule section");
    }),
  get: publicProcedure
    .input(z.object({ index: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const { ruleSection } = await ctx.graphql.request<{
        ruleSection: unknown;
      }>(RULE_SECTION_QUERY, { index: input.index });

      return parseFoundEntity(ruleSectionSchema, ruleSection, "Rule section");
    }),
});
