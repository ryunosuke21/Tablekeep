import { describe, expect, it } from "vitest";

import { createCampaignOrganization } from "./server";

describe("createCampaignOrganization", () => {
  it("disables Better Auth migrations for app-owned campaign models", () => {
    const plugin = createCampaignOrganization({
      schema: {
        organization: { modelName: "campaign" },
        member: { modelName: "campaignMember" },
        invitation: { modelName: "campaignInvitation" },
      },
    });

    expect(plugin.schema.organization).toMatchObject({
      disableMigration: true,
      disableMigrations: true,
    });
    expect(plugin.schema.member).toMatchObject({
      disableMigration: true,
      disableMigrations: true,
    });
    expect(plugin.schema.invitation).toMatchObject({
      disableMigration: true,
      disableMigrations: true,
    });
    expect(plugin.schema.session).not.toHaveProperty("disableMigration");
    expect(plugin.schema.session).not.toHaveProperty("disableMigrations");
  });
});
