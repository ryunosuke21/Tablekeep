import { createRandomStringGenerator } from "@better-auth/utils/random";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { MAX_ACTIVE_CAMPAIGNS_PER_USER } from "@/lib/constants";
import {
  campaignDetailsSchema,
  campaignUpdateSchema,
} from "@/lib/validation/campaign";
import {
  betaProcedure,
  campaignDmProcedure,
  campaignRestoreProcedure,
  createTRPCRouter,
} from "@/server/api/trpc";
import {
  archiveCampaign,
  campaignSlugExists,
  countActiveCampaignsForUser,
  countPendingCampaignInvites,
  createCampaign,
  getCampaignForMemberBySlug,
  listCampaignMembers,
  listCampaignOccurrenceOverrides,
  listCampaignsForUser,
  restoreCampaign,
  updateCampaign,
} from "@/server/db/queries/campaign";
import { resolveNextOccurrence } from "@/server/domain/campaign/schedule";
import { deriveCampaignSlug } from "@/server/domain/campaign/slug";

import { resolveCampaignSchedulePayload } from "./schedule";

const generateSlugSuffix = createRandomStringGenerator("a-z", "0-9");
const MAX_SLUG_ATTEMPTS = 8;

const listInputSchema = z
  .object({ status: z.enum(["active", "archived", "all"]).default("active") })
  .optional();

const campaignSlugSchema = z.object({ slug: z.string().trim().min(1).max(80) });
const campaignIdSchema = z.object({ campaignId: z.string().uuid() });

function isUniqueConstraintError(error: unknown): boolean {
  const visited = new Set<object>();
  let current = error;
  while (current && typeof current === "object" && !visited.has(current)) {
    visited.add(current);
    const candidate = current as { code?: unknown; cause?: unknown };
    if (candidate.code === "23505") return true;
    current = candidate.cause;
  }
  return false;
}

function overridesByCampaign<Override extends { campaignId: string }>(
  overrides: Override[],
) {
  const grouped = new Map<string, Override[]>();
  for (const override of overrides) {
    const campaignOverrides = grouped.get(override.campaignId) ?? [];
    campaignOverrides.push(override);
    grouped.set(override.campaignId, campaignOverrides);
  }
  return grouped;
}

function nextSessionFor(
  campaign: Parameters<typeof resolveNextOccurrence>[0],
  overrides: Parameters<typeof resolveNextOccurrence>[1],
  now: Date,
) {
  return resolveNextOccurrence(campaign, overrides, { now });
}

export const campaignProcedures = {
  list: betaProcedure.input(listInputSchema).query(async ({ ctx, input }) => {
    const campaigns = await listCampaignsForUser(
      ctx.db,
      ctx.session.user.id,
      input?.status ?? "active",
    );
    const overrides = await listCampaignOccurrenceOverrides(
      ctx.db,
      campaigns.map((campaign) => campaign.id),
    );
    const groupedOverrides = overridesByCampaign(overrides);
    const now = new Date();

    return {
      items: campaigns.map((campaign) => ({
        id: campaign.id,
        slug: campaign.slug,
        name: campaign.name,
        description: campaign.description ?? "",
        role: campaign.role,
        memberCount: campaign.memberCount,
        members: campaign.members.map((member) => ({
          id: member.id,
          name: member.name,
          imageUrl: member.image,
        })),
        nextSession: nextSessionFor(
          campaign,
          groupedOverrides.get(campaign.id) ?? [],
          now,
        ),
        colors: campaign.colors,
        updatedAt: campaign.updatedAt,
      })),
    };
  }),

  get: betaProcedure.input(campaignSlugSchema).query(async ({ ctx, input }) => {
    const campaign = await getCampaignForMemberBySlug(
      ctx.db,
      input.slug,
      ctx.session.user.id,
    );
    if (!campaign) {
      throw new TRPCError({ code: "NOT_FOUND" });
    }

    const [members, schedule, pendingInviteCount] = await Promise.all([
      listCampaignMembers(ctx.db, campaign.id),
      resolveCampaignSchedulePayload(ctx.db, campaign),
      campaign.memberRole === "dm"
        ? countPendingCampaignInvites(ctx.db, campaign.id)
        : Promise.resolve(undefined),
    ]);
    const {
      memberId: _memberId,
      memberRole,
      memberSince: _memberSince,
      recurrence: _recurrence,
      recurrenceStartAt: _recurrenceStartAt,
      recurrenceTimeZone: _recurrenceTimeZone,
      recurrenceDurationMinutes: _recurrenceDurationMinutes,
      ...campaignDetails
    } = campaign;

    return {
      campaign: campaignDetails,
      members,
      role: memberRole,
      schedule,
      ...(memberRole === "dm" ? { pendingInviteCount } : {}),
    };
  }),

  create: betaProcedure
    .input(campaignDetailsSchema)
    .mutation(async ({ ctx, input }) => {
      const activeCampaignCount = await countActiveCampaignsForUser(
        ctx.db,
        ctx.session.user.id,
      );
      if (activeCampaignCount >= MAX_ACTIVE_CAMPAIGNS_PER_USER) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: `You can have up to ${MAX_ACTIVE_CAMPAIGNS_PER_USER} active campaigns.`,
        });
      }

      for (let attempt = 0; attempt < MAX_SLUG_ATTEMPTS; attempt += 1) {
        const slug = deriveCampaignSlug(
          input.name,
          attempt === 0 ? undefined : generateSlugSuffix(6),
        );
        if (await campaignSlugExists(ctx.db, slug)) continue;

        try {
          const created = await createCampaign(ctx.db, {
            ...input,
            slug,
            creatorId: ctx.session.user.id,
          });
          if (!created) {
            throw new TRPCError({
              code: "PRECONDITION_FAILED",
              message: `You can have up to ${MAX_ACTIVE_CAMPAIGNS_PER_USER} active campaigns.`,
            });
          }
          return { slug: created.slug };
        } catch (error) {
          // The unique index is the final arbiter if another create wins the
          // race after our friendly existence check.
          if (isUniqueConstraintError(error)) continue;
          throw error;
        }
      }

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Could not create a unique campaign URL. Please try again.",
      });
    }),

  update: campaignDmProcedure
    .input(campaignUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const { campaignId, ...values } = input;
      const campaign = await updateCampaign(ctx.db, campaignId, values);
      if (!campaign) throw new TRPCError({ code: "NOT_FOUND" });
      return campaign;
    }),

  archive: campaignDmProcedure
    .input(campaignIdSchema)
    .mutation(async ({ ctx, input }) => {
      const campaign = await archiveCampaign(
        ctx.db,
        input.campaignId,
        ctx.session.user.id,
      );
      if (!campaign) throw new TRPCError({ code: "NOT_FOUND" });
      return campaign;
    }),

  restore: campaignRestoreProcedure
    .input(campaignIdSchema)
    .mutation(async ({ ctx, input }) => {
      const campaign = await restoreCampaign(ctx.db, input.campaignId);
      if (!campaign) throw new TRPCError({ code: "NOT_FOUND" });
      return campaign;
    }),
};

export const campaignsRouter = createTRPCRouter(campaignProcedures);
