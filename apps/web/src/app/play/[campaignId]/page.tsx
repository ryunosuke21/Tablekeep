import type { Metadata } from "next";

import { DmClient } from "@/features/play/dm/dm-client";
import { PlayerClient } from "@/features/play/player/player-client";
import { getPlayRouteAccess } from "@/server/play/get-play-route-access";

import { PlayAccessState } from "./play-access-state";

export const metadata: Metadata = {
  title: "Play",
  description: "The live workspace for a Tablekeep campaign.",
};

export default async function PlayPage({
  params,
}: {
  params: Promise<{ campaignId: string }>;
}) {
  const { campaignId } = await params;
  const access = await getPlayRouteAccess(campaignId);

  if (!access.ok) {
    return <PlayAccessState state={access.state} campaignId={campaignId} />;
  }

  return access.role === "dm" ? (
    <DmClient campaignId={campaignId} />
  ) : (
    <PlayerClient campaignId={campaignId} />
  );
}
