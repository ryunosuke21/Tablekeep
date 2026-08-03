import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  campaignInvitesRouter,
  resetInviteResendThrottleForTests,
} from "@/server/api/routers/campaign/invites";
import { auth } from "@/server/better-auth";
import {
  acceptCampaignInviteCode,
  getCampaignForMemberById,
  getCampaignInviteCode,
  listPendingCampaignInvitations,
  listPendingCampaignInviteCodes,
  replaceCampaignInviteCode,
  revokeCampaignInviteCodes,
} from "@/server/db/queries/campaign";
import { testContext } from "@/test/context";

vi.mock("@/server/better-auth", () => ({
  auth: {
    api: {
      acceptInvitation: vi.fn(),
      cancelInvitation: vi.fn(),
      createInvitation: vi.fn(),
      getInvitation: vi.fn(),
    },
  },
}));

vi.mock("@/server/db/queries/campaign", () => ({
  acceptCampaignInviteCode: vi.fn(),
  getCampaignForMemberById: vi.fn(),
  getCampaignInviteCode: vi.fn(),
  listPendingCampaignInvitations: vi.fn(),
  listPendingCampaignInviteCodes: vi.fn(),
  replaceCampaignInviteCode: vi.fn(),
  revokeCampaignInviteCodes: vi.fn(),
}));

const campaignId = "11111111-1111-4111-8111-111111111111";
const session = {
  user: { id: "user-1", name: "Player", email: "player@example.com" },
  session: { id: "session-1" },
} as never;
const campaign = {
  id: campaignId,
  name: "Saturday Table",
  slug: "saturday-table",
  status: "active",
  recurrence: null,
  recurrenceStartAt: null,
  recurrenceTimeZone: null,
  recurrenceDurationMinutes: null,
  memberId: "member-1",
  memberRole: "dm",
  memberSince: new Date("2026-01-01T00:00:00Z"),
};

beforeEach(() => {
  vi.clearAllMocks();
  resetInviteResendThrottleForTests();
  vi.mocked(getCampaignForMemberById).mockResolvedValue(campaign as never);
  vi.mocked(listPendingCampaignInvitations).mockResolvedValue([]);
  vi.mocked(listPendingCampaignInviteCodes).mockResolvedValue([]);
});

