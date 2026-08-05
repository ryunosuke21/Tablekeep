import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import {
  classListItemSchema,
  classSchema,
  mapClass,
  mapClassListItem,
} from "@/server/reference-data/open5e/resources";
import { wikiClassListItemSchema } from "@/types/wiki";

import { mapWikiPage, wikiKeyInputSchema, wikiPageInputSchema } from "./common";

const listInputSchema = wikiPageInputSchema.extend({
  name: z.string().min(1).optional(),
  kind: z.enum(["class", "subclass", "all"]).default("class"),
});

export const wikiClassesRouter = createTRPCRouter({
  list: publicProcedure
    .input(listInputSchema.optional())
    .query(async ({ ctx, input }) => {
      const { page, limit, name, kind } = listInputSchema.parse(input ?? {});
      const result = await ctx.open5e.list("classes", classListItemSchema, {
        page,
        limit,
        name__contains: name,
        is_subclass: kind === "all" ? undefined : kind === "subclass",
        fields: "key,name,document,hit_dice,caster_type,subclass_of",
      });
      return mapWikiPage(
        result,
        page,
        limit,
        mapClassListItem,
        wikiClassListItemSchema,
      );
    }),
  get: publicProcedure
    .input(wikiKeyInputSchema)
    .query(async ({ ctx, input }) =>
      mapClass(await ctx.open5e.get("classes", input.key, classSchema)),
    ),
});
