import { describe, expect, it } from "vitest";

import { campaignMemberCan, campaignStatements } from "./access";

describe("campaignMemberCan", () => {
  const permissionMatrix = Object.entries(campaignStatements).flatMap(
    ([resource, actions]) =>
      actions.map((action) => ({
        permissions: { [resource]: [action] },
        resource,
        action,
      })),
  );

  it.each(permissionMatrix)(
    "allows a DM to $action an $resource",
    ({ permissions }) => {
      expect(campaignMemberCan("dm", permissions)).toBe(true);
    },
  );

  it.each(permissionMatrix)(
    "denies a player permission to $action an $resource",
    ({ permissions }) => {
      expect(campaignMemberCan("player", permissions)).toBe(false);
    },
  );

  it("denies roles outside the campaign role model", () => {
    expect(campaignMemberCan("owner", { organization: ["update"] })).toBe(
      false,
    );
  });
});
