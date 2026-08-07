import { describe, expect, it } from "vitest";

import { wikiImageFallback, wikiImageSlug, wikiImageSrc } from "./images";

describe("Wiki entry artwork", () => {
  it("slugs an entry name into a file name someone can type", () => {
    expect(wikiImageSlug("Aboleth")).toBe("aboleth");
    expect(wikiImageSlug("Adult Black Dragon")).toBe("adult-black-dragon");
    expect(wikiImageSlug("Adamantine Armor (Breastplate)")).toBe(
      "adamantine-armor-breastplate",
    );
    expect(wikiImageSlug("Mage’s Faithful Hound")).toBe("mages-faithful-hound");
    expect(wikiImageSlug("Duergar Xarrorn")).toBe("duergar-xarrorn");
    expect(wikiImageSlug("Anhkheg")).toBe("anhkheg");
  });

  it("ignores accents and stray punctuation so one file matches", () => {
    expect(wikiImageSlug("Étincelle")).toBe("etincelle");
    expect(wikiImageSlug("  Half-Elf  ")).toBe("half-elf");
    expect(wikiImageSlug("Aboleth, Nihilith")).toBe("aboleth-nihilith");
  });

  it("points every source book's copy of an entry at one file", () => {
    expect(wikiImageSrc("creatures", "Aboleth")).toBe(
      "/images/wiki/creatures/aboleth.png",
    );
    expect(wikiImageSrc("spells", "Fireball")).toBe(
      "/images/wiki/spells/fireball.png",
    );
  });

  it("falls back to the category plate when a name has no usable slug", () => {
    expect(wikiImageSrc("rules", "—")).toBe(wikiImageFallback("rules"));
  });
});
