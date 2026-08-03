import { clientSideHasPermission } from "better-auth/client/plugins";
import { createAccessControl } from "better-auth/plugins/access";

// Better Auth's organization endpoints use these resource names internally.
// Keep them aligned with the stock plugin rather than campaign-facing labels.
export const campaignStatements = {
  organization: ["update", "delete"],
  member: ["create", "update", "delete"],
  invitation: ["create", "cancel"],
} as const;

export const campaignAccess = createAccessControl(campaignStatements);

export const dm = campaignAccess.newRole({
  organization: ["update", "delete"],
  member: ["create", "update", "delete"],
  invitation: ["create", "cancel"],
});

export const player = campaignAccess.newRole({
  organization: [],
  member: [],
  invitation: [],
});

export const campaignRoles = { dm, player };

export type CampaignPermission = {
  [Resource in keyof typeof campaignStatements]?: Array<
    (typeof campaignStatements)[Resource][number]
  >;
};

/** Evaluate campaign permissions without a session or database lookup. */
export function campaignMemberCan(
  role: string,
  permissions: CampaignPermission,
) {
  return clientSideHasPermission({
    role,
    options: { ac: campaignAccess, roles: campaignRoles },
    permissions,
  });
}
