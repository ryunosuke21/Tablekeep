import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import {
  creatureListItemSchema,
  creatureSchema,
  mapCreature,
  mapCreatureListItem,
} from "@/server/reference-data/open5e/resources";
import { wikiCreatureListItemSchema } from "@/types/wiki";

import { readWikiCatalog, wikiKeyInputSchema } from "./common";

export const wikiCreaturesRouter = createTRPCRouter({
  catalog: publicProcedure.query(({ ctx }) =>
    readWikiCatalog(ctx.open5e, {
      resource: "creatures",
      fields:
        "key,name,document,type,size,challenge_rating,category,armor_class,hit_points",
      upstreamSchema: creatureListItemSchema,
      itemSchema: wikiCreatureListItemSchema,
      map: mapCreatureListItem,
    }),
  ),
  get: publicProcedure
    .input(wikiKeyInputSchema)
    .query(async ({ ctx, input }) =>
      mapCreature(await ctx.open5e.get("creatures", input.key, creatureSchema)),
    ),
});
