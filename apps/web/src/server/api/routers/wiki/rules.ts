import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import {
  mapRule,
  mapRuleListItem,
  ruleListItemSchema,
  ruleSchema,
} from "@/server/reference-data/open5e/resources";
import { wikiRuleListItemSchema } from "@/types/wiki";

import {
  readSources,
  readWikiCatalog,
  sourceFor,
  wikiKeyInputSchema,
} from "./common";

export const wikiRulesRouter = createTRPCRouter({
  catalog: publicProcedure.query(({ ctx }) =>
    readWikiCatalog(ctx.open5e, {
      resource: "rules",
      fields: "key,name,document,index,ruleset",
      upstreamSchema: ruleListItemSchema,
      itemSchema: wikiRuleListItemSchema,
      map: mapRuleListItem,
    }),
  ),
  get: publicProcedure
    .input(wikiKeyInputSchema)
    .query(async ({ ctx, input }) => {
      const [rule, sources] = await Promise.all([
        ctx.open5e.get("rules", input.key, ruleSchema),
        readSources(ctx.open5e),
      ]);
      return mapRule(rule, sourceFor(sources, rule.document));
    }),
});
