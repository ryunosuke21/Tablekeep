import { describe, expect, it } from "vitest";

import {
  formatInviteCode,
  generateInviteCode,
  normalizeInviteCode,
} from "./invite-code";

describe("campaign invite codes", () => {
  it("normalizes lower-case, dashed, and spaced input", () => {
    expect(normalizeInviteCode("  abcde-fghjk  ")).toBe("ABCDEFGHJK");
  });

  it("formats normalized codes for display only", () => {
    expect(formatInviteCode("abcdefghjk")).toBe("ABCDE-FGHJK");
  });

  it("generates ten unambiguous upper-case glyphs", () => {
    const generated: string[] = [];
    // The production function deliberately has a bounded redraw loop. Collect
    // successful samples without making the test probabilistically depend on
    // every independent call finding one within that bound.
    for (let index = 0; index < 100 && generated.length < 20; index++) {
      try {
        generated.push(generateInviteCode());
      } catch {
        // A bounded-generation failure is an intentional, explicit outcome.
      }
    }
    expect(generated).toHaveLength(20);
    expect(generated.every((code) => /^[A-HJ-NP-Z2-9]{10}$/.test(code))).toBe(
      true,
    );
  });
});
