import { z } from "zod";

import { getSession } from "@/server/better-auth/server";
import { db } from "@/server/db";
import { getCampaignForMemberById } from "@/server/db/queries/campaign";

export type PlayAccessState =
  | { kind: "archived"; campaignName: string }
  | { kind: "profile-required" }
  | { kind: "signed-out" }
  | { kind: "unavailable" };

export type PlayRouteAccess =
  | { ok: true; role: "dm" | "player" }
  | { ok: false; state: PlayAccessState };

const campaignIdSchema = z.uuid();

export async function getPlayRouteAccess(
  campaignId: string,
): Promise<PlayRouteAccess> {
  if (!campaignIdSchema.safeParse(campaignId).success) {
    return { ok: false, state: { kind: "unavailable" } };
  }

  const session = await getSession();

  if (!session?.user) {
    return { ok: false, state: { kind: "signed-out" } };
  }

  if (!session.user.name?.trim()) {
    return { ok: false, state: { kind: "profile-required" } };
  }

  const campaign = await getCampaignForMemberById(
    db,
    campaignId,
    session.user.id,
  );

  // Keep a missing campaign and a campaign owned by somebody else
  // indistinguishable to the caller.
  if (!campaign) {
    return { ok: false, state: { kind: "unavailable" } };
  }

  if (campaign.status === "archived") {
    return {
      ok: false,
      state: { kind: "archived", campaignName: campaign.name },
    };
  }

  return { ok: true, role: campaign.memberRole };
}
