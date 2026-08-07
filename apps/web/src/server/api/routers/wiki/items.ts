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

import { readWikiCatalog, wikiKeyInputSchema } from "./common";

export const wikiItemsRouter = createTRPCRouter({
  catalog: publicProcedure.query(({ ctx }) =>
    readWikiCatalog(ctx.open5e, {
      resource: "items",
      fields: "key,name,document,category",
      upstreamSchema: itemListItemSchema,
      itemSchema: wikiItemListItemSchema,
      map: mapItemListItem,
    }),
  ),
  get: publicProcedure
    .input(wikiKeyInputSchema)
    .query(async ({ ctx, input }) =>
      mapItem(await ctx.open5e.get("items", input.key, itemSchema)),
    ),
});

export const wikiMagicItemsRouter = createTRPCRouter({
  catalog: publicProcedure.query(({ ctx }) =>
    readWikiCatalog(ctx.open5e, {
      resource: "magicitems",
      fields: "key,name,document,category,rarity,requires_attunement",
      upstreamSchema: magicItemListItemSchema,
      itemSchema: wikiMagicItemListItemSchema,
      map: mapMagicItemListItem,
    }),
  ),
  get: publicProcedure
    .input(wikiKeyInputSchema)
    .query(async ({ ctx, input }) =>
      mapMagicItem(
        await ctx.open5e.get("magicitems", input.key, magicItemSchema),
      ),
    ),
});
