import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import {
  backgroundSchema,
  catalogListItemSchema,
  mapBackground,
  mapCatalogListItem,
} from "@/server/reference-data/open5e/resources";
import { wikiCatalogListItemSchema } from "@/types/wiki";

import {
  mapWikiPage,
  resolveWikiPage,
  wikiKeyInputSchema,
  wikiPageInputSchema,
} from "./common";

const listInputSchema = wikiPageInputSchema.extend({
  name: z.string().min(1).optional(),
});

export const wikiBackgroundsRouter = createTRPCRouter({
  list: publicProcedure
    .input(listInputSchema.optional())
    .query(async ({ ctx, input }) => {
      const parsed = listInputSchema.parse(input ?? {});
      const page = resolveWikiPage(parsed);
      const { limit, name } = parsed;
      const result = await ctx.open5e.list(
        "backgrounds",
        catalogListItemSchema,
        {
          page,
          limit,
          name__icontains: name,
          fields: "key,name,document",
        },
      );
      return mapWikiPage(
        result,
        page,
        limit,
        mapCatalogListItem,
        wikiCatalogListItemSchema,
      );
    }),
  get: publicProcedure
    .input(wikiKeyInputSchema)
    .query(async ({ ctx, input }) =>
      mapBackground(
        await ctx.open5e.get("backgrounds", input.key, backgroundSchema),
      ),
    ),
});
