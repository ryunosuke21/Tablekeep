import { beforeEach, describe, expect, it, vi } from "vitest";

import { testContext } from "@/test/context";

const queries = vi.hoisted(() => ({
  getCampaignForMemberById: vi.fn(),
  leaveCampaign: vi.fn(),
  listCampaignMemberEvents: vi.fn(),
  listCampaignMembers: vi.fn(),
  removeCampaignMember: vi.fn(),
  updateCampaignMemberRole: vi.fn(),
}));

vi.mock("@/server/db/queries/campaign", () => queries);

import { membersRouter } from "./members";

const campaignId = "11111111-1111-4111-8111-111111111111";
const joinedAt = new Date("2026-08-01T12:00:00.000Z");

function caller(userId = "user-1") {
  return membersRouter.createCaller(
    testContext(vi.fn(), {
      user: { id: userId },
      session: { id: "session-1" },
    } as never),
  );
}

function campaignMembership(role: "dm" | "player", memberId = "member-1") {
  return {
    id: campaignId,
    name: "The Long Road",
    slug: "the-long-road",
    status: "active" as const,
    memberId,
    memberRole: role,
    memberSince: joinedAt,
  };
}

const dm = {
  id: "member-1",
  userId: "user-1",
  role: "dm" as const,
  joinedAt,
  name: "Mara",
  image: null,
};
const player = {
  id: "member-2",
  userId: "user-2",
  role: "player" as const,
  joinedAt,
  name: "Jon",
  image: null,
};

describe("campaign members router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queries.listCampaignMembers.mockResolvedValue([dm, player]);
  });

  it("returns NOT_FOUND for a non-member without disclosing campaign existence", async () => {
    queries.getCampaignForMemberById.mockResolvedValue(null);

    await expect(caller().list({ campaignId })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
    expect(queries.listCampaignMembers).not.toHaveBeenCalled();
  });

  it("omits removal history entirely for players", async () => {
    queries.getCampaignForMemberById.mockResolvedValue(
      campaignMembership("player", "member-2"),
    );

    const result = await caller("user-2").list({ campaignId });

    expect(result.members).toEqual([dm, player]);
    expect(result).not.toHaveProperty("history");
    expect(queries.listCampaignMemberEvents).not.toHaveBeenCalled();
  });

  it("includes event history for DMs", async () => {
    queries.getCampaignForMemberById.mockResolvedValue(
      campaignMembership("dm"),
    );
    queries.listCampaignMemberEvents.mockResolvedValue([
      { id: "event-1", action: "removed" },
    ]);

    await expect(caller().list({ campaignId })).resolves.toMatchObject({
      history: [{ id: "event-1", action: "removed" }],
    });
  });

  it("prevents demoting the last DM before the guarded write", async () => {
    queries.getCampaignForMemberById.mockResolvedValue(
      campaignMembership("dm"),
    );
    queries.listCampaignMembers.mockResolvedValue([dm]);

    await expect(
      caller().updateRole({
        campaignId,
        memberId: dm.id,
        role: "player",
      }),
    ).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
    expect(queries.updateCampaignMemberRole).not.toHaveBeenCalled();
  });

  it("routes self-removal to leave", async () => {
    queries.getCampaignForMemberById.mockResolvedValue(
      campaignMembership("dm"),
    );

    await expect(
      caller().remove({ campaignId, memberId: dm.id }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(queries.removeCampaignMember).not.toHaveBeenCalled();
  });

  it("prevents the last DM from leaving", async () => {
    queries.getCampaignForMemberById.mockResolvedValue(
      campaignMembership("dm"),
    );
    queries.listCampaignMembers.mockResolvedValue([dm]);

    await expect(caller().leave({ campaignId })).rejects.toMatchObject({
      code: "PRECONDITION_FAILED",
      message: expect.stringMatching(/Promote another DM or archive/i),
    });
    expect(queries.leaveCampaign).not.toHaveBeenCalled();
  });

  it("keeps archived campaign membership read-only", async () => {
    queries.getCampaignForMemberById.mockResolvedValue({
      ...campaignMembership("player", "member-2"),
      status: "archived",
    });

    await expect(caller("user-2").leave({ campaignId })).rejects.toMatchObject({
      code: "PRECONDITION_FAILED",
    });
    expect(queries.leaveCampaign).not.toHaveBeenCalled();
  });

  it("uses guarded query writes and records the acting user", async () => {
    queries.getCampaignForMemberById.mockResolvedValue(
      campaignMembership("dm"),
    );
    queries.removeCampaignMember.mockResolvedValue(player);

    await expect(
      caller().remove({ campaignId, memberId: player.id }),
    ).resolves.toEqual({ success: true });
    expect(queries.removeCampaignMember).toHaveBeenCalledWith(
      expect.anything(),
      { campaignId, memberId: player.id, actorId: "user-1" },
    );
  });
});
