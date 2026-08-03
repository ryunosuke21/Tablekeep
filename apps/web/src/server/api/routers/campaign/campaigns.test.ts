import { beforeEach, describe, expect, it, vi } from "vitest";

import { testContext } from "@/test/context";

const queries = vi.hoisted(() => ({
  archiveCampaign: vi.fn(),
  campaignSlugExists: vi.fn(),
  clearCampaignSchedule: vi.fn(),
  countActiveCampaignsForUser: vi.fn(),
  countPendingCampaignInvites: vi.fn(),
  createCampaign: vi.fn(),
  getCampaignForMemberById: vi.fn(),
  getCampaignForMemberBySlug: vi.fn(),
  listCampaignMembers: vi.fn(),
  listCampaignOccurrenceOverrides: vi.fn(),
  listCampaignsForUser: vi.fn(),
  removeCampaignOccurrenceOverride: vi.fn(),
  restoreCampaign: vi.fn(),
  setCampaignSchedule: vi.fn(),
  updateCampaign: vi.fn(),
  upsertCampaignOccurrenceOverride: vi.fn(),
}));

vi.mock("@/server/db/queries/campaign", () => queries);

import { campaignsRouter } from "./campaigns";

const campaignId = "11111111-1111-4111-8111-111111111111";
const now = new Date("2026-08-03T12:00:00.000Z");

function caller(userId = "user-1") {
  return campaignsRouter.createCaller(
    testContext(vi.fn(), {
      user: { id: userId },
      session: { id: "session-1" },
    } as never),
  );
}

function campaignMembership(role: "dm" | "player" = "dm") {
  return {
    id: campaignId,
    name: "The Long Road",
    slug: "the-long-road",
    logo: null,
    metadata: null,
    description: "A long journey.",
    colors: "sage" as const,
    status: "active" as const,
    recurrence: null,
    recurrenceStartAt: null,
    recurrenceTimeZone: null,
    recurrenceDurationMinutes: null,
    archivedAt: null,
    createdById: "user-1",
    createdAt: now,
    updatedAt: now,
    memberId: "member-1",
    memberRole: role,
    memberSince: now,
  };
}

describe("campaign core router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(now);
    queries.listCampaignOccurrenceOverrides.mockResolvedValue([]);
  });

  it("lists active campaigns by default and resolves grouped overrides without N+1 queries", async () => {
    queries.listCampaignsForUser.mockResolvedValue([
      {
        ...campaignMembership("player"),
        role: "player",
        memberCount: 2,
        members: [{ id: "user-1", name: "Mara", image: null }],
      },
    ]);
    queries.listCampaignOccurrenceOverrides.mockResolvedValue([
      {
        id: "override-1",
        campaignId,
        occurrenceStartAt: new Date("2026-08-05T18:00:00.000Z"),
        kind: "added",
        startsAt: null,
        durationMinutes: 180,
        title: null,
        notes: null,
        createdById: "user-1",
        createdAt: now,
        updatedAt: now,
      },
    ]);

    const result = await caller().list();

    expect(queries.listCampaignsForUser).toHaveBeenCalledWith(
      expect.anything(),
      "user-1",
      "active",
    );
    expect(queries.listCampaignOccurrenceOverrides).toHaveBeenCalledTimes(1);
    expect(queries.listCampaignOccurrenceOverrides).toHaveBeenCalledWith(
      expect.anything(),
      [campaignId],
    );
    expect(result.items[0]).toMatchObject({
      id: campaignId,
      description: "A long journey.",
      colors: "sage",
      members: [{ id: "user-1", name: "Mara", imageUrl: null }],
      nextSession: {
        startsAt: new Date("2026-08-05T18:00:00.000Z"),
        endsAt: new Date("2026-08-05T21:00:00.000Z"),
        timeZone: "UTC",
      },
    });
  });

  it("keeps campaign existence private and omits DM-only data for players", async () => {
    queries.getCampaignForMemberBySlug.mockResolvedValueOnce(null);
    await expect(caller().get({ slug: "private" })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });

    queries.getCampaignForMemberBySlug.mockResolvedValue(
      campaignMembership("player"),
    );
    queries.listCampaignMembers.mockResolvedValue([]);
    const result = await caller().get({ slug: "the-long-road" });

    expect(result).not.toHaveProperty("pendingInviteCount");
    expect(queries.countPendingCampaignInvites).not.toHaveBeenCalled();
  });

  it("includes pending invitation count only for a DM", async () => {
    queries.getCampaignForMemberBySlug.mockResolvedValue(campaignMembership());
    queries.listCampaignMembers.mockResolvedValue([]);
    queries.countPendingCampaignInvites.mockResolvedValue(3);

    await expect(
      caller().get({ slug: "the-long-road" }),
    ).resolves.toMatchObject({ role: "dm", pendingInviteCount: 3 });
  });

  it("enforces the active campaign cap before attempting creation", async () => {
    queries.countActiveCampaignsForUser.mockResolvedValue(10);

    await expect(
      caller().create({ name: "One Too Many" }),
    ).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
    expect(queries.createCampaign).not.toHaveBeenCalled();
  });

  it("fails closed when the atomic create loses the campaign-cap race", async () => {
    queries.countActiveCampaignsForUser.mockResolvedValue(9);
    queries.campaignSlugExists.mockResolvedValue(false);
    queries.createCampaign.mockResolvedValue(null);

    await expect(
      caller().create({ name: "Concurrent Campaign" }),
    ).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
  });

  it("keeps the slug immutable and retries a collision with a suffix", async () => {
    queries.countActiveCampaignsForUser.mockResolvedValue(0);
    queries.campaignSlugExists
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false);
    queries.createCampaign.mockImplementation(async (_db, input) => ({
      campaignId,
      slug: input.slug,
    }));

    const result = await caller().create({ name: "The Long Road" });

    expect(result.slug).toMatch(/^the-long-road-[a-z0-9]{6}$/);
    expect(queries.createCampaign).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ creatorId: "user-1", slug: result.slug }),
    );
  });

  it("retries when the slug unique index catches a concurrent collision", async () => {
    queries.countActiveCampaignsForUser.mockResolvedValue(0);
    queries.campaignSlugExists.mockResolvedValue(false);
    queries.createCampaign
      .mockRejectedValueOnce({ cause: { code: "23505" } })
      .mockImplementationOnce(async (_db, input) => ({
        campaignId,
        slug: input.slug,
      }));

    const result = await caller().create({ name: "The Long Road" });

    expect(result.slug).toMatch(/^the-long-road-[a-z0-9]{6}$/);
    expect(queries.createCampaign).toHaveBeenCalledTimes(2);
  });

  it("enforces DM and archived mutation rules while allowing restore", async () => {
    queries.getCampaignForMemberById.mockResolvedValue(
      campaignMembership("player"),
    );
    await expect(
      caller().update({ campaignId, name: "Renamed" }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });

    queries.getCampaignForMemberById.mockResolvedValue({
      ...campaignMembership("dm"),
      status: "archived",
    });
    await expect(caller().archive({ campaignId })).rejects.toMatchObject({
      code: "PRECONDITION_FAILED",
    });

    queries.restoreCampaign.mockResolvedValue({
      ...campaignMembership(),
      status: "active",
    });
    await expect(caller().restore({ campaignId })).resolves.toMatchObject({
      status: "active",
    });
  });
});
