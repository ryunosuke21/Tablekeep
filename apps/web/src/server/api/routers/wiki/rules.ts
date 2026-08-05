import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import {
  mapRule,
  mapRuleListItem,
  ruleListItemSchema,
  ruleSchema,
} from "@/server/reference-data/open5e/resources";

import { mapWikiPage, wikiKeyInputSchema, wikiPageInputSchema } from "./common";

const listInputSchema = wikiPageInputSchema.extend({
  name: z.string().min(1).optional(),
});

export const wikiRulesRouter = createTRPCRouter({
  list: publicProcedure
    .input(listInputSchema.optional())
    .query(async ({ ctx, input }) => {
      const { page, limit, name } = listInputSchema.parse(input ?? {});
      const result = await ctx.open5e.list("rules", ruleListItemSchema, {
        page,
        limit,
        name__icontains: name,
        fields: "key,name,document",
      });
      return mapWikiPage(result, page, limit, mapRuleListItem);
    }),
  get: publicProcedure
    .input(wikiKeyInputSchema)
    .query(async ({ ctx, input }) =>
      mapRule(await ctx.open5e.get("rules", input.key, ruleSchema)),
    ),
});
