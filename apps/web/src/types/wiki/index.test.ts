import { describe, expect, it } from "vitest";
import { z } from "zod";

import {
  type WikiSource,
  wikiCatalogListItemSchema,
  wikiCatalogSchema,
  wikiSpellSchema,
} from "@/types/wiki";

const source: WikiSource = {
  key: "srd-2024",
  name: "System Reference Document 5.2",
  displayName: "5e 2024 Rules",
  gameSystem: { key: "5e-2024", name: "5th Edition 2024" },
  permalink: "https://example.test/srd-2024",
  publisher: { key: "wizards-of-the-coast", name: "Wizards of the Coast" },
};

describe("Wiki response schemas", () => {
  it("applies defaults while parsing normalized details", () => {
    const spell = wikiSpellSchema.parse({
      key: "srd-2024_test-spark",
      name: "Test Spark",
      level: 1,
      school: { key: "evocation", name: "Evocation" },
      castingTime: "action",
      rangeText: "30 feet",
      duration: "instantaneous",
      targetType: "creature",
      source,
    });

    expect(spell).toMatchObject({
      description: "",
      classes: [],
      components: [],
      concentration: false,
      material: null,
      damageRoll: "",
      castingOptions: [],
    });
  });

  it("defaults an empty catalog to no entries and no sources", () => {
    expect(wikiCatalogSchema(wikiCatalogListItemSchema).parse({})).toEqual({
      items: [],
      sources: [],
    });
  });

  it("detects normalized schema drift", () => {
    expect(() =>
      wikiCatalogListItemSchema.parse({
        key: "",
        name: "Broken",
        sourceKey: "srd-2024",
      }),
    ).toThrow(z.ZodError);

    expect(() =>
      wikiSpellSchema.parse({
        key: "srd-2024_broken",
        name: "Broken",
        level: "one",
        source,
      }),
    ).toThrow(z.ZodError);

    expect(() =>
      wikiCatalogSchema(wikiCatalogListItemSchema).parse({
        items: [{ key: "srd-2024_sage", name: "Sage" }],
        sources: [source],
      }),
    ).toThrow(z.ZodError);
  });
});
