import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { memberRoleUpdateSchema } from "@/lib/validation/campaign";
import {
  campaignDmProcedure,
  campaignMemberProcedure,
  createTRPCRouter,
} from "@/server/api/trpc";
import {
  leaveCampaign,
  listCampaignMemberEvents,
  listCampaignMembers,
  removeCampaignMember,
  updateCampaignMemberRole,
} from "@/server/db/queries/campaign";
import {
  assertCanLeaveCampaign,
  assertCanRemoveMember,
  assertCanUpdateRole,
  CampaignMembershipInvariantError,
} from "@/server/domain/campaign/membership";

const campaignIdSchema = z.object({ campaignId: z.string().uuid() });
const removeMemberSchema = campaignIdSchema.extend({
  memberId: z.string().min(1),
});

function mapMembershipInvariant(error: unknown): never {
  if (!(error instanceof CampaignMembershipInvariantError)) throw error;
  throw new TRPCError({
    code: error.code === "SELF_REMOVAL" ? "BAD_REQUEST" : "PRECONDITION_FAILED",
    message: error.message,
    cause: error,
  });
}

function guardedWriteFailed(): never {
  throw new TRPCError({
    code: "PRECONDITION_FAILED",
    message: "The membership changed before this action could be completed.",
  });
}

export const membersRouter = createTRPCRouter({
  list: campaignMemberProcedure
    .input(campaignIdSchema)
    .query(async ({ ctx, input }) => {
      const [members, history] = await Promise.all([
        listCampaignMembers(ctx.db, input.campaignId),
        ctx.member.role === "dm"
          ? listCampaignMemberEvents(ctx.db, input.campaignId)
          : Promise.resolve(undefined),
      ]);
      return {
        members,
        ...(ctx.member.role === "dm" ? { history } : {}),
      };
    }),

  updateRole: campaignDmProcedure
    .input(memberRoleUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const members = await listCampaignMembers(ctx.db, input.campaignId);
      const target = members.find((member) => member.id === input.memberId);
      if (!target) throw new TRPCError({ code: "NOT_FOUND" });

      try {
        assertCanUpdateRole({
          currentRole: target.role,
          nextRole: input.role,
          activeDmCount: members.filter((member) => member.role === "dm")
            .length,
        });
      } catch (error) {
        mapMembershipInvariant(error);
      }

      const updated = await updateCampaignMemberRole(ctx.db, {
        ...input,
        actorId: ctx.session.user.id,
      });
      if (!updated) guardedWriteFailed();
      return updated;
    }),

  remove: campaignDmProcedure
    .input(removeMemberSchema)
    .mutation(async ({ ctx, input }) => {
      const members = await listCampaignMembers(ctx.db, input.campaignId);
      const target = members.find((member) => member.id === input.memberId);
      if (!target) throw new TRPCError({ code: "NOT_FOUND" });

      try {
        assertCanRemoveMember({
          actorMemberId: ctx.member.id,
          targetMemberId: target.id,
          targetRole: target.role,
          activeDmCount: members.filter((member) => member.role === "dm")
            .length,
        });
      } catch (error) {
        mapMembershipInvariant(error);
      }

      const removed = await removeCampaignMember(ctx.db, {
        ...input,
        actorId: ctx.session.user.id,
      });
      if (!removed) guardedWriteFailed();
      return { success: true };
    }),

  leave: campaignMemberProcedure
    .input(campaignIdSchema)
    .mutation(async ({ ctx, input }) => {
      if (ctx.campaign.status === "archived") {
        throw new TRPCError({ code: "PRECONDITION_FAILED" });
      }
      const members = await listCampaignMembers(ctx.db, input.campaignId);
      try {
        assertCanLeaveCampaign(
          ctx.member.role,
          members.filter((member) => member.role === "dm").length,
        );
      } catch (error) {
        mapMembershipInvariant(error);
      }

      const left = await leaveCampaign(ctx.db, {
        campaignId: input.campaignId,
        userId: ctx.session.user.id,
      });
      if (!left) guardedWriteFailed();
      return { success: true };
    }),
});
