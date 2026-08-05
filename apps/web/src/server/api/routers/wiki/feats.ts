import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import {
  featListItemSchema,
  featSchema,
  mapFeat,
  mapFeatListItem,
} from "@/server/reference-data/open5e/resources";

import { mapWikiPage, wikiKeyInputSchema, wikiPageInputSchema } from "./common";

const listInputSchema = wikiPageInputSchema.extend({
  name: z.string().min(1).optional(),
});

export const wikiFeatsRouter = createTRPCRouter({
  list: publicProcedure
    .input(listInputSchema.optional())
    .query(async ({ ctx, input }) => {
      const { page, limit, name } = listInputSchema.parse(input ?? {});
      const result = await ctx.open5e.list("feats", featListItemSchema, {
        page,
        limit,
        name__icontains: name,
        fields: "key,name,document,type,has_prerequisite",
      });
      return mapWikiPage(result, page, limit, mapFeatListItem);
    }),
  get: publicProcedure
    .input(wikiKeyInputSchema)
    .query(async ({ ctx, input }) =>
      mapFeat(await ctx.open5e.get("feats", input.key, featSchema)),
    ),
});
