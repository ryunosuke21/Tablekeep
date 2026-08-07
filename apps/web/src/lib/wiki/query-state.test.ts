import { describe, expect, it } from "vitest";

import {
  countActiveFilters,
  parseWikiQuery,
  serializeWikiQuery,
  toggleFilterValue,
} from "./query-state";

function parse(search: string) {
  return parseWikiQuery(new URLSearchParams(search));
}

describe("Wiki query state", () => {
  it("starts unfiltered when the URL says nothing", () => {
    expect(parse("")).toEqual({
      q: "",
      view: "index",
      sort: "name",
      filters: {},
    });
  });

  it("reads search, view, sort, and multi-value filters", () => {
    expect(
      parse("q=fire&view=cards&sort=level&f.level=1,2&f.school=evocation"),
    ).toEqual({
      q: "fire",
      view: "cards",
      sort: "level",
      filters: { level: ["1", "2"], school: ["evocation"] },
    });
  });

  it("ignores unknown views and empty filter values", () => {
    expect(parse("view=table&f.level=&f.school=,")).toMatchObject({
      view: "index",
      filters: {},
    });
  });

  it("writes only what differs from the default state", () => {
    expect(
      serializeWikiQuery({
        q: "  acid  ",
        view: "index",
        sort: "name",
        filters: { level: ["1"], school: [] },
      }),
    ).toBe("q=acid&f.level=1");
  });

  it("round-trips a filtered view", () => {
    const query = {
      q: "owl",
      view: "cards" as const,
      sort: "challenge",
      filters: { challenge: ["1-4", "5-10"] },
    };
    expect(parse(serializeWikiQuery(query))).toEqual(query);
  });

  it("toggles a value off and drops the facet when it empties", () => {
    const added = toggleFilterValue({}, "level", "3");
    expect(added).toEqual({ level: ["3"] });
    expect(countActiveFilters(added)).toBe(1);
    expect(toggleFilterValue(added, "level", "3")).toEqual({});
  });
});
