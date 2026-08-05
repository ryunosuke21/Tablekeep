import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import {
  creatureListItemSchema,
  creatureSchema,
  mapCreature,
  mapCreatureListItem,
} from "@/server/reference-data/open5e/resources";
import { wikiCreatureListItemSchema } from "@/types/wiki";

import {
  mapWikiPage,
  resolveWikiPage,
  wikiKeyInputSchema,
  wikiPageInputSchema,
} from "./common";

const listInputSchema = wikiPageInputSchema.extend({
  name: z.string().min(1).optional(),
  size: z.string().min(1).optional(),
  category: z.string().min(1).optional(),
  challengeRatingMin: z.number().nonnegative().optional(),
  challengeRatingMax: z.number().nonnegative().optional(),
  armorClassMin: z.number().int().nonnegative().optional(),
  armorClassMax: z.number().int().nonnegative().optional(),
});

export const wikiCreaturesRouter = createTRPCRouter({
  list: publicProcedure
    .input(listInputSchema.optional())
    .query(async ({ ctx, input }) => {
      const parsed = listInputSchema.parse(input ?? {});
      const page = resolveWikiPage(parsed);
      const result = await ctx.open5e.list(
        "creatures",
        creatureListItemSchema,
        {
          page,
          limit: parsed.limit,
          name__icontains: parsed.name,
          size: parsed.size,
          category__iexact: parsed.category,
          challenge_rating__gte: parsed.challengeRatingMin,
          challenge_rating__lte: parsed.challengeRatingMax,
          armor_class__gte: parsed.armorClassMin,
          armor_class__lte: parsed.armorClassMax,
          fields:
            "key,name,document,type,size,challenge_rating,category,armor_class,hit_points",
        },
      );
      return mapWikiPage(
        result,
        page,
        parsed.limit,
        mapCreatureListItem,
        wikiCreatureListItemSchema,
      );
    }),
  get: publicProcedure
    .input(wikiKeyInputSchema)
    .query(async ({ ctx, input }) =>
      mapCreature(await ctx.open5e.get("creatures", input.key, creatureSchema)),
    ),
});
