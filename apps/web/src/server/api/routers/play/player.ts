import { campaignPlayerProcedure, createTRPCRouter } from "@/server/api/trpc";
import { getPlayerPlayBootstrap } from "@/server/db/queries/play";

import { playCampaignSummary } from "./common";

export const playPlayerRouter = createTRPCRouter({
  bootstrap: campaignPlayerProcedure.query(async ({ ctx }) => ({
    campaign: playCampaignSummary(ctx.campaign),
    role: "player" as const,
    ...(await getPlayerPlayBootstrap(
      ctx.db,
      ctx.campaign.id,
      ctx.session.user.id,
    )),
  })),
});
