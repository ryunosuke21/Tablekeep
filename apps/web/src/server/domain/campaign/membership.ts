export const CAMPAIGN_ROLES = ["dm", "player"] as const;
export type CampaignRole = (typeof CAMPAIGN_ROLES)[number];
export type LastDmAction = "demote" | "remove" | "leave";

export class CampaignMembershipInvariantError extends Error {
  constructor(
    public readonly code:
      | "LAST_DM"
      | "SELF_REMOVAL"
      | "INVALID_ROLE_TRANSITION",
    message: string,
  ) {
    super(message);
    this.name = "CampaignMembershipInvariantError";
  }
}

export function isCampaignRole(value: string): value is CampaignRole {
  return CAMPAIGN_ROLES.some((role) => role === value);
}

export function isLegalRoleTransition(
  from: CampaignRole,
  to: CampaignRole,
): boolean {
  return (
    from === to ||
    (from === "dm" && to === "player") ||
    (from === "player" && to === "dm")
  );
}

export function assertLegalRoleTransition(
  from: string,
  to: string,
): asserts to is CampaignRole {
  if (
    !isCampaignRole(from) ||
    !isCampaignRole(to) ||
    !isLegalRoleTransition(from, to)
  ) {
    throw new CampaignMembershipInvariantError(
      "INVALID_ROLE_TRANSITION",
      "Campaign roles must be either dm or player.",
    );
  }
}

export function assertNotLastDm(input: {
  memberRole: CampaignRole;
  activeDmCount: number;
  action: LastDmAction;
}): void {
  if (input.memberRole !== "dm" || input.activeDmCount > 1) return;

  const guidance =
    input.action === "leave"
      ? "Promote another DM or archive the campaign before leaving."
      : "Promote another DM before changing this membership.";
  throw new CampaignMembershipInvariantError(
    "LAST_DM",
    `The last active DM cannot ${input.action}. ${guidance}`,
  );
}

export function assertCanUpdateRole(input: {
  currentRole: CampaignRole;
  nextRole: CampaignRole;
  activeDmCount: number;
}): void {
  assertLegalRoleTransition(input.currentRole, input.nextRole);
  if (input.currentRole === "dm" && input.nextRole !== "dm") {
    assertNotLastDm({
      memberRole: input.currentRole,
      activeDmCount: input.activeDmCount,
      action: "demote",
    });
  }
}

export function assertCanRemoveMember(input: {
  actorMemberId: string;
  targetMemberId: string;
  targetRole: CampaignRole;
  activeDmCount: number;
}): void {
  if (input.actorMemberId === input.targetMemberId) {
    throw new CampaignMembershipInvariantError(
      "SELF_REMOVAL",
      "Use leave when removing your own campaign membership.",
    );
  }
  assertNotLastDm({
    memberRole: input.targetRole,
    activeDmCount: input.activeDmCount,
    action: "remove",
  });
}

export function assertCanLeaveCampaign(
  role: CampaignRole,
  activeDmCount: number,
): void {
  assertNotLastDm({ memberRole: role, activeDmCount, action: "leave" });
}