describe("campaign invitation router", () => {
  it("lists only the pending invitation fields needed by the DM", async () => {
    const expiresAt = new Date("2026-09-01T00:00:00Z");
    vi.mocked(listPendingCampaignInvitations).mockResolvedValue([
      {
        id: "email-invite",
        email: "player@example.com",
        role: "player",
        expiresAt,
        createdAt: new Date("2026-08-01T00:00:00Z"),
        secretInternalField: "do-not-return",
      } as never,
    ]);
    vi.mocked(listPendingCampaignInviteCodes).mockResolvedValue([
      {
        code: "ABCDEFGHJK",
        role: "player",
        expiresAt,
        maxUses: 4,
        useCount: 1,
        createdAt: new Date("2026-08-01T00:00:00Z"),
        id: "secret-row-id",
      } as never,
    ]);

    const result = await campaignInvitesRouter
      .createCaller(testContext(vi.fn(), session))
      .list({ campaignId });

    expect(result.emailInvitations[0]).not.toHaveProperty(
      "secretInternalField",
    );
    expect(result.linkCodes[0]).not.toHaveProperty("id");
    expect(result.linkCodes[0]).toMatchObject({
      code: "ABCDEFGHJK",
      maxUses: 4,
      useCount: 1,
    });
  });

  it("atomically replaces the old role link", async () => {
    const expiresAt = new Date("2026-08-10T00:00:00Z");
    vi.mocked(replaceCampaignInviteCode).mockResolvedValue({
      code: "ABCDEFGHJK",
      expiresAt,
    } as never);

    const result = await campaignInvitesRouter
      .createCaller(testContext(vi.fn(), session))
      .createLink({
        campaignId,
        role: "player",
        expiresInDays: 7,
        maxUses: 5,
      });

    expect(replaceCampaignInviteCode).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        campaignId,
        role: "player",
        createdById: "user-1",
      }),
    );
    expect(result).toEqual({
      code: "ABCDEFGHJK",
      url: "/join/ABCDE-FGHJK",
      expiresAt,
    });
  });

  it("fails safely when link code creation cannot persist a row", async () => {
    vi.mocked(replaceCampaignInviteCode).mockResolvedValue(null);

    await expect(
      campaignInvitesRouter
        .createCaller(testContext(vi.fn(), session))
        .createLink({
          campaignId,
          role: "player",
          expiresInDays: 7,
          maxUses: 5,
        }),
    ).rejects.toMatchObject({ code: "INTERNAL_SERVER_ERROR" });
  });

  it("creates an email invitation through Better Auth", async () => {
    const expiresAt = new Date("2026-09-01T00:00:00Z");
    vi.mocked(auth.api.createInvitation).mockResolvedValue({
      id: "email-invite",
      email: "new-player@example.com",
      role: "player",
      expiresAt,
      organizationId: campaignId,
      status: "pending",
    } as never);

    await expect(
      campaignInvitesRouter
        .createCaller(testContext(vi.fn(), session))
        .createEmail({
          campaignId,
          email: "new-player@example.com",
          role: "player",
        }),
    ).resolves.toEqual({
      id: "email-invite",
      email: "new-player@example.com",
      role: "player",
      expiresAt,
    });
  });

  it("previews a code without exposing ids, email addresses, or a roster", async () => {
    vi.mocked(getCampaignInviteCode).mockResolvedValue({
      id: "invite-secret-id",
      campaignId,
      campaignName: "Saturday Table",
      campaignSlug: "saturday-table",
      campaignStatus: "active",
      inviterName: "Game Runner",
      status: "pending",
      expiresAt: new Date("2026-09-01T00:00:00Z"),
      maxUses: 5,
      useCount: 0,
      role: "player",
      code: "ABCDEFGHJK",
    } as never);
    const caller = campaignInvitesRouter.createCaller(
      testContext(vi.fn(), session),
    );

    const preview = await caller.preview({ code: "abcde-fghjk" });

    expect(preview).toMatchObject({
      kind: "link",
      campaignName: "Saturday Table",
      addressedToYou: true,
    });
    expect(preview).not.toHaveProperty("id");
    expect(preview).not.toHaveProperty("email");
    expect(preview).not.toHaveProperty("members");
    expect(getCampaignInviteCode).toHaveBeenCalledWith(
      expect.anything(),
      "ABCDEFGHJK",
    );
  });

  it("uses the atomic query boundary when accepting a link code", async () => {
    vi.mocked(getCampaignInviteCode).mockResolvedValue({
      id: "code-row",
      campaignId,
      campaignName: "Saturday Table",
      campaignSlug: "saturday-table",
      campaignStatus: "active",
      inviterName: "Game Runner",
      status: "pending",
      expiresAt: new Date("2026-09-01T00:00:00Z"),
      maxUses: null,
      useCount: 0,
      role: "player",
    } as never);
    vi.mocked(getCampaignForMemberById).mockResolvedValueOnce(null);
    vi.mocked(acceptCampaignInviteCode).mockResolvedValue({
      id: "member",
    } as never);
    const caller = campaignInvitesRouter.createCaller(
      testContext(vi.fn(), session),
    );

    await expect(caller.accept({ code: "ABCDEFGHJK" })).resolves.toEqual({
      status: "joined",
      slug: "saturday-table",
    });
    expect(acceptCampaignInviteCode).toHaveBeenCalledWith(expect.anything(), {
      inviteCodeId: "code-row",
      userId: "user-1",
      now: expect.any(Date),
    });
  });

  it("delegates email acceptance without returning the bearer invitation id", async () => {
    vi.mocked(auth.api.getInvitation).mockResolvedValue({
      id: "opaque-secret",
      organizationId: campaignId,
      organizationName: "Saturday Table",
      organizationSlug: "saturday-table",
      email: "player@example.com",
      role: "player",
      status: "pending",
      inviterId: "dm-1",
      inviterEmail: "dm@example.com",
      expiresAt: new Date("2026-09-01T00:00:00Z"),
      createdAt: new Date(),
    } as never);
    vi.mocked(auth.api.acceptInvitation).mockResolvedValue({
      invitation: { id: "opaque-secret" },
      member: { id: "member-1" },
    } as never);
    vi.mocked(getCampaignForMemberById).mockResolvedValueOnce(null);
    const caller = campaignInvitesRouter.createCaller(
      testContext(vi.fn(), session),
    );

    const result = await caller.accept({ invitationId: "opaque-secret" });

    expect(result).toEqual({ status: "joined", slug: "saturday-table" });
    expect(result).not.toHaveProperty("invitationId");
    expect(auth.api.acceptInvitation).toHaveBeenCalledWith({
      headers: expect.any(Headers),
      body: { invitationId: "opaque-secret" },
    });
  });

  it("throttles repeated email delivery for the same pending invitation", async () => {
    vi.mocked(listPendingCampaignInvitations).mockResolvedValue([
      {
        id: "opaque-secret",
        email: "player@example.com",
        role: "player",
      } as never,
    ]);
    vi.mocked(auth.api.createInvitation).mockResolvedValue({
      id: "opaque-secret",
      expiresAt: new Date("2026-09-01T00:00:00Z"),
    } as never);
    const caller = campaignInvitesRouter.createCaller(
      testContext(vi.fn(), session),
    );

    await caller.resend({ campaignId, invitationId: "opaque-secret" });
    await expect(
      caller.resend({ campaignId, invitationId: "opaque-secret" }),
    ).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" });
    expect(auth.api.createInvitation).toHaveBeenCalledOnce();
  });

  it("does not resend an invitation outside the verified campaign", async () => {
    await expect(
      campaignInvitesRouter
        .createCaller(testContext(vi.fn(), session))
        .resend({ campaignId, invitationId: "another-campaign-invite" }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(auth.api.createInvitation).not.toHaveBeenCalled();
  });

  it("revokes link codes through the campaign-scoped query", async () => {
    await expect(
      campaignInvitesRouter
        .createCaller(testContext(vi.fn(), session))
        .revoke({ campaignId, kind: "link", role: "player" }),
    ).resolves.toEqual({ revoked: true });
    expect(revokeCampaignInviteCodes).toHaveBeenCalledWith(expect.anything(), {
      campaignId,
      role: "player",
      actorId: "user-1",
    });
  });

  it("makes email revocation idempotent without forwarding an unscoped id", async () => {
    await expect(
      campaignInvitesRouter.createCaller(testContext(vi.fn(), session)).revoke({
        campaignId,
        kind: "email",
        invitationId: "missing-in-campaign",
      }),
    ).resolves.toEqual({ revoked: true });
    expect(auth.api.cancelInvitation).not.toHaveBeenCalled();
  });

  it("cancels a verified pending email invitation", async () => {
    vi.mocked(listPendingCampaignInvitations).mockResolvedValue([
      { id: "email-invite" } as never,
    ]);

    await campaignInvitesRouter
      .createCaller(testContext(vi.fn(), session))
      .revoke({ campaignId, kind: "email", invitationId: "email-invite" });

    expect(auth.api.cancelInvitation).toHaveBeenCalledWith({
      headers: expect.any(Headers),
      body: { invitationId: "email-invite" },
    });
  });

  it.each([
    ["revoked", "BAD_REQUEST"],
    ["expired", "BAD_REQUEST"],
    ["exhausted", "BAD_REQUEST"],
    ["campaign_archived", "PRECONDITION_FAILED"],
  ] as const)(
    "maps a %s link invitation to a safe public error",
    async (state, errorCode) => {
      vi.mocked(getCampaignInviteCode).mockResolvedValue({
        id: "code-row",
        campaignId,
        campaignName: "Saturday Table",
        campaignSlug: "saturday-table",
        campaignStatus: state === "campaign_archived" ? "archived" : "active",
        status: state === "revoked" ? "revoked" : "pending",
        expiresAt:
          state === "expired"
            ? new Date("2020-01-01T00:00:00Z")
            : new Date("2099-01-01T00:00:00Z"),
        maxUses: state === "exhausted" ? 1 : null,
        useCount: state === "exhausted" ? 1 : 0,
        role: "player",
      } as never);

      await expect(
        campaignInvitesRouter
          .createCaller(testContext(vi.fn(), session))
          .preview({ code: "ABCDEFGHJK" }),
      ).rejects.toMatchObject({ code: errorCode });
    },
  );

  it("rejects an unknown link code without revealing campaign data", async () => {
    vi.mocked(getCampaignInviteCode).mockResolvedValue(null);

    await expect(
      campaignInvitesRouter
        .createCaller(testContext(vi.fn(), session))
        .preview({ code: "ABCDEFGHJK" }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("returns already_member without consuming a link code", async () => {
    vi.mocked(getCampaignInviteCode).mockResolvedValue({
      id: "code-row",
      campaignId,
      campaignName: "Saturday Table",
      campaignSlug: "saturday-table",
      campaignStatus: "active",
      status: "pending",
      expiresAt: new Date("2099-01-01T00:00:00Z"),
      maxUses: null,
      useCount: 0,
      role: "player",
    } as never);

    await expect(
      campaignInvitesRouter
        .createCaller(testContext(vi.fn(), session))
        .accept({ code: "ABCDEFGHJK" }),
    ).resolves.toEqual({ status: "already_member", slug: "saturday-table" });
    expect(acceptCampaignInviteCode).not.toHaveBeenCalled();
  });

  it("returns conflict when a valid link loses an acceptance race", async () => {
    vi.mocked(getCampaignInviteCode).mockResolvedValue({
      id: "code-row",
      campaignId,
      campaignName: "Saturday Table",
      campaignSlug: "saturday-table",
      campaignStatus: "active",
      status: "pending",
      expiresAt: new Date("2099-01-01T00:00:00Z"),
      maxUses: null,
      useCount: 0,
      role: "player",
    } as never);
    vi.mocked(getCampaignForMemberById).mockResolvedValueOnce(null);
    vi.mocked(acceptCampaignInviteCode).mockResolvedValue(null);

    await expect(
      campaignInvitesRouter
        .createCaller(testContext(vi.fn(), session))
        .accept({ code: "ABCDEFGHJK" }),
    ).rejects.toMatchObject({ code: "CONFLICT" });
  });

  it("returns already_member before delegating email acceptance", async () => {
    vi.mocked(auth.api.getInvitation).mockResolvedValue({
      id: "opaque-secret",
      organizationId: campaignId,
      organizationSlug: "saturday-table",
    } as never);

    await expect(
      campaignInvitesRouter
        .createCaller(testContext(vi.fn(), session))
        .accept({ invitationId: "opaque-secret" }),
    ).resolves.toEqual({ status: "already_member", slug: "saturday-table" });
    expect(auth.api.acceptInvitation).not.toHaveBeenCalled();
  });

  it("rate-limits repeated invitation previews per user", async () => {
    vi.mocked(getCampaignInviteCode).mockResolvedValue({
      id: "code-row",
      campaignId,
      campaignName: "Saturday Table",
      campaignSlug: "saturday-table",
      campaignStatus: "active",
      status: "pending",
      expiresAt: new Date("2099-01-01T00:00:00Z"),
      maxUses: null,
      useCount: 0,
      role: "player",
    } as never);
    const caller = campaignInvitesRouter.createCaller(
      testContext(vi.fn(), session),
    );

    await Promise.all(
      Array.from({ length: 20 }, () => caller.preview({ code: "ABCDEFGHJK" })),
    );
    await expect(caller.preview({ code: "ABCDEFGHJK" })).rejects.toMatchObject({
      code: "TOO_MANY_REQUESTS",
    });
  });
});
