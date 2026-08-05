import { describe, expect, it } from "vitest";

import {
  backgroundFixture,
  classFixture,
  creatureFixture,
  featFixture,
  itemFixture,
  magicItemFixture,
  open5eDocument,
  ruleFixture,
  speciesFixture,
  spellFixture,
} from "@/test/fixtures/open5e";

import {
  backgroundSchema,
  classSchema,
  creatureSchema,
  featSchema,
  itemSchema,
  magicItemSchema,
  mapBackground,
  mapClass,
  mapCreature,
  mapFeat,
  mapItem,
  mapMagicItem,
  mapRule,
  mapSpecies,
  mapSpell,
  ruleSchema,
  speciesSchema,
  spellSchema,
} from "./resources";

describe("Open5e resource mappings", () => {
  it("maps every supported 2024 resource", () => {
    expect(
      mapBackground(backgroundSchema.parse(backgroundFixture())),
    ).toMatchObject({
      key: "srd-2024_sage",
      benefits: [{ type: "ability_scores" }],
    });
    expect(mapFeat(featSchema.parse(featFixture()))).toMatchObject({
      key: "srd-2024_alert",
      hasPrerequisite: false,
    });
    expect(mapSpecies(speciesSchema.parse(speciesFixture()))).toMatchObject({
      key: "srd-2024_human",
      isSubspecies: false,
      traits: [{ type: null }],
    });
    expect(mapRule(ruleSchema.parse(ruleFixture()))).toMatchObject({
      key: "srd-2024_d20-tests",
      sourceKey: "srd-2024",
    });
    expect(mapClass(classSchema.parse(classFixture()))).toMatchObject({
      key: "srd-2024_fighter",
      features: [{ tableData: [{ value: "2" }] }],
    });
    expect(mapItem(itemSchema.parse(itemFixture()))).toMatchObject({
      key: "srd-2024_rope",
      weight: "10.00",
    });
    expect(
      mapMagicItem(magicItemSchema.parse(magicItemFixture())),
    ).toMatchObject({ key: "srd-2024_magic-rope", requiresAttunement: true });
    expect(mapCreature(creatureSchema.parse(creatureFixture()))).toMatchObject({
      key: "srd-2024_test-creature",
      challengeRating: 1,
    });
    expect(mapSpell(spellSchema.parse(spellFixture()))).toMatchObject({
      key: "srd-2024_test-spark",
      components: ["V", "S"],
    });
  });

  it("rejects entities from another source", () => {
    const value = backgroundSchema.parse({
      ...backgroundFixture(),
      document: open5eDocument("a5e"),
    });
    expect(() => mapBackground(value)).toThrowError(
      expect.objectContaining({ code: "BAD_GATEWAY" }),
    );
    expect(() =>
      mapRule(ruleSchema.parse({ ...ruleFixture(), document: "wotc-srd" })),
    ).toThrowError(expect.objectContaining({ code: "BAD_GATEWAY" }));
  });
});
