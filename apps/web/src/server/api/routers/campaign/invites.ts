import { TRPCError } from "@trpc/server";
import { APIError } from "better-auth/api";
import { z } from "zod";

import {
  campaignRoleSchema,
  emailInviteCreationSchema,
  inviteReferenceSchema,
  linkInviteCreationSchema,
} from "@/lib/validation/campaign";
import {
  campaignDmProcedure,
  createTRPCRouter,
  protectedProcedure,
} from "@/server/api/trpc";
import { auth } from "@/server/better-auth";
import {
  acceptCampaignInviteCode,
  getCampaignForMemberById,
  getCampaignInviteCode,
  listPendingCampaignInvitations,
  listPendingCampaignInviteCodes,
  replaceCampaignInviteCode,
  revokeCampaignInviteCodes,
} from "@/server/db/queries/campaign";
import { evaluateInviteCode } from "@/server/domain/campaign/invite";
import {
  formatInviteCode,
  generateInviteCode,
  normalizeInviteCode,
} from "@/server/domain/campaign/invite-code";

const CAMPAIGN_ID = z.string().uuid();
const LINK_CODE_CREATION_ATTEMPTS = 5;
const RESEND_THROTTLE_MS = 60_000;
const INVITE_LOOKUP_WINDOW_MS = 60_000;
const INVITE_LOOKUP_LIMIT = 20;

// Beta-only, single-process guard. It intentionally has a reset seam for unit
// tests. A shared store is required before horizontally scaling the web app.
const recentResends = new Map<string, number>();
const inviteLookupWindows = new Map<
  string,
  { count: number; startedAt: number }
>();

export function resetInviteResendThrottleForTests() {
  recentResends.clear();
  inviteLookupWindows.clear();
}

function enforceInviteLookupRateLimit(
  userId: string,
  operation: "preview" | "accept",
) {
  // Beta-only, single-process guard. Move this to a shared store before the web
  // app is horizontally scaled so requests cannot evade limits by changing pods.
  const key = `${operation}:${userId}`;
  const now = Date.now();
  const window = inviteLookupWindows.get(key);
  if (!window || now - window.startedAt >= INVITE_LOOKUP_WINDOW_MS) {
    inviteLookupWindows.set(key, { count: 1, startedAt: now });
    return;
  }
  if (window.count >= INVITE_LOOKUP_LIMIT) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: "Too many invitation attempts. Wait a minute and try again.",
    });
  }
  window.count += 1;
}

function mapAuthError(error: unknown): never {
  if (!(error instanceof APIError)) throw error;

  const code =
    error.status === "UNAUTHORIZED"
      ? "UNAUTHORIZED"
      : error.status === "FORBIDDEN"
        ? "FORBIDDEN"
        : error.status === "NOT_FOUND"
          ? "NOT_FOUND"
          : error.status === "TOO_MANY_REQUESTS"
            ? "TOO_MANY_REQUESTS"
            : error.status === "CONFLICT"
              ? "CONFLICT"
              : "BAD_REQUEST";
  throw new TRPCError({ code, message: error.message, cause: error });
}

function inviteStateError(
  status: Exclude<ReturnType<typeof evaluateInviteCode>["status"], "ok">,
): TRPCError {
  const message = {
    revoked: "That invitation is no longer valid.",
    expired: "That invitation has expired.",
    exhausted: "That invitation has reached its usage limit.",
    campaign_archived: "Archived campaigns cannot accept invitations.",
  }[status];
  return new TRPCError({
    code:
      status === "campaign_archived" ? "PRECONDITION_FAILED" : "BAD_REQUEST",
    message,
  });
}

function isUniqueViolation(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const candidate = error as { code?: unknown; cause?: { code?: unknown } };
  return candidate.code === "23505" || candidate.cause?.code === "23505";
}

const resendSchema = z.object({
  campaignId: CAMPAIGN_ID,
  invitationId: z.string().min(1),
});

const revokeSchema = z.discriminatedUnion("kind", [
  z.object({
    campaignId: CAMPAIGN_ID,
    kind: z.literal("email"),
    invitationId: z.string().min(1),
  }),
  z.object({
    campaignId: CAMPAIGN_ID,
    kind: z.literal("link"),
    role: campaignRoleSchema.optional(),
  }),
]);

