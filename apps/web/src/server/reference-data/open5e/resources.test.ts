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
  mapSource,
  mapSpecies,
  mapSpell,
  ruleSchema,
  speciesSchema,
  spellSchema,
} from "./resources";

const source = mapSource(open5eDocument());

describe("Open5e resource mappings", () => {
  it("maps every supported resource", () => {
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
    expect(mapRule(ruleSchema.parse(ruleFixture()), source)).toMatchObject({
      key: "srd-2024_d20-tests",
      source: { displayName: "5e 2024 Rules" },
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

  it("keeps entries from every published source", () => {
    const value = backgroundSchema.parse({
      ...backgroundFixture(),
      document: open5eDocument("a5e-ag"),
    });

    expect(mapBackground(value)).toMatchObject({
      source: { key: "a5e-ag" },
    });
  });
});
