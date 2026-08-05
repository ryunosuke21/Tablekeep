import { describe, expect, it } from "vitest";

import {
  deriveCharacterSlug,
  MAX_CHARACTER_SLUG_LENGTH,
  slugifyCharacterName,
} from "./slug";

describe("character slugs", () => {
  it("normalizes a readable name", () => {
    expect(slugifyCharacterName("  Éowyn of Rohan! ")).toBe("eowyn-of-rohan");
  });

  it("keeps collision suffixes inside the limit", () => {
    const slug = deriveCharacterSlug("A".repeat(200), "abc123");
    expect(slug).toHaveLength(MAX_CHARACTER_SLUG_LENGTH);
    expect(slug).toMatch(/-abc123$/);
  });
});
