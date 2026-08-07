import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import {
  classListItemSchema,
  classSchema,
  mapClass,
  mapClassListItem,
} from "@/server/reference-data/open5e/resources";
import { wikiClassListItemSchema } from "@/types/wiki";

import { readWikiCatalog, wikiKeyInputSchema } from "./common";

export const wikiClassesRouter = createTRPCRouter({
  catalog: publicProcedure.query(({ ctx }) =>
    readWikiCatalog(ctx.open5e, {
      resource: "classes",
      fields: "key,name,document,hit_dice,caster_type,subclass_of",
      upstreamSchema: classListItemSchema,
      itemSchema: wikiClassListItemSchema,
      map: mapClassListItem,
    }),
  ),
  get: publicProcedure
    .input(wikiKeyInputSchema)
    .query(async ({ ctx, input }) =>
      mapClass(await ctx.open5e.get("classes", input.key, classSchema)),
    ),
});
