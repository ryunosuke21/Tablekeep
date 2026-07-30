import { campaignFixtures } from "@/server/api/mocks/dashboard";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";

export const campaignRouter = createTRPCRouter({
  listMine: publicProcedure.query(() => ({
    items: campaignFixtures,
    total: campaignFixtures.length,
  })),
});
