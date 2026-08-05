import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import {
  mapSpell,
  mapSpellListItem,
  spellListItemSchema,
  spellSchema,
} from "@/server/reference-data/open5e/resources";
import { wikiSpellListItemSchema } from "@/types/wiki";

import { mapWikiPage, wikiKeyInputSchema, wikiPageInputSchema } from "./common";

const listInputSchema = wikiPageInputSchema.extend({
  name: z.string().min(1).optional(),
  level: z.number().int().min(0).max(9).optional(),
  schoolKey: z.string().min(1).optional(),
  classKey: z.string().min(1).optional(),
});

export const wikiSpellsRouter = createTRPCRouter({
  list: publicProcedure
    .input(listInputSchema.optional())
    .query(async ({ ctx, input }) => {
      const parsed = listInputSchema.parse(input ?? {});
      const result = await ctx.open5e.list("spells", spellListItemSchema, {
        page: parsed.page,
        limit: parsed.limit,
        name__icontains: parsed.name,
        level: parsed.level,
        school__key: parsed.schoolKey,
        classes__key: parsed.classKey,
        fields:
          "key,name,document,level,school,classes,casting_time,concentration,ritual,verbal,somatic,material",
      });
      return mapWikiPage(
        result,
        parsed.page,
        parsed.limit,
        mapSpellListItem,
        wikiSpellListItemSchema,
      );
    }),
  get: publicProcedure
    .input(wikiKeyInputSchema)
    .query(async ({ ctx, input }) =>
      mapSpell(await ctx.open5e.get("spells", input.key, spellSchema)),
    ),
});
