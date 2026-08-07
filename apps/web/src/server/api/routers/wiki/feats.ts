import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import {
  featListItemSchema,
  featSchema,
  mapFeat,
  mapFeatListItem,
} from "@/server/reference-data/open5e/resources";
import { wikiFeatListItemSchema } from "@/types/wiki";

import { readWikiCatalog, wikiKeyInputSchema } from "./common";

export const wikiFeatsRouter = createTRPCRouter({
  catalog: publicProcedure.query(({ ctx }) =>
    readWikiCatalog(ctx.open5e, {
      resource: "feats",
      fields: "key,name,document,type,has_prerequisite",
      upstreamSchema: featListItemSchema,
      itemSchema: wikiFeatListItemSchema,
      map: mapFeatListItem,
    }),
  ),
  get: publicProcedure
    .input(wikiKeyInputSchema)
    .query(async ({ ctx, input }) =>
      mapFeat(await ctx.open5e.get("feats", input.key, featSchema)),
    ),
});
