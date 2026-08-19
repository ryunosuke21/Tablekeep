import { describe, expect, it } from "vitest";

import { issuePartyKitToken, verifyPartyKitToken } from "./partykit-token";

const secret = "a-test-secret-that-is-at-least-32-characters";
const now = Date.UTC(2026, 7, 19, 18, 0, 0);

describe("PartyKit tokens", () => {
  it("round-trips scoped connection claims", async () => {
    const token = await issuePartyKitToken(
      {
        campaignId: "campaign-1",
        role: "player",
        scope: "connect",
        sub: "user-1",
      },
      secret,
      { now },
    );

    await expect(
      verifyPartyKitToken(token, secret, { now, scope: "connect" }),
    ).resolves.toMatchObject({
      campaignId: "campaign-1",
      role: "player",
      scope: "connect",
      sub: "user-1",
    });
  });

  it("rejects tampering, expiry, and the wrong scope", async () => {
    const token = await issuePartyKitToken(
      { campaignId: "campaign-1", scope: "publish", sub: "web" },
      secret,
      { now, ttlSeconds: 30 },
    );

    await expect(
      verifyPartyKitToken(`${token}x`, secret, { now }),
    ).resolves.toBeNull();
    await expect(
      verifyPartyKitToken(token, secret, { now: now + 31_000 }),
    ).resolves.toBeNull();
    await expect(
      verifyPartyKitToken(token, secret, { now, scope: "connect" }),
    ).resolves.toBeNull();
  });
});
