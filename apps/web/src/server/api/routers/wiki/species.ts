import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import {
  mapSpecies,
  mapSpeciesListItem,
  speciesListItemSchema,
  speciesSchema,
} from "@/server/reference-data/open5e/resources";
import { wikiSpeciesListItemSchema } from "@/types/wiki";

import { readWikiCatalog, wikiKeyInputSchema } from "./common";

export const wikiSpeciesRouter = createTRPCRouter({
  catalog: publicProcedure.query(({ ctx }) =>
    readWikiCatalog(ctx.open5e, {
      resource: "species",
      fields: "key,name,document,is_subspecies,subspecies_of",
      upstreamSchema: speciesListItemSchema,
      itemSchema: wikiSpeciesListItemSchema,
      map: mapSpeciesListItem,
    }),
  ),
  get: publicProcedure
    .input(wikiKeyInputSchema)
    .query(async ({ ctx, input }) =>
      mapSpecies(await ctx.open5e.get("species", input.key, speciesSchema)),
    ),
});
