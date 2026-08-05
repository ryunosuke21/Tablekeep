import { describe, expect, it } from "vitest";

import {
  characterCreateSchema,
  characterUpdateSchema,
  sheetClassCreateSchema,
  sheetCurrencyCreateSchema,
  sheetCurrencyUpdateSchema,
  sheetItemCreateSchema,
  sheetUpdateSchema,
} from "./character";

const campaignId = "11111111-1111-4111-8111-111111111111";
const charId = "22222222-2222-4222-8222-222222222222";
const sheetId = "33333333-3333-4333-8333-333333333333";
const currencyId = "44444444-4444-4444-8444-444444444444";

describe("character validation", () => {
  it("trims global identity fields without introducing campaign state", () => {
    expect(
      characterCreateSchema.parse({
        name: "  Lyra Vale  ",
        bio: "  Wandering cartographer  ",
      }),
    ).toEqual({
      name: "Lyra Vale",
      bio: "Wandering cartographer",
    });

    expect(characterUpdateSchema.safeParse({ charId }).success).toBe(false);
    expect("currentHp" in characterCreateSchema.shape).toBe(false);
  });

  it("accepts max HP and nullable campaign profile fields", () => {
    expect(
      sheetUpdateSchema.parse({
        campaignId,
        sheetId,
        ancestry: null,
        maxHp: 42,
      }),
    ).toMatchObject({ ancestry: null, maxHp: 42 });

    expect(
      sheetUpdateSchema.safeParse({ campaignId, sheetId, maxHp: 0 }).success,
    ).toBe(false);
    expect("currentHp" in sheetUpdateSchema.shape).toBe(false);
  });

  it("supports multiclass rows and applies custom-source defaults", () => {
    expect(
      sheetClassCreateSchema.parse({
        campaignId,
        sheetId,
        name: "  Vanguard  ",
        subclass: "  Warden  ",
        level: 3,
      }),
    ).toMatchObject({
      name: "Vanguard",
      subclass: "Warden",
      level: 3,
      source: "custom",
      sort: 0,
    });
  });

  it("uses a boolean equipped flag and bounded non-negative quantities", () => {
    expect(
      sheetItemCreateSchema.parse({
        campaignId,
        sheetId,
        name: "Rope",
      }),
    ).toMatchObject({ qty: 1, equipped: false });

    expect(
      sheetItemCreateSchema.safeParse({
        campaignId,
        sheetId,
        name: "Rope",
        qty: -1,
      }).success,
    ).toBe(false);
  });

  it("allows multiple freeform currencies while rejecting negative balances", () => {
    expect(
      sheetCurrencyCreateSchema.parse({
        campaignId,
        sheetId,
        name: "  Pennies  ",
      }),
    ).toMatchObject({ name: "Pennies", amount: 0 });

    expect(
      sheetCurrencyCreateSchema.safeParse({
        campaignId,
        sheetId,
        name: "Dollars",
        amount: -1,
      }).success,
    ).toBe(false);
    expect(
      sheetCurrencyUpdateSchema.safeParse({
        campaignId,
        sheetId,
        currencyId,
      }).success,
    ).toBe(false);
  });

  it("requires UUIDs for campaign-scoped writes", () => {
    expect(
      sheetClassCreateSchema.safeParse({
        campaignId: "not-an-id",
        charId,
        sheetId,
        name: "Vanguard",
        level: 1,
      }).success,
    ).toBe(false);
  });
});
