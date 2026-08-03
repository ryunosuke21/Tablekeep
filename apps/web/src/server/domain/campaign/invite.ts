export type InviteCodeState = {
  status: "pending" | "revoked";
  expiresAt: Date;
  maxUses: number | null;
  useCount: number;
};

export type InvitedCampaignState = {
  status: "active" | "archived";
};

export type InviteEvaluation =
  | { status: "ok" }
  | { status: "revoked" }
  | { status: "expired" }
  | { status: "exhausted" }
  | { status: "campaign_archived" };

/** The single state machine shared by link-invite preview and acceptance. */
export function evaluateInviteCode(
  inviteCode: InviteCodeState,
  campaign: InvitedCampaignState,
  context: { now: Date },
): InviteEvaluation {
  if (inviteCode.status === "revoked") return { status: "revoked" };
  if (campaign.status === "archived") return { status: "campaign_archived" };
  if (inviteCode.expiresAt.getTime() <= context.now.getTime()) {
    return { status: "expired" };
  }
  if (
    inviteCode.maxUses !== null &&
    inviteCode.useCount >= inviteCode.maxUses
  ) {
    return { status: "exhausted" };
  }
  return { status: "ok" };
}
