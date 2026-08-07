import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import {
  mapSpell,
  mapSpellListItem,
  spellListItemSchema,
  spellSchema,
} from "@/server/reference-data/open5e/resources";
import { wikiSpellListItemSchema } from "@/types/wiki";

import { readWikiCatalog, wikiKeyInputSchema } from "./common";

export const wikiSpellsRouter = createTRPCRouter({
  catalog: publicProcedure.query(({ ctx }) =>
    readWikiCatalog(ctx.open5e, {
      resource: "spells",
      fields:
        "key,name,document,level,school,classes,casting_time,concentration,ritual,verbal,somatic,material",
      upstreamSchema: spellListItemSchema,
      itemSchema: wikiSpellListItemSchema,
      map: mapSpellListItem,
    }),
  ),
  get: publicProcedure
    .input(wikiKeyInputSchema)
    .query(async ({ ctx, input }) =>
      mapSpell(await ctx.open5e.get("spells", input.key, spellSchema)),
    ),
});
