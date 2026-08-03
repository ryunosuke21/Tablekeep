import { describe, expect, it } from "vitest";

import {
  readDestination,
  safeDestination,
  withDestination,
} from "./redirect-destination";

describe("safeDestination", () => {
  it.each([
    undefined,
    null,
    "",
    "https://evil.example",
    "//evil.example",
    "/\\evil.example",
    "/%5Cevil.example",
    "/%2F%2Fevil.example",
    "/campaigns%0d%0aLocation:%20https://evil.example",
    "/campaigns/%E0%A4%A",
    "javascript:alert(1)",
    "campaigns",
    "/sign-in",
    "/sign-in?next=%2Fcampaigns",
    "/new-profile",
  ])("rejects unsafe or loop-inducing destination %s", (candidate) => {
    expect(safeDestination(candidate)).toBeNull();
  });

  it.each([
    "/campaigns",
    "/join/ABCDE-FGHIJ",
    "/campaigns/one?tab=members&view=compact",
  ])("accepts same-origin path %s", (candidate) => {
    expect(safeDestination(candidate)).toBe(candidate);
  });
});

describe("withDestination", () => {
  it("adds an encoded safe destination", () => {
    expect(withDestination("/sign-in", "/campaigns/one?tab=members")).toBe(
      "/sign-in?next=%2Fcampaigns%2Fone%3Ftab%3Dmembers",
    );
  });

  it("does not append an unsafe destination", () => {
    expect(withDestination("/sign-in", "//evil.example")).toBe("/sign-in");
  });
});

describe("readDestination", () => {
  it("reads URLSearchParams and plain records", () => {
    expect(readDestination(new URLSearchParams("next=%2Fcampaigns"))).toBe(
      "/campaigns",
    );
    expect(readDestination({ next: ["/join/ABCDE", "/campaigns"] })).toBe(
      "/join/ABCDE",
    );
  });
});
