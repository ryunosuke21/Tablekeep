import { campaignDmProcedure, createTRPCRouter } from "@/server/api/trpc";
import { getDmPlayBootstrap } from "@/server/db/queries/play";

import { playCampaignSummary } from "./common";

export const playDmRouter = createTRPCRouter({
  bootstrap: campaignDmProcedure.query(async ({ ctx }) => ({
    campaign: playCampaignSummary(ctx.campaign),
    role: "dm" as const,
    ...(await getDmPlayBootstrap(ctx.db, ctx.campaign.id, ctx.session.user.id)),
  })),
});
