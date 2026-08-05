import { createTRPCRouter } from "@/server/api/trpc";

import { wikiBackgroundsRouter } from "./backgrounds";
import { wikiClassesRouter } from "./classes";
import { wikiCreaturesRouter } from "./creatures";
import { wikiFeatsRouter } from "./feats";
import { wikiItemsRouter, wikiMagicItemsRouter } from "./items";
import { wikiRulesRouter } from "./rules";
import { wikiSpeciesRouter } from "./species";
import { wikiSpellsRouter } from "./spells";

export const wikiRouter = createTRPCRouter({
  backgrounds: wikiBackgroundsRouter,
  classes: wikiClassesRouter,
  creatures: wikiCreaturesRouter,
  feats: wikiFeatsRouter,
  items: wikiItemsRouter,
  magicItems: wikiMagicItemsRouter,
  rules: wikiRulesRouter,
  species: wikiSpeciesRouter,
  spells: wikiSpellsRouter,
});
