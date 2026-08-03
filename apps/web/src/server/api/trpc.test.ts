import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

const { getCampaignForMemberByIdMock } = vi.hoisted(() => ({
  getCampaignForMemberByIdMock: vi.fn(),
}));

vi.mock("@/server/db/queries/campaign", () => ({
  getCampaignForMemberById: getCampaignForMemberByIdMock,
}));

import {
  campaignDmProcedure,
  campaignMemberProcedure,
  campaignRestoreProcedure,
  createTRPCRouter,
  paginationMiddleware,
  paginationSchema,
  protectedProcedure,
  publicProcedure,
} from "@/server/api/trpc";
import { testContext } from "@/test/context";

const testRouter = createTRPCRouter({
  protectedUser: protectedProcedure.query(({ ctx }) => ctx.session.user),
  campaignRead: campaignMemberProcedure.query(({ ctx }) => ({
    campaign: ctx.campaign,
    member: ctx.member,
  })),
  campaignDmRead: campaignDmProcedure.query(({ ctx }) => ctx.campaign.status),
  campaignDmWrite: campaignDmProcedure.mutation(() => "updated"),
  restore: campaignRestoreProcedure.mutation(() => "restored"),
  pagination: publicProcedure
    .input(
      z
        .object({ marker: z.string().optional() })
        .extend(paginationSchema.shape)
        .optional(),
    )
    .use(paginationMiddleware)
    .query(({ input }) => input),
  validated: publicProcedure
    .input(z.object({ name: z.string().min(2) }))
    .query(({ input }) => input),
});

const campaignId = "00000000-0000-4000-8000-000000000001";

function sessionFor(role: "user" | "admin" = "user") {
  return {
    user: {
      id: "user-1",
      name: "Table Player",
      email: "player@example.test",
      emailVerified: true,
      createdAt: new Date("2026-01-01"),
      updatedAt: new Date("2026-01-01"),
      role,
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
    status,
    memberId: "member-1",
    memberRole,
    memberSince: new Date("2026-01-02"),
  };
}

describe("tRPC infrastructure", () => {
  beforeEach(() => {
    getCampaignForMemberByIdMock.mockReset();
  });

  it("rejects protected procedures without a user", async () => {
    const caller = testRouter.createCaller(testContext(vi.fn()));

    await expect(caller.protectedUser()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });

  it("exposes the authenticated user to protected procedures", async () => {
    const session = sessionFor();
    const caller = testRouter.createCaller(
      testContext(vi.fn(), session as never),
    );

    await expect(caller.protectedUser()).resolves.toMatchObject({
      id: "user-1",
      email: "player@example.test",
    });
  });

  it("rejects signed-out campaign access before loading membership", async () => {
    const caller = testRouter.createCaller(testContext(vi.fn()));

    await expect(caller.campaignRead({ campaignId })).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
    expect(getCampaignForMemberByIdMock).not.toHaveBeenCalled();
  });

  it("hides campaigns from authenticated nonmembers", async () => {
    getCampaignForMemberByIdMock.mockResolvedValue(null);
    const caller = testRouter.createCaller(
      testContext(vi.fn(), sessionFor() as never),
    );

    await expect(caller.campaignRead({ campaignId })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });

  it("does not grant a site admin access without campaign membership", async () => {
    getCampaignForMemberByIdMock.mockResolvedValue(null);
    const caller = testRouter.createCaller(
      testContext(vi.fn(), sessionFor("admin") as never),
    );

    await expect(caller.campaignRead({ campaignId })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });

  it("forbids players from DM procedures", async () => {
    getCampaignForMemberByIdMock.mockResolvedValue(membership("player"));
    const caller = testRouter.createCaller(
      testContext(vi.fn(), sessionFor() as never),
    );

    await expect(caller.campaignDmRead({ campaignId })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("allows DMs to use DM procedures", async () => {
    getCampaignForMemberByIdMock.mockResolvedValue(membership("dm"));
    const caller = testRouter.createCaller(
      testContext(vi.fn(), sessionFor() as never),
    );

    await expect(caller.campaignDmWrite({ campaignId })).resolves.toBe(
      "updated",
    );
    await expect(caller.restore({ campaignId })).rejects.toMatchObject({
      code: "PRECONDITION_FAILED",
    });
  });

  it("allows archived reads but blocks ordinary archived mutations", async () => {
    getCampaignForMemberByIdMock.mockResolvedValue(
      membership("dm", "archived"),
    );
    const caller = testRouter.createCaller(
      testContext(vi.fn(), sessionFor() as never),
    );

    await expect(caller.campaignDmRead({ campaignId })).resolves.toBe(
      "archived",
    );
    await expect(caller.campaignDmWrite({ campaignId })).rejects.toMatchObject({
      code: "PRECONDITION_FAILED",
    });
    await expect(caller.restore({ campaignId })).resolves.toBe("restored");
  });

  it("accepts omitted pagination input", async () => {
    const caller = testRouter.createCaller(testContext(vi.fn()));

    await expect(caller.pagination()).resolves.toEqual({});
  });

  it("forwards pagination and procedure-specific input", async () => {
    const caller = testRouter.createCaller(testContext(vi.fn()));

    await expect(
      caller.pagination({ cursor: 20, limit: 10, marker: "next" }),
    ).resolves.toEqual({ cursor: 20, limit: 10, marker: "next" });
  });

  it("keeps input validation failures as Zod-backed tRPC errors", async () => {
    const caller = testRouter.createCaller(testContext(vi.fn()));

    await expect(caller.validated({ name: "x" })).rejects.toMatchObject({
      code: "BAD_REQUEST",
      cause: expect.any(z.ZodError),
    });
  });
});
