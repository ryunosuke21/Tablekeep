import { describe, expect, it } from "vitest";

import {
  assertCanLeaveCampaign,
  assertCanRemoveMember,
  assertCanUpdateRole,
  CampaignMembershipInvariantError,
  isLegalRoleTransition,
} from "./membership";

describe("campaign membership invariants", () => {
  it("allows the complete dm/player role transition table", () => {
    expect(isLegalRoleTransition("dm", "dm")).toBe(true);
    expect(isLegalRoleTransition("dm", "player")).toBe(true);
    expect(isLegalRoleTransition("player", "dm")).toBe(true);
    expect(isLegalRoleTransition("player", "player")).toBe(true);
  });

  it("prevents demoting the last DM", () => {
    expect(() =>
      assertCanUpdateRole({
        currentRole: "dm",
        nextRole: "player",
        activeDmCount: 1,
      }),
    ).toThrow(CampaignMembershipInvariantError);
  });

  it("prevents removing the last DM", () => {
    expect(() =>
      assertCanRemoveMember({
        actorMemberId: "member-2",
        targetMemberId: "member-1",
        targetRole: "dm",
        activeDmCount: 1,
      }),
    ).toThrow(/last active DM/i);
  });

  it("prevents the last DM from leaving", () => {
    expect(() => assertCanLeaveCampaign("dm", 1)).toThrow(
      /archive the campaign/i,
    );
  });

  it("routes self-removal to leave even when another DM exists", () => {
    expect(() =>
      assertCanRemoveMember({
        actorMemberId: "member-1",
        targetMemberId: "member-1",
        targetRole: "dm",
        activeDmCount: 2,
      }),
    ).toThrow(/Use leave/);
  });

  it("allows changes that do not orphan the campaign", () => {
    expect(() =>
      assertCanUpdateRole({
        currentRole: "dm",
        nextRole: "player",
        activeDmCount: 2,
      }),
    ).not.toThrow();
    expect(() => assertCanLeaveCampaign("player", 1)).not.toThrow();
  });
});
