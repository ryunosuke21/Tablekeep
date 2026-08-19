import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { campaignMemberProcedure, createTRPCRouter } from "@/server/api/trpc";
import {
  getPrivateCampaignNote,
  savePrivateCampaignNote,
} from "@/server/db/queries/play";

import { playDmRouter } from "./dm";
import { playPlayerRouter } from "./player";

const noteUpdateSchema = z.object({
  campaignId: z.uuid(),
  content: z.string().max(100_000),
});

const noteRouter = createTRPCRouter({
  get: campaignMemberProcedure.query(({ ctx }) =>
    getPrivateCampaignNote(ctx.db, ctx.campaign.id, ctx.session.user.id),
  ),
  update: campaignMemberProcedure
    .input(noteUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      if (ctx.campaign.status === "archived") {
        throw new TRPCError({ code: "PRECONDITION_FAILED" });
      }

      const note = await savePrivateCampaignNote(ctx.db, {
        campaignId: ctx.campaign.id,
        userId: ctx.session.user.id,
        content: input.content,
      });

      if (!note) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }

      return note;
    }),
});

export const playRouter = createTRPCRouter({
  dm: playDmRouter,
  note: noteRouter,
  player: playPlayerRouter,
});
