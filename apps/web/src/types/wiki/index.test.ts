import { describe, expect, it } from "vitest";
import { z } from "zod";

import { mapWikiPage } from "@/server/api/routers/wiki/common";
import {
  type WikiSource,
  wikiCatalogListItemSchema,
  wikiPageSchema,
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

  it("applies page defaults and validates page metadata", () => {
    const page = wikiPageSchema(wikiCatalogListItemSchema).parse({
      pageInfo: { count: 0, page: 1, limit: 20 },
    });

    expect(page).toEqual({
      items: [],
      pageInfo: {
        count: 0,
        page: 1,
        limit: 20,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    });
  });

  it("detects normalized schema drift", () => {
    expect(() =>
      wikiCatalogListItemSchema.parse({
        key: "",
        name: "Broken",
        source,
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
  });

  it("parses mapped list responses before returning them", () => {
    expect(() =>
      mapWikiPage(
        { count: 1, next: null, previous: null, results: [{}] },
        1,
        20,
        () =>
          ({
            key: "",
            name: "Broken",
            source,
          }) as never,
        wikiCatalogListItemSchema,
      ),
    ).toThrow(z.ZodError);
  });
});
