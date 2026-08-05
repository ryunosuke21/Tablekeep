import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import {
  itemListItemSchema,
  itemSchema,
  magicItemListItemSchema,
  magicItemSchema,
  mapItem,
  mapItemListItem,
  mapMagicItem,
  mapMagicItemListItem,
} from "@/server/reference-data/open5e/resources";
import {
  wikiItemListItemSchema,
  wikiMagicItemListItemSchema,
} from "@/types/wiki";

import {
  mapWikiPage,
  resolveWikiPage,
  wikiKeyInputSchema,
  wikiPageInputSchema,
} from "./common";

const listInputSchema = wikiPageInputSchema.extend({
  name: z.string().min(1).optional(),
  category: z.string().min(1).optional(),
});

export const wikiItemsRouter = createTRPCRouter({
  list: publicProcedure
    .input(listInputSchema.optional())
    .query(async ({ ctx, input }) => {
      const parsed = listInputSchema.parse(input ?? {});
      const page = resolveWikiPage(parsed);
      const { limit, name, category } = parsed;
      const result = await ctx.open5e.list("items", itemListItemSchema, {
        page,
        limit,
        name__icontains: name,
        category,
        fields: "key,name,document,category",
      });
      return mapWikiPage(
        result,
        page,
        limit,
        mapItemListItem,
        wikiItemListItemSchema,
      );
    }),
  get: publicProcedure
    .input(wikiKeyInputSchema)
    .query(async ({ ctx, input }) =>
      mapItem(await ctx.open5e.get("items", input.key, itemSchema)),
    ),
});

export const wikiMagicItemsRouter = createTRPCRouter({
  list: publicProcedure
    .input(listInputSchema.optional())
    .query(async ({ ctx, input }) => {
      const parsed = listInputSchema.parse(input ?? {});
      const page = resolveWikiPage(parsed);
      const { limit, name, category } = parsed;
      const result = await ctx.open5e.list(
        "magicitems",
        magicItemListItemSchema,
        {
          page,
          limit,
          name__icontains: name,
          category,
          fields: "key,name,document,category,rarity,requires_attunement",
        },
      );
      return mapWikiPage(
        result,
        page,
        limit,
        mapMagicItemListItem,
        wikiMagicItemListItemSchema,
      );
    }),
  get: publicProcedure
    .input(wikiKeyInputSchema)
    .query(async ({ ctx, input }) =>
      mapMagicItem(
        await ctx.open5e.get("magicitems", input.key, magicItemSchema),
      ),
    ),
});
