import { createTRPCRouter } from "@/server/api/trpc";

import { campaignProcedures } from "./campaigns";
import { campaignInvitesRouter } from "./invites";
import { membersRouter } from "./members";
import { campaignScheduleRouter } from "./schedule";

export const campaignRouter = createTRPCRouter({
  ...campaignProcedures,
  members: membersRouter,
  invites: campaignInvitesRouter,
  schedule: campaignScheduleRouter,
});
