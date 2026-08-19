import { beforeEach, describe, expect, it, vi } from "vitest";

const { getCampaignForMemberByIdMock, getSessionMock } = vi.hoisted(() => ({
  getCampaignForMemberByIdMock: vi.fn(),
  getSessionMock: vi.fn(),
}));

vi.mock("@/server/better-auth/server", () => ({
  getSession: getSessionMock,
}));

vi.mock("@/server/db", () => ({
  db: { marker: "test-db" },
}));

vi.mock("@/server/db/queries/campaign", () => ({
  getCampaignForMemberById: getCampaignForMemberByIdMock,
}));

import { getPlayRouteAccess } from "./get-play-route-access";

const campaignId = "00000000-0000-4000-8000-000000000001";

function session(name: string | null = "Mara Voss") {
  return {
    user: {
      id: "user-1",
      name,
    },
  };
}

function campaign(
  role: "dm" | "player",
  status: "active" | "archived" = "active",
) {
  return {
    id: campaignId,
    name: "The Long Table",
    status,
    memberRole: role,
  };
}

describe("getPlayRouteAccess", () => {
  beforeEach(() => {
    getCampaignForMemberByIdMock.mockReset();
    getSessionMock.mockReset();
  });

  it("hides malformed campaign IDs without loading the session", async () => {
    await expect(getPlayRouteAccess("not-a-uuid")).resolves.toEqual({
      ok: false,
      state: { kind: "unavailable" },
    });
    expect(getSessionMock).not.toHaveBeenCalled();
  });

  it("returns an inline signed-out state", async () => {
    getSessionMock.mockResolvedValue(null);

    await expect(getPlayRouteAccess(campaignId)).resolves.toEqual({
      ok: false,
      state: { kind: "signed-out" },
    });
    expect(getCampaignForMemberByIdMock).not.toHaveBeenCalled();
  });

  it("returns an inline profile state before loading membership", async () => {
    getSessionMock.mockResolvedValue(session("   "));

    await expect(getPlayRouteAccess(campaignId)).resolves.toEqual({
      ok: false,
      state: { kind: "profile-required" },
    });
    expect(getCampaignForMemberByIdMock).not.toHaveBeenCalled();
  });

  it("does not distinguish a nonmember from a missing campaign", async () => {
    getSessionMock.mockResolvedValue(session());
    getCampaignForMemberByIdMock.mockResolvedValue(null);

    await expect(getPlayRouteAccess(campaignId)).resolves.toEqual({
      ok: false,
      state: { kind: "unavailable" },
    });
  });

  it("returns an archived state only after membership succeeds", async () => {
    getSessionMock.mockResolvedValue(session());
    getCampaignForMemberByIdMock.mockResolvedValue(
      campaign("player", "archived"),
    );

    await expect(getPlayRouteAccess(campaignId)).resolves.toEqual({
      ok: false,
      state: { kind: "archived", campaignName: "The Long Table" },
    });
  });

  it.each(["player", "dm"] as const)(
    "returns the %s client role for an active member",
    async (role) => {
      getSessionMock.mockResolvedValue(session());
      getCampaignForMemberByIdMock.mockResolvedValue(campaign(role));

      await expect(getPlayRouteAccess(campaignId)).resolves.toEqual({
        ok: true,
        role,
      });
      expect(getCampaignForMemberByIdMock).toHaveBeenCalledWith(
        { marker: "test-db" },
        campaignId,
        "user-1",
      );
    },
  );
});
