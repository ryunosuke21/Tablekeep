import { describe, expect, it } from "vitest";

import { APP_NAME } from "@tablekeep/shared";

import { renderCampaignInvite } from "./campaign-invite";

const props = {
  appName: APP_NAME,
  campaignName: "The Ember Coast",
  inviterName: "Mara Voss",
  role: "player" as const,
  url: "https://tablekeep.test/join/i/inv_123",
  expiresAt: "2026-08-17T18:00:00.000Z",
  baseUrl: "https://tablekeep.test",
};

describe("renderCampaignInvite", () => {
  it("names the campaign, inviter, role, expiry, and action URL", async () => {
    const html = await renderCampaignInvite(props);

    expect(html).toContain("The Ember Coast");
    expect(html).toContain("Mara Voss");
    expect(html).toContain("as a player");
    expect(html).toContain("Aug 17, 2026");
    expect(html).toContain("https://tablekeep.test/join/i/inv_123");
  });

  it("labels a DM invitation with the granted role", async () => {
    const html = await renderCampaignInvite({ ...props, role: "dm" });

    expect(html).toContain("as a DM");
  });

  it("does not leak the recipient address or campaign content", async () => {
    const html = await renderCampaignInvite(props);

    expect(html).not.toContain("player@example.com");
    expect(html).not.toContain("description");
  });
});
