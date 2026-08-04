import { BetterAuthError, betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import { admin, magicLink, multiSession } from "better-auth/plugins";

import { createCampaignOrganization } from "@tablekeep/campaign-auth/server";
import { renderCampaignInvite, renderMagicLink } from "@tablekeep/emails";
import { APP_NAME } from "@tablekeep/shared";

import { env } from "@/env/server";
import {
  CAMPAIGN_INVITE_TTL_SECONDS,
  MAX_CAMPAIGN_MEMBERS,
  MAX_PENDING_CAMPAIGN_INVITATIONS,
} from "@/lib/constants";
import { access, roles } from "@/server/better-auth/admin";
import { db, schema } from "@/server/db";
import { campaignMemberEvents } from "@/server/db/schema";
import { sendEmail } from "@/server/services/email";

const CAMPAIGN_MUTATION_PATHS = [
  "/organization/create",
  "/organization/update",
  "/organization/delete",
  "/organization/remove-member",
  "/organization/update-member-role",
  "/organization/leave",
] as const;

const CAMPAIGN_ROLES = new Set(["dm", "player"]);

const appUrl = env.VERCEL_URL
  ? `https://${env.VERCEL_URL}`
  : "http://localhost:3000";

function assertCampaignAcceptsInvitations(
  organization: Record<string, unknown>,
) {
  if (organization.status === "archived") {
    throw new APIError("BAD_REQUEST", {
      message: "Archived campaigns cannot accept invitations.",
    });
  }
}

function assertCampaignRole(role: string) {
  const roles = role.split(",");

  if (roles.length !== 1 || !CAMPAIGN_ROLES.has(roles[0] ?? "")) {
    throw new APIError("BAD_REQUEST", {
      message: "Campaign invitations must use the dm or player role.",
    });
  }
}

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    camelCase: false,
    usePlural: true,
    schema,
    debugLogs: env.LOG_LEVEL === "debug",
  }),
  appName: APP_NAME,
  baseURL: env.VERCEL_URL
    ? `https://${env.VERCEL_URL}`
    : "http://localhost:3000",
  emailAndPassword: {
    enabled: false,
  },
  // Active membership history belongs to the app. These stock mutations have
  // no complete hook surface, so campaign tRPC procedures own all six paths.
  disabledPaths: [...CAMPAIGN_MUTATION_PATHS],
  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    },
  },
  plugins: [
    admin({
      ac: access,
      roles,
      defaultRole: "user",
      adminRoles: ["admin"],
    }),
    multiSession({
      maximumSessions: 5,
    }),
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        const html = await renderMagicLink({
          appName: APP_NAME,
          url,
          baseUrl: env.VERCEL_URL
            ? `https://${env.VERCEL_URL}`
            : "http://localhost:3000",
        });

        const { data, error } = await sendEmail({
          to: email,
          html,
          subject: "Sign in to your account",
          from: env.FROM_EMAIL,
        });

        if (error) {
          throw new BetterAuthError(error.message, { cause: error });
        }

        console.log(`Magic link ${data.id} was sent`);
      },
      storeToken: env.NODE_ENV === "production" ? "hashed" : "plain",
    }),
    createCampaignOrganization({
      disableOrganizationDeletion: true,
      invitationExpiresIn: CAMPAIGN_INVITE_TTL_SECONDS,
      invitationLimit: MAX_PENDING_CAMPAIGN_INVITATIONS,
      membershipLimit: MAX_CAMPAIGN_MEMBERS,
      cancelPendingInvitationsOnReInvite: true,
      schema: {
        session: {
          fields: { activeOrganizationId: "activeOrganizationId" },
        },
        organization: {
          modelName: "campaign",
          fields: {
            name: "name",
            slug: "slug",
            logo: "logo",
            metadata: "metadata",
            createdAt: "createdAt",
          },
          additionalFields: {
            description: { type: "string", required: false },
            bannerImage: { type: "string", required: false },
            colors: {
              type: "string",
              required: true,
              defaultValue: "lilac",
            },
            status: {
              type: "string",
              required: true,
              defaultValue: "active",
            },
            recurrence: { type: "string", required: false },
            recurrenceStartAt: { type: "date", required: false },
            recurrenceTimeZone: { type: "string", required: false },
            recurrenceDurationMinutes: { type: "number", required: false },
            archivedAt: { type: "date", required: false },
            createdById: { type: "string", required: false },
            updatedAt: { type: "date", required: true },
          },
        },
        member: {
          modelName: "campaignMember",
          fields: {
            organizationId: "organizationId",
            userId: "userId",
            role: "role",
            createdAt: "createdAt",
          },
        },
        invitation: {
          modelName: "campaignInvitation",
          fields: {
            organizationId: "organizationId",
            email: "email",
            role: "role",
            status: "status",
            expiresAt: "expiresAt",
            inviterId: "inviterId",
            createdAt: "createdAt",
          },
        },
      },
      organizationHooks: {
        beforeCreateInvitation: async ({ invitation, organization }) => {
          assertCampaignAcceptsInvitations(organization);
          assertCampaignRole(invitation.role);
        },
        beforeAcceptInvitation: async ({ invitation, organization }) => {
          assertCampaignAcceptsInvitations(organization);
          assertCampaignRole(invitation.role);
        },
        afterAcceptInvitation: async ({ invitation, member }) => {
          await db.insert(campaignMemberEvents).values({
            campaignId: member.organizationId,
            userId: member.userId,
            role: member.role as "dm" | "player",
            action: "joined",
            actorId: invitation.inviterId,
          });
        },
      },
      // Better Auth deliberately does not build the invitation URL, so the
      // /join/i/{invitationId} route is composed here. The invitation id is the
      // bearer secret: keep it out of logs and out of any other payload.
      sendInvitationEmail: async ({
        id,
        email,
        role,
        organization,
        invitation,
        inviter,
      }) => {
        const html = await renderCampaignInvite({
          appName: APP_NAME,
          campaignName: organization.name,
          inviterName: inviter.user.name?.trim() || "A campaign DM",
          role: role === "dm" ? "dm" : "player",
          url: `${appUrl}/join/i/${id}`,
          expiresAt: invitation.expiresAt,
          baseUrl: appUrl,
        });

        const { error } = await sendEmail({
          to: email,
          html,
          subject: `Join ${organization.name} on ${APP_NAME}`,
          from: env.FROM_EMAIL,
        });

        if (error) {
          throw new BetterAuthError(error.message, { cause: error });
        }
      },
    }),
    nextCookies(),
  ],
});

export type Session = typeof auth.$Infer.Session;