export const campaignInvitesRouter = createTRPCRouter({
  list: campaignDmProcedure.query(async ({ ctx }) => {
    const [emailInvitations, linkCodes] = await Promise.all([
      listPendingCampaignInvitations(ctx.db, ctx.campaign.id),
      listPendingCampaignInviteCodes(ctx.db, ctx.campaign.id),
    ]);

    return {
      emailInvitations: emailInvitations.map((invitation) => ({
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        expiresAt: invitation.expiresAt,
        createdAt: invitation.createdAt,
      })),
      linkCodes: linkCodes.map((invite) => ({
        code: invite.code,
        role: invite.role,
        expiresAt: invite.expiresAt,
        maxUses: invite.maxUses,
        useCount: invite.useCount,
        createdAt: invite.createdAt,
      })),
    };
  }),

  createLink: campaignDmProcedure
    .input(linkInviteCreationSchema)
    .mutation(async ({ ctx, input }) => {
      const expiresAt = new Date(
        Date.now() + input.expiresInDays * 24 * 60 * 60 * 1_000,
      );
      for (let attempt = 0; attempt < LINK_CODE_CREATION_ATTEMPTS; attempt++) {
        const code = generateInviteCode();
        try {
          const invite = await replaceCampaignInviteCode(ctx.db, {
            campaignId: ctx.campaign.id,
            code,
            role: input.role,
            expiresAt,
            maxUses: input.maxUses,
            createdById: ctx.session.user.id,
          });
          if (!invite) break;
          return {
            code: invite.code,
            url: `/join/${formatInviteCode(invite.code)}`,
            expiresAt: invite.expiresAt,
          };
        } catch (error) {
          if (!isUniqueViolation(error)) throw error;
        }
      }
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Could not create a unique invitation code. Try again.",
      });
    }),

  createEmail: campaignDmProcedure
    .input(emailInviteCreationSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const result = await auth.api.createInvitation({
          headers: ctx.headers,
          body: {
            organizationId: ctx.campaign.id,
            email: input.email,
            role: input.role,
          },
        });
        return {
          id: result.id,
          email: result.email,
          role: result.role,
          expiresAt: result.expiresAt,
        };
      } catch (error) {
        return mapAuthError(error);
      }
    }),

  resend: campaignDmProcedure
    .input(resendSchema)
    .mutation(async ({ ctx, input }) => {
      const invitations = await listPendingCampaignInvitations(
        ctx.db,
        ctx.campaign.id,
      );
      const invitation = invitations.find(
        (candidate) => candidate.id === input.invitationId,
      );
      if (!invitation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "That pending invitation was not found.",
        });
      }
      const key = `${ctx.campaign.id}:${input.invitationId}`;
      const now = Date.now();
      const previous = recentResends.get(key);
      if (previous !== undefined && now - previous < RESEND_THROTTLE_MS) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Wait a minute before resending this invitation.",
        });
      }

      try {
        const result = await auth.api.createInvitation({
          headers: ctx.headers,
          body: {
            organizationId: ctx.campaign.id,
            email: invitation.email,
            role: invitation.role,
            resend: true,
          },
        });
        recentResends.set(key, now);
        return {
          id: result.id,
          expiresAt: result.expiresAt,
        };
      } catch (error) {
        return mapAuthError(error);
      }
    }),

  revoke: campaignDmProcedure
    .input(revokeSchema)
    .mutation(async ({ ctx, input }) => {
      if (input.kind === "link") {
        await revokeCampaignInviteCodes(ctx.db, {
          campaignId: ctx.campaign.id,
          role: input.role,
          actorId: ctx.session.user.id,
        });
        return { revoked: true as const };
      }

      try {
        const invitations = await listPendingCampaignInvitations(
          ctx.db,
          ctx.campaign.id,
        );
        if (
          !invitations.some(
            (invitation) => invitation.id === input.invitationId,
          )
        ) {
          // Revocation is intentionally idempotent. Do not send a bearer id to
          // Better Auth unless it is scoped to the verified campaign.
          return { revoked: true as const };
        }
        await auth.api.cancelInvitation({
          headers: ctx.headers,
          body: { invitationId: input.invitationId },
        });
        return { revoked: true as const };
      } catch (error) {
        return mapAuthError(error);
      }
    }),

  preview: protectedProcedure
    .input(inviteReferenceSchema)
    .query(async ({ ctx, input }) => {
      if ("invitationId" in input) {
        enforceInviteLookupRateLimit(ctx.session.user.id, "preview");
        try {
          const invitation = await auth.api.getInvitation({
            headers: ctx.headers,
            query: { id: input.invitationId },
          });
          const member = await getCampaignForMemberById(
            ctx.db,
            invitation.organizationId,
            ctx.session.user.id,
          );
          return {
            kind: "email" as const,
            campaignName: invitation.organizationName,
            campaignSlug: invitation.organizationSlug,
            inviterName: null,
            role: invitation.role,
            expiresAt: invitation.expiresAt,
            addressedToYou: true,
            alreadyMember: member !== null,
          };
        } catch (error) {
          return mapAuthError(error);
        }
      }

      enforceInviteLookupRateLimit(ctx.session.user.id, "preview");

      const invite = await getCampaignInviteCode(
        ctx.db,
        normalizeInviteCode(input.code),
      );
      if (!invite) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "That invitation is not valid.",
        });
      }
      const evaluation = evaluateInviteCode(
        invite,
        { status: invite.campaignStatus },
        { now: new Date() },
      );
      if (evaluation.status !== "ok") throw inviteStateError(evaluation.status);
      const member = await getCampaignForMemberById(
        ctx.db,
        invite.campaignId,
        ctx.session.user.id,
      );
      return {
        kind: "link" as const,
        campaignName: invite.campaignName,
        campaignSlug: invite.campaignSlug,
        inviterName: invite.inviterName,
        role: invite.role,
        expiresAt: invite.expiresAt,
        addressedToYou: true,
        alreadyMember: member !== null,
      };
    }),

  accept: protectedProcedure
    .input(inviteReferenceSchema)
    .mutation(async ({ ctx, input }) => {
      if ("invitationId" in input) {
        enforceInviteLookupRateLimit(ctx.session.user.id, "accept");
        try {
          const invitation = await auth.api.getInvitation({
            headers: ctx.headers,
            query: { id: input.invitationId },
          });
          const existing = await getCampaignForMemberById(
            ctx.db,
            invitation.organizationId,
            ctx.session.user.id,
          );
          if (existing) {
            return {
              status: "already_member" as const,
              slug: invitation.organizationSlug,
            };
          }
          const result = await auth.api.acceptInvitation({
            headers: ctx.headers,
            body: { invitationId: input.invitationId },
          });
          if (!result.invitation) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "That invitation is no longer valid.",
            });
          }
          return {
            status: "joined" as const,
            slug: invitation.organizationSlug,
          };
        } catch (error) {
          if (error instanceof TRPCError) throw error;
          const invitation = await auth.api
            .getInvitation({
              headers: ctx.headers,
              query: { id: input.invitationId },
            })
            .catch(() => null);
          if (invitation) {
            const existing = await getCampaignForMemberById(
              ctx.db,
              invitation.organizationId,
              ctx.session.user.id,
            );
            if (existing) {
              return {
                status: "already_member" as const,
                slug: invitation.organizationSlug,
              };
            }
          }
          return mapAuthError(error);
        }
      }

      enforceInviteLookupRateLimit(ctx.session.user.id, "accept");

      const invite = await getCampaignInviteCode(
        ctx.db,
        normalizeInviteCode(input.code),
      );
      if (!invite) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "That invitation is not valid.",
        });
      }
      const evaluation = evaluateInviteCode(
        invite,
        { status: invite.campaignStatus },
        { now: new Date() },
      );
      if (evaluation.status !== "ok") throw inviteStateError(evaluation.status);

      const existing = await getCampaignForMemberById(
        ctx.db,
        invite.campaignId,
        ctx.session.user.id,
      );
      if (existing) {
        return { status: "already_member" as const, slug: invite.campaignSlug };
      }

      const member = await acceptCampaignInviteCode(ctx.db, {
        inviteCodeId: invite.id,
        userId: ctx.session.user.id,
        now: new Date(),
      });
      if (!member) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "That invitation was just used or is no longer valid.",
        });
      }
      return { status: "joined" as const, slug: invite.campaignSlug };
    }),
});
