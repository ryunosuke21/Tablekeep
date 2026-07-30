import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { campaignRouter } from "./campaign";
import { characterRouter } from "./character";
import { feedbackRouter } from "./feedback";

export const appRouter = createTRPCRouter({
  campaign: campaignRouter,
  character: characterRouter,
  feedback: feedbackRouter,
  health: createTRPCRouter({
    check: publicProcedure.query(() => {
      return {
        status: "ok",
      };
    }),
  }),
});
