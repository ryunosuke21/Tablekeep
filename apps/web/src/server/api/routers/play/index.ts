import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { env } from "@/env/server";
import { issuePartyKitToken } from "@/lib/partykit-token";
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

const realtimeRouter = createTRPCRouter({
  token: campaignMemberProcedure.query(async ({ ctx }) => {
    if (!env.PARTYKIT_SECRET) {
      throw new TRPCError({ code: "PRECONDITION_FAILED" });
    }

    const ttlSeconds = 60;
    return {
      expiresAt: new Date(Date.now() + ttlSeconds * 1000),
      token: await issuePartyKitToken(
        {
          campaignId: ctx.campaign.id,
          role: ctx.member.role,
          scope: "connect",
          sub: ctx.session.user.id,
        },
        env.PARTYKIT_SECRET,
        { ttlSeconds },
      ),
    };
  }),
});

export const playRouter = createTRPCRouter({
  dm: playDmRouter,
  note: noteRouter,
  player: playPlayerRouter,
  realtime: realtimeRouter,
});
