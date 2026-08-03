import { describe, expect, it } from "vitest";

import { evaluateInviteCode, type InviteCodeState } from "./invite";

const now = new Date("2026-08-03T12:00:00.000Z");
const validInvite: InviteCodeState = {
  status: "pending",
  expiresAt: new Date("2026-08-04T12:00:00.000Z"),
  maxUses: 2,
  useCount: 1,
};

describe("evaluateInviteCode", () => {
  it.each([
    [
      { ...validInvite, status: "revoked" as const },
      "active" as const,
      "revoked",
    ],
    [{ ...validInvite, expiresAt: now }, "active" as const, "expired"],
    [{ ...validInvite, useCount: 2 }, "active" as const, "exhausted"],
    [validInvite, "archived" as const, "campaign_archived"],
  ])("returns a precise terminal state", (invite, campaignStatus, expected) => {
    expect(
      evaluateInviteCode(invite, { status: campaignStatus }, { now }).status,
    ).toBe(expected);
  });

  it("accepts an active, unexpired invite with capacity", () => {
    expect(
      evaluateInviteCode(validInvite, { status: "active" }, { now }),
    ).toEqual({ status: "ok" });
  });

  it("allows an unlimited invite", () => {
    expect(
      evaluateInviteCode(
        { ...validInvite, maxUses: null, useCount: Number.MAX_SAFE_INTEGER },
        { status: "active" },
        { now },
      ),
    ).toEqual({ status: "ok" });
  });
});
