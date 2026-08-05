import { describe, expect, it } from "vitest";

import { parseWikiQuery } from "./query-state";

describe("parseWikiQuery", () => {
  it("defaults to cards and keeps table pagination out of card state", () => {
    expect(parseWikiQuery("classes", { page: "4", limit: "50" })).toMatchObject(
      {
        view: "cards",
        page: 1,
        limit: 50,
        q: "",
      },
    );
  });

  it("parses valid table pagination and clamps page-size choices", () => {
    expect(
      parseWikiQuery("spells", { view: "table", page: "3", limit: "10" }),
    ).toMatchObject({ view: "table", page: 3, limit: 10 });
    expect(
      parseWikiQuery("spells", { view: "table", page: "-2", limit: "999" }),
    ).toMatchObject({ view: "table", page: 1, limit: 20 });
  });

  it("keeps only filters supported by each category", () => {
    const spells = parseWikiQuery("spells", { level: "3", kind: "magic" });
    expect(spells).toMatchObject({ level: 3 });
    expect(spells).not.toHaveProperty("kind");
    const creatures = parseWikiQuery("creatures", {
      crMin: "0.5",
      acMax: "18",
      level: "2",
    });
    expect(creatures).toMatchObject({ crMin: 0.5, acMax: 18 });
    expect(creatures).not.toHaveProperty("level");
    expect(parseWikiQuery("items", { kind: "something-else" })).toMatchObject({
      kind: "mundane",
    });
  });

  it("trims search text and rejects invalid numbers", () => {
    expect(
      parseWikiQuery("creatures", {
        q: "  dragon  ",
        crMin: "nope",
        acMin: "-1",
      }),
    ).toMatchObject({ q: "dragon", crMin: undefined, acMin: undefined });
  });
});
