import { beforeEach, describe, expect, it, vi } from "vitest";

import { testContext } from "@/test/context";

const characterQueries = vi.hoisted(() => ({
  createCharacter: vi.fn(),
  createCharacterSheet: vi.fn(),
  createSheetBackground: vi.fn(),
  createSheetClass: vi.fn(),
  createSheetCondition: vi.fn(),
  createSheetCurrency: vi.fn(),
  createSheetItem: vi.fn(),
  deleteCharacter: vi.fn(),
  getCharacterForOwnerBySlug: vi.fn(),
  getCharacterForSheetCreation: vi.fn(),
  getCharacterSheet: vi.fn(),
  getSheetAccess: vi.fn(),
  listCharactersForOwner: vi.fn(),
  listCharacterSheets: vi.fn(),
  reactivateCharacterSheet: vi.fn(),
  removeSheetBackground: vi.fn(),
  removeSheetClass: vi.fn(),
  removeSheetCondition: vi.fn(),
  removeSheetCurrency: vi.fn(),
  removeSheetItem: vi.fn(),
  restoreCharacter: vi.fn(),
  restoreSheetCurrency: vi.fn(),
  restoreSheetItem: vi.fn(),
  retireCharacterSheet: vi.fn(),
  updateCharacter: vi.fn(),
  updateCharacterSheet: vi.fn(),
  updateSheetBackground: vi.fn(),
  updateSheetClass: vi.fn(),
  updateSheetCurrency: vi.fn(),
  updateSheetItem: vi.fn(),
}));

const campaignQueries = vi.hoisted(() => ({
  getCampaignForMemberById: vi.fn(),
}));

vi.mock("@/server/db/queries/character", () => characterQueries);
vi.mock("@/server/db/queries/campaign", () => campaignQueries);

import { characterRouter } from "./character";

const campaignId = "11111111-1111-4111-8111-111111111111";
const charId = "22222222-2222-4222-8222-222222222222";
const sheetId = "33333333-3333-4333-8333-333333333333";
const rowId = "44444444-4444-4444-8444-444444444444";
const now = new Date("2026-08-05T12:00:00.000Z");

function caller(userId: string | null = "player-1") {
  return characterRouter.createCaller(
    testContext(
      vi.fn(),
      userId
        ? ({
            user: { id: userId },
            session: { id: `session-${userId}` },
          } as never)
        : null,
    ),
  );
}

function membership(
  role: "dm" | "player" = "player",
  status: "active" | "archived" = "active",
) {
  return {
    id: campaignId,
    name: "The Long Road",
    slug: "the-long-road",
    logo: null,
    metadata: null,
    description: null,
    colors: "sage" as const,
    status,
    recurrence: null,
    recurrenceStartAt: null,
    recurrenceTimeZone: null,
    recurrenceDurationMinutes: null,
    archivedAt: status === "archived" ? now : null,
    createdById: "dm-1",
    createdAt: now,
    updatedAt: now,
    memberId: `member-${role}`,
    memberRole: role,
    memberSince: now,
  };
}

