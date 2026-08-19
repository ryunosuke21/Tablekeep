import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  getCampaignForMemberByIdMock,
  getDmPlayBootstrapMock,
  getPlayerPlayBootstrapMock,
  savePrivateCampaignNoteMock,
} = vi.hoisted(() => ({
  getCampaignForMemberByIdMock: vi.fn(),
  getDmPlayBootstrapMock: vi.fn(),
  getPlayerPlayBootstrapMock: vi.fn(),
  savePrivateCampaignNoteMock: vi.fn(),
}));

vi.mock("@/server/db/queries/campaign", () => ({
  getCampaignForMemberById: getCampaignForMemberByIdMock,
}));

vi.mock("@/server/db/queries/play", () => ({
  getDmPlayBootstrap: getDmPlayBootstrapMock,
  getPlayerPlayBootstrap: getPlayerPlayBootstrapMock,
  getPrivateCampaignNote: vi.fn(),
  savePrivateCampaignNote: savePrivateCampaignNoteMock,
}));

import { testContext } from "@/test/context";

import { playRouter } from ".";

const campaignId = "00000000-0000-4000-8000-000000000001";

function session() {
  return {
    user: {
      id: "user-1",
      name: "Table Player",
      email: "player@example.test",
      emailVerified: true,
      createdAt: new Date("2026-01-01"),
      updatedAt: new Date("2026-01-01"),
      role: "user",
      banned: false,
      banReason: null,
      banExpires: null,
    },
    session: {
      id: "session-1",
      userId: "user-1",
      token: "test-token",
      expiresAt: new Date("2027-01-01"),
      createdAt: new Date("2026-01-01"),
      updatedAt: new Date("2026-01-01"),
      ipAddress: null,
      userAgent: null,
      impersonatedBy: null,
    },
  };
}

function membership(
  memberRole: "dm" | "player",
  status: "active" | "archived" = "active",
) {
  return {
    id: campaignId,
    name: "The Long Table",
    slug: "the-long-table",
    description: "A campaign",
    colors: "lilac",
    logo: null,
    bannerImage: null,
    status,
    memberId: "member-1",
    memberRole,
    memberSince: new Date("2026-01-02"),
  };
}

describe("play router", () => {
  beforeEach(() => {
    getCampaignForMemberByIdMock.mockReset();
    getDmPlayBootstrapMock.mockReset();
    getPlayerPlayBootstrapMock.mockReset();
    savePrivateCampaignNoteMock.mockReset();
  });

  it("returns the player bootstrap only to a player", async () => {
    getCampaignForMemberByIdMock.mockResolvedValue(membership("player"));
    getPlayerPlayBootstrapMock.mockResolvedValue({
      encounter: null,
      note: { content: "", updatedAt: null },
      party: [],
      sheet: null,
    });
    const caller = playRouter.createCaller(
      testContext(vi.fn(), session() as never),
    );

    await expect(
      caller.player.bootstrap({ campaignId }),
    ).resolves.toMatchObject({
      role: "player",
      campaign: { id: campaignId, name: "The Long Table" },
    });
    expect(getDmPlayBootstrapMock).not.toHaveBeenCalled();
  });

  it("returns the DM bootstrap only to a DM", async () => {
    getCampaignForMemberByIdMock.mockResolvedValue(membership("dm"));
    getDmPlayBootstrapMock.mockResolvedValue({
      encounter: null,
      note: { content: "", updatedAt: null },
      party: [],
    });
    const caller = playRouter.createCaller(
      testContext(vi.fn(), session() as never),
    );

    await expect(caller.dm.bootstrap({ campaignId })).resolves.toMatchObject({
      role: "dm",
      campaign: { id: campaignId, name: "The Long Table" },
    });
    expect(getPlayerPlayBootstrapMock).not.toHaveBeenCalled();
  });

  it("forbids players from the DM bootstrap", async () => {
    getCampaignForMemberByIdMock.mockResolvedValue(membership("player"));
    const caller = playRouter.createCaller(
      testContext(vi.fn(), session() as never),
    );

    await expect(caller.dm.bootstrap({ campaignId })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    expect(getDmPlayBootstrapMock).not.toHaveBeenCalled();
  });

  it("forbids DMs from the player bootstrap", async () => {
    getCampaignForMemberByIdMock.mockResolvedValue(membership("dm"));
    const caller = playRouter.createCaller(
      testContext(vi.fn(), session() as never),
    );

    await expect(caller.player.bootstrap({ campaignId })).rejects.toMatchObject(
      {
        code: "FORBIDDEN",
      },
    );
    expect(getPlayerPlayBootstrapMock).not.toHaveBeenCalled();
  });

  it("saves a private note for the current member", async () => {
    getCampaignForMemberByIdMock.mockResolvedValue(membership("player"));
    savePrivateCampaignNoteMock.mockResolvedValue({
      content: "Remember the bridge",
      updatedAt: new Date("2026-08-19"),
    });
    const caller = playRouter.createCaller(
      testContext(vi.fn(), session() as never),
    );

    await caller.note.update({
      campaignId,
      content: "Remember the bridge",
    });

    expect(savePrivateCampaignNoteMock).toHaveBeenCalledWith(
      expect.anything(),
      {
        campaignId,
        userId: "user-1",
        content: "Remember the bridge",
      },
    );
  });

  it("blocks note writes in archived campaigns", async () => {
    getCampaignForMemberByIdMock.mockResolvedValue(
      membership("player", "archived"),
    );
    const caller = playRouter.createCaller(
      testContext(vi.fn(), session() as never),
    );

    await expect(
      caller.note.update({ campaignId, content: "No change" }),
    ).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
    expect(savePrivateCampaignNoteMock).not.toHaveBeenCalled();
  });
});
