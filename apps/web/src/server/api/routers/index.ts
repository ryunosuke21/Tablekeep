import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";

import { backgroundsRouter } from "./backgrounds";
import { classesRouter } from "./classes";
import { equipmentsRouter } from "./equipments";
import { featsRouter } from "./feats";
import { monstersRouter } from "./monsters";
import { racesRouter } from "./races";
import { ruleSectionsRouter, rulesRouter } from "./rules";
import { skillsRouter } from "./skills";
import { spellsRouter } from "./spells";
import { subracesRouter } from "./subraces";
import { traitsRouter } from "./traits";

export const appRouter = createTRPCRouter({
  health: createTRPCRouter({
    check: publicProcedure.query(() => {
      return {
        status: "ok",
      };
    }),
  }),
  backgrounds: backgroundsRouter,
  classes: classesRouter,
  equipments: equipmentsRouter,
  feats: featsRouter,
  monsters: monstersRouter,
  races: racesRouter,
  rules: rulesRouter,
  ruleSections: ruleSectionsRouter,
  skills: skillsRouter,
  spells: spellsRouter,
  subraces: subracesRouter,
  traits: traitsRouter,
});
