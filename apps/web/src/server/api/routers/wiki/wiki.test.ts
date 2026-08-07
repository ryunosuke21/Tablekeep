import { beforeEach, describe, expect, it, vi } from "vitest";

import { testContext } from "@/test/context";
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

import { wikiBackgroundsRouter } from "./backgrounds";
import { wikiClassesRouter } from "./classes";
import { wikiCreaturesRouter } from "./creatures";
import { wikiFeatsRouter } from "./feats";
import { wikiItemsRouter, wikiMagicItemsRouter } from "./items";
import { wikiRulesRouter } from "./rules";
import { wikiSpeciesRouter } from "./species";
import { wikiSpellsRouter } from "./spells";

const request = vi.fn();

/** Catalog reads ask for the resource first, then the source books. */
function upstream(entries: unknown[], documents = [open5eDocument()]) {
  request.mockImplementation((resource: string) =>
    Promise.resolve(resource === "documents" ? documents : entries),
  );
}

beforeEach(() => request.mockReset());

describe("Wiki routers", () => {
  it("reads a whole catalog and pairs it with the sources it uses", async () => {
    upstream([backgroundFixture()]);
    const caller = wikiBackgroundsRouter.createCaller(testContext(request));

    await expect(caller.catalog()).resolves.toEqual({
      items: [{ key: "srd-2024_sage", name: "Sage", sourceKey: "srd-2024" }],
      sources: [
        {
          key: "srd-2024",
          name: "System Reference Document 5.2",
          displayName: "5e 2024 Rules",
          gameSystem: { key: "5e-2024", name: "5th Edition 2024" },
          permalink: "https://example.test/srd-2024",
          publisher: {
            key: "wizards-of-the-coast",
            name: "Wizards of the Coast",
          },
        },
      ],
    });
    expect(request).toHaveBeenCalledWith("backgrounds", expect.anything(), {
      fields: "key,name,document",
    });
  });

  it("asks the reference service for everything, with no source filter", async () => {
    upstream([classFixture()]);
    const caller = wikiClassesRouter.createCaller(testContext(request));

    await caller.catalog();

    const [resource, , query] = request.mock.calls[0] ?? [];
    expect(resource).toBe("classes");
    expect(query).toEqual({
      fields: "key,name,document,hit_dice,caster_type,subclass_of",
    });
  });

  it("drops sources that no entry came from", async () => {
    upstream([speciesFixture()], [open5eDocument(), open5eDocument("a5e-ag")]);
    const caller = wikiSpeciesRouter.createCaller(testContext(request));

    await expect(caller.catalog()).resolves.toMatchObject({
      items: [{ key: "srd-2024_human", isSubspecies: false }],
      sources: [{ key: "srd-2024" }],
    });
  });

  it("keeps entries from every published source", async () => {
    upstream(
      [
        creatureFixture(),
        {
          ...creatureFixture(),
          key: "a5e-mm_aboleth",
          document: open5eDocument("a5e-mm"),
        },
      ],
      [open5eDocument(), open5eDocument("a5e-mm")],
    );
    const caller = wikiCreaturesRouter.createCaller(testContext(request));

    await expect(caller.catalog()).resolves.toMatchObject({
      items: [{ sourceKey: "srd-2024" }, { sourceKey: "a5e-mm" }],
      sources: [{ key: "srd-2024" }, { key: "a5e-mm" }],
    });
  });

  it("maps spell list details the browser filters on", async () => {
    upstream([spellFixture()]);
    const caller = wikiSpellsRouter.createCaller(testContext(request));

    await expect(caller.catalog()).resolves.toMatchObject({
      items: [{ components: ["V", "S"], level: 1, ritual: false }],
    });
    expect(request).toHaveBeenCalledWith("spells", expect.anything(), {
      fields:
        "key,name,document,level,school,classes,casting_time,concentration,ritual,verbal,somatic,material",
    });
  });

  it("marks everyday gear and magic items apart", async () => {
    upstream([itemFixture()]);
    await expect(
      wikiItemsRouter.createCaller(testContext(request)).catalog(),
    ).resolves.toMatchObject({
      items: [{ key: "srd-2024_rope", kind: "mundane" }],
    });

    upstream([magicItemFixture()]);
    await expect(
      wikiMagicItemsRouter.createCaller(testContext(request)).catalog(),
    ).resolves.toMatchObject({
      items: [{ kind: "magic", requiresAttunement: true }],
    });
  });

  it("maps feats and rules", async () => {
    upstream([featFixture()]);
    await expect(
      wikiFeatsRouter.createCaller(testContext(request)).catalog(),
    ).resolves.toMatchObject({ items: [{ hasPrerequisite: false }] });

    upstream([ruleFixture()]);
    await expect(
      wikiRulesRouter.createCaller(testContext(request)).catalog(),
    ).resolves.toMatchObject({
      items: [{ sourceKey: "srd-2024", ruleset: "core", index: 1 }],
    });
  });

  it("joins a rule to its source book", async () => {
    request.mockImplementation((resource: string) =>
      Promise.resolve(
        resource === "documents" ? [open5eDocument()] : ruleFixture(),
      ),
    );
    const caller = wikiRulesRouter.createCaller(testContext(request));

    await expect(
      caller.get({ key: "srd-2024_d20-tests" }),
    ).resolves.toMatchObject({
      key: "srd-2024_d20-tests",
      source: { key: "srd-2024", displayName: "5e 2024 Rules" },
    });
  });

  it("gets a detail by source-qualified key", async () => {
    request.mockResolvedValue(spellFixture());
    const caller = wikiSpellsRouter.createCaller(testContext(request));

    await expect(
      caller.get({ key: "srd-2024_test-spark" }),
    ).resolves.toMatchObject({ key: "srd-2024_test-spark" });
    expect(request).toHaveBeenCalledWith(
      "spells",
      "srd-2024_test-spark",
      expect.anything(),
    );
  });

  it("rejects an empty detail key before I/O", async () => {
    const caller = wikiSpellsRouter.createCaller(testContext(request));

    await expect(caller.get({ key: "" })).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
    expect(request).not.toHaveBeenCalled();
  });
});
