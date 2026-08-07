import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import {
  backgroundSchema,
  catalogListItemSchema,
  mapBackground,
  mapCatalogListItem,
} from "@/server/reference-data/open5e/resources";
import { wikiCatalogListItemSchema } from "@/types/wiki";

import { readWikiCatalog, wikiKeyInputSchema } from "./common";

export const wikiBackgroundsRouter = createTRPCRouter({
  catalog: publicProcedure.query(({ ctx }) =>
    readWikiCatalog(ctx.open5e, {
      resource: "backgrounds",
      fields: "key,name,document",
      upstreamSchema: catalogListItemSchema,
      itemSchema: wikiCatalogListItemSchema,
      map: mapCatalogListItem,
    }),
  ),
  get: publicProcedure
    .input(wikiKeyInputSchema)
    .query(async ({ ctx, input }) =>
      mapBackground(
        await ctx.open5e.get("backgrounds", input.key, backgroundSchema),
      ),
    ),
});
