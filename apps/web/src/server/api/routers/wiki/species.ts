import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import {
  mapSpecies,
  mapSpeciesListItem,
  speciesListItemSchema,
  speciesSchema,
} from "@/server/reference-data/open5e/resources";
import { wikiSpeciesListItemSchema } from "@/types/wiki";

import {
  mapWikiPage,
  resolveWikiPage,
  wikiKeyInputSchema,
  wikiPageInputSchema,
} from "./common";

const listInputSchema = wikiPageInputSchema.extend({
  name: z.string().min(1).optional(),
  kind: z.enum(["species", "subspecies", "all"]).default("all"),
});

export const wikiSpeciesRouter = createTRPCRouter({
  list: publicProcedure
    .input(listInputSchema.optional())
    .query(async ({ ctx, input }) => {
      const parsed = listInputSchema.parse(input ?? {});
      const page = resolveWikiPage(parsed);
      const { limit, name, kind } = parsed;
      const result = await ctx.open5e.list("species", speciesListItemSchema, {
        page,
        limit,
        name__icontains: name,
        subspecies_of__isnull: kind === "all" ? undefined : kind === "species",
        fields: "key,name,document,is_subspecies,subspecies_of",
      });
      return mapWikiPage(
        result,
        page,
        limit,
        mapSpeciesListItem,
        wikiSpeciesListItemSchema,
      );
    }),
  get: publicProcedure
    .input(wikiKeyInputSchema)
    .query(async ({ ctx, input }) =>
      mapSpecies(await ctx.open5e.get("species", input.key, speciesSchema)),
    ),
});