describe("character router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    campaignQueries.getCampaignForMemberById.mockResolvedValue(
      membership("player"),
    );
    characterQueries.getSheetAccess.mockResolvedValue({
      ownerId: "player-1",
      retiredAt: null,
      deletedAt: null,
    });
  });

  it("protects the global character API and scopes identity reads to the session owner", async () => {
    await expect(caller(null).list()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });

    characterQueries.listCharactersForOwner.mockResolvedValue([]);
    await expect(caller().list()).resolves.toEqual({ items: [], total: 0 });
    expect(characterQueries.listCharactersForOwner).toHaveBeenCalledWith(
      expect.anything(),
      "player-1",
      "active",
    );

    characterQueries.getCharacterForOwnerBySlug.mockResolvedValue(null);
    await expect(
      caller().get({ slug: "someone-elses-character" }),
    ).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });

  it("lists deleted or all identities only when explicitly requested", async () => {
    characterQueries.listCharactersForOwner.mockResolvedValue([]);

    await caller().list({ status: "deleted" });
    expect(characterQueries.listCharactersForOwner).toHaveBeenLastCalledWith(
      expect.anything(),
      "player-1",
      "deleted",
    );

    await caller().list({ status: "all" });
    expect(characterQueries.listCharactersForOwner).toHaveBeenLastCalledWith(
      expect.anything(),
      "player-1",
      "all",
    );

    await expect(
      caller().list({ status: "retired" } as never),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("derives the owner for global create, update, delete, and restore", async () => {
    characterQueries.createCharacter.mockResolvedValue({ id: charId });
    await caller().create({ name: "  Mara  ", bio: null });
    expect(characterQueries.createCharacter).toHaveBeenCalledWith(
      expect.anything(),
      { name: "Mara", bio: null, ownerId: "player-1" },
    );

    characterQueries.updateCharacter.mockResolvedValue({ id: charId });
    await caller().update({ charId, name: "Mara Vale" });
    expect(characterQueries.updateCharacter).toHaveBeenCalledWith(
      expect.anything(),
      "player-1",
      charId,
      { name: "Mara Vale" },
    );

    characterQueries.deleteCharacter.mockResolvedValue({ id: charId });
    await caller().delete({ charId });
    expect(characterQueries.deleteCharacter).toHaveBeenCalledWith(
      expect.anything(),
      "player-1",
      charId,
    );

    characterQueries.restoreCharacter.mockResolvedValue({ id: charId });
    await caller().restore({ charId });
    expect(characterQueries.restoreCharacter).toHaveBeenCalledWith(
      expect.anything(),
      "player-1",
      charId,
    );
  });

  it("returns only the player's sheets while a DM can list the campaign party", async () => {
    characterQueries.listCharacterSheets.mockResolvedValue([]);

    await caller().sheet.list({ campaignId });
    expect(characterQueries.listCharacterSheets).toHaveBeenLastCalledWith(
      expect.anything(),
      campaignId,
      "player-1",
    );

    campaignQueries.getCampaignForMemberById.mockResolvedValue(
      membership("dm"),
    );
    await caller("dm-1").sheet.list({ campaignId });
    expect(characterQueries.listCharacterSheets).toHaveBeenLastCalledWith(
      expect.anything(),
      campaignId,
      undefined,
    );
  });

  it("does not disclose campaign or sheet data to nonmembers and other players", async () => {
    campaignQueries.getCampaignForMemberById.mockResolvedValueOnce(null);
    await expect(
      caller("outsider").sheet.get({ campaignId, sheetId }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(characterQueries.getSheetAccess).not.toHaveBeenCalled();

    characterQueries.getSheetAccess.mockResolvedValue({
      ownerId: "player-2",
      retiredAt: null,
      deletedAt: null,
    });
    await expect(
      caller().sheet.get({ campaignId, sheetId }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(characterQueries.getCharacterSheet).not.toHaveBeenCalled();
  });

  it("lets a DM co-edit a player's sheet and supplies the authenticated actor", async () => {
    campaignQueries.getCampaignForMemberById.mockResolvedValue(
      membership("dm"),
    );
    characterQueries.getSheetAccess.mockResolvedValue({
      ownerId: "player-1",
      retiredAt: null,
      deletedAt: null,
    });
    characterQueries.updateCharacterSheet.mockResolvedValue({ id: sheetId });

    await caller("dm-1").sheet.update({ campaignId, sheetId, maxHp: 28 });

    expect(characterQueries.updateCharacterSheet).toHaveBeenCalledWith(
      expect.anything(),
      campaignId,
      sheetId,
      { maxHp: 28 },
      "dm-1",
    );
  });

  it("denies every sheet write while the campaign is archived", async () => {
    campaignQueries.getCampaignForMemberById.mockResolvedValue(
      membership("dm", "archived"),
    );

    await expect(
      caller("dm-1").sheet.retire({ campaignId, sheetId }),
    ).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
    expect(characterQueries.retireCharacterSheet).not.toHaveBeenCalled();

    characterQueries.getCharacterForSheetCreation.mockResolvedValue({
      ownerId: "player-1",
    });
    await expect(
      caller("dm-1").sheet.create({ campaignId, charId }),
    ).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
    expect(characterQueries.createCharacterSheet).not.toHaveBeenCalled();
  });

  it("attaches a global character only when its owner is the caller", async () => {
    characterQueries.getCharacterForSheetCreation.mockResolvedValue({
      ownerId: "player-2",
    });
    await expect(
      caller().sheet.create({ campaignId, charId }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });

    campaignQueries.getCampaignForMemberById.mockResolvedValue(
      membership("dm"),
    );
    await expect(
      caller("dm-1").sheet.create({ campaignId, charId }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(characterQueries.createCharacterSheet).not.toHaveBeenCalled();

    campaignQueries.getCampaignForMemberById.mockResolvedValue(
      membership("player"),
    );
    characterQueries.getCharacterForSheetCreation.mockResolvedValue({
      ownerId: "player-1",
    });
    characterQueries.createCharacterSheet.mockResolvedValue({ id: sheetId });
    await caller().sheet.create({ campaignId, charId });
    expect(characterQueries.createCharacterSheet).toHaveBeenCalledWith(
      expect.anything(),
      {
        campaignId,
        charId,
        ownerId: "player-1",
        actorId: "player-1",
      },
    );
  });

  it("keeps retired and deleted sheets read-only and only reactivates a retired live character", async () => {
    characterQueries.getCharacterSheet.mockResolvedValue({ id: sheetId });
    characterQueries.getSheetAccess.mockResolvedValue({
      ownerId: "player-1",
      retiredAt: now,
      deletedAt: null,
    });

    await expect(
      caller().sheet.get({ campaignId, sheetId }),
    ).resolves.toMatchObject({ id: sheetId });
    await expect(
      caller().sheet.item.create({ campaignId, sheetId, name: "Rope" }),
    ).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });

    characterQueries.reactivateCharacterSheet.mockResolvedValue({
      id: sheetId,
    });
    await expect(
      caller().sheet.reactivate({ campaignId, sheetId }),
    ).resolves.toMatchObject({ id: sheetId });

    characterQueries.getSheetAccess.mockResolvedValue({
      ownerId: "player-1",
      retiredAt: now,
      deletedAt: now,
    });
    await expect(
      caller().sheet.reactivate({ campaignId, sheetId }),
    ).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
  });

  it("reports cap and active-sheet conflicts as failed preconditions", async () => {
    characterQueries.createCharacter.mockResolvedValue(null);
    await expect(caller().create({ name: "Too Many" })).rejects.toMatchObject({
      code: "PRECONDITION_FAILED",
    });

    characterQueries.getCharacterForSheetCreation.mockResolvedValue({
      ownerId: "player-1",
    });
    characterQueries.createCharacterSheet.mockResolvedValue(null);
    await expect(
      caller().sheet.create({ campaignId, charId }),
    ).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });

    characterQueries.createSheetClass.mockResolvedValue(null);
    await expect(
      caller().sheet.class.create({
        campaignId,
        sheetId,
        name: "Fighter",
        level: 1,
      }),
    ).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
  });

  it("routes nested item and currency changes through sheet-scoped mutations", async () => {
    characterQueries.createSheetItem.mockResolvedValue({ id: rowId });
    await caller().sheet.item.create({
      campaignId,
      sheetId,
      name: "Rope",
      qty: 2,
      equipped: false,
      notes: null,
    });
    expect(characterQueries.createSheetItem).toHaveBeenCalledWith(
      expect.anything(),
      {
        sheetId,
        name: "Rope",
        qty: 2,
        equipped: false,
        notes: null,
        actorId: "player-1",
      },
    );

    characterQueries.updateSheetCurrency.mockResolvedValue({ id: rowId });
    await caller().sheet.currency.update({
      campaignId,
      sheetId,
      currencyId: rowId,
      amount: 125,
    });
    expect(characterQueries.updateSheetCurrency).toHaveBeenCalledWith(
      expect.anything(),
      sheetId,
      rowId,
      { amount: 125 },
      "player-1",
    );

    characterQueries.restoreSheetCurrency.mockResolvedValue({ id: rowId });
    await caller().sheet.currency.restore({
      campaignId,
      sheetId,
      currencyId: rowId,
    });
    expect(characterQueries.restoreSheetCurrency).toHaveBeenCalledWith(
      expect.anything(),
      sheetId,
      rowId,
      "player-1",
    );
  });

  it("maps a nested row mismatch to NOT_FOUND", async () => {
    characterQueries.updateSheetClass.mockResolvedValue(null);
    await expect(
      caller().sheet.class.update({
        campaignId,
        sheetId,
        classId: rowId,
        level: 3,
      }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("resolves sheet access with the requested sheet id for the owner, the DM, and nested writes", async () => {
    // Regression: the access middleware once ran before `sheetIdSchema` was
    // parsed, so it looked up `undefined` and denied every real sheet.
    characterQueries.getCharacterSheet.mockResolvedValue({ id: sheetId });

    await expect(
      caller().sheet.get({ campaignId, sheetId }),
    ).resolves.toMatchObject({ id: sheetId });
    expect(characterQueries.getSheetAccess).toHaveBeenLastCalledWith(
      expect.anything(),
      campaignId,
      sheetId,
    );
    expect(characterQueries.getCharacterSheet).toHaveBeenLastCalledWith(
      expect.anything(),
      campaignId,
      sheetId,
    );

    campaignQueries.getCampaignForMemberById.mockResolvedValue(
      membership("dm"),
    );
    await expect(
      caller("dm-1").sheet.get({ campaignId, sheetId }),
    ).resolves.toMatchObject({ id: sheetId });
    expect(characterQueries.getSheetAccess).toHaveBeenLastCalledWith(
      expect.anything(),
      campaignId,
      sheetId,
    );

    characterQueries.createSheetItem.mockResolvedValue({ id: rowId });
    await caller("dm-1").sheet.item.create({
      campaignId,
      sheetId,
      name: "Rope",
    });
    expect(characterQueries.getSheetAccess).toHaveBeenLastCalledWith(
      expect.anything(),
      campaignId,
      sheetId,
    );
    expect(characterQueries.createSheetItem).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ sheetId, name: "Rope", actorId: "dm-1" }),
    );
  });

  it("rejects current HP because it is not persistent sheet state", async () => {
    await expect(
      caller().sheet.update({
        campaignId,
        sheetId,
        currentHp: 12,
      } as never),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(characterQueries.updateCharacterSheet).not.toHaveBeenCalled();
  });
});
