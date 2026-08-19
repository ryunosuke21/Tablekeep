import PartySocket from "partysocket";

import { env as clientEnv } from "@/env/client";
import { env } from "@/env/server";
import { issuePartyKitToken } from "@/lib/partykit-token";

export type EncounterChangedEvent = {
  campaignId: string;
  encounterId: string;
  revision: number;
  type: "encounter.changed";
};

export async function publishEncounterChanged(
  event: Omit<EncounterChangedEvent, "type">,
) {
  if (!env.PARTYKIT_SECRET) return false;

  try {
    const token = await issuePartyKitToken(
      { campaignId: event.campaignId, scope: "publish", sub: "web" },
      env.PARTYKIT_SECRET,
      { ttlSeconds: 30 },
    );
    const response = await PartySocket.fetch(
      {
        host: clientEnv.NEXT_PUBLIC_PARTYKIT_HOST,
        room: event.campaignId,
      },
      {
        body: JSON.stringify({ ...event, type: "encounter.changed" }),
        headers: {
          authorization: `Bearer ${token}`,
          "content-type": "application/json",
        },
        method: "POST",
      },
    );
    if (!response.ok) {
      console.warn(`PartyKit publish failed with status ${response.status}`);
      return false;
    }
    return true;
  } catch (error) {
    console.warn("PartyKit publish failed", error);
    return false;
  }
}
