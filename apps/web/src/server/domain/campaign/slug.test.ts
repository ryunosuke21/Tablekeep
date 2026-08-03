import { describe, expect, it } from "vitest";

import {
  deriveCampaignSlug,
  MAX_CAMPAIGN_SLUG_LENGTH,
  slugifyCampaignName,
} from "./slug";

describe("campaign slug derivation", () => {
  it("normalizes punctuation, whitespace, case, and common diacritics", () => {
    expect(slugifyCampaignName("  Éowyn's Grand Campaign!  ")).toBe(
      "eowyn-s-grand-campaign",
    );
  });

  it("provides a usable fallback", () => {
    expect(slugifyCampaignName("🧙‍♀️ !!!")).toBe("campaign");
  });

  it("appends a collision suffix within the length limit", () => {
    const slug = deriveCampaignSlug("A".repeat(100), "X7Q9");
    expect(slug).toMatch(/-x7q9$/);
    expect(slug).toHaveLength(MAX_CAMPAIGN_SLUG_LENGTH);
  });
});
