import { characterFixtures } from "@/server/api/mocks/dashboard";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";

export const characterRouter = createTRPCRouter({
  list: publicProcedure.query(() => ({
    items: characterFixtures,
    total: characterFixtures.length,
  })),
});
