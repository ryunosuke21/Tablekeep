import { beforeEach, describe, expect, it, vi } from "vitest";

import { testContext } from "@/test/context";
import {
  backgroundFixture,
  classFixture,
  creatureFixture,
  featFixture,
  itemFixture,
  magicItemFixture,
  pageFixture,
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

beforeEach(() => request.mockReset());

describe("Wiki routers", () => {
  it("maps common list pagination and name filters", async () => {
    request.mockResolvedValue({
      ...pageFixture(backgroundFixture()),
      count: 3,
      next: "https://api.example.test/v2/backgrounds/?page=3",
      previous: "https://api.example.test/v2/backgrounds/?page=1",
    });
    const caller = wikiBackgroundsRouter.createCaller(testContext(request));

    await expect(
      caller.list({ page: 2, limit: 1, name: "sage" }),
    ).resolves.toMatchObject({
      items: [{ key: "srd-2024_sage" }],
      pageInfo: {
        count: 3,
        page: 2,
        limit: 1,
        hasNextPage: true,
        hasPreviousPage: true,
      },
    });
    expect(request).toHaveBeenCalledWith("backgrounds", expect.anything(), {
      page: 2,
      limit: 1,
      name__icontains: "sage",
      fields: "key,name,document",
    });
  });

  it("defaults class lists to base classes and supports subclasses", async () => {
    request.mockResolvedValue(pageFixture(classFixture()));
    const caller = wikiClassesRouter.createCaller(testContext(request));

    await caller.list();
    expect(request).toHaveBeenLastCalledWith("classes", expect.anything(), {
      page: 1,
      limit: 20,
      name__contains: undefined,
      is_subclass: false,
      fields: "key,name,document,hit_dice,caster_type,subclass_of",
    });

    await caller.list({ kind: "subclass" });
    expect(request).toHaveBeenLastCalledWith("classes", expect.anything(), {
      page: 1,
      limit: 20,
      name__contains: undefined,
      is_subclass: true,
      fields: "key,name,document,hit_dice,caster_type,subclass_of",
    });
  });

  it("translates only supported spell filters", async () => {
    request.mockResolvedValue(pageFixture(spellFixture()));
    const caller = wikiSpellsRouter.createCaller(testContext(request));

    await expect(
      caller.list({
        page: 3,
        limit: 5,
        name: "spark",
        level: 1,
        schoolKey: "evocation",
        classKey: "srd-2024_wizard",
      }),
    ).resolves.toMatchObject({ items: [{ components: ["V", "S"] }] });
    expect(request).toHaveBeenCalledWith("spells", expect.anything(), {
      page: 3,
      limit: 5,
      name__icontains: "spark",
      level: 1,
      school__key: "evocation",
      classes__key: "srd-2024_wizard",
      fields:
        "key,name,document,level,school,classes,casting_time,concentration,ritual,verbal,somatic,material",
    });
  });

  it("translates creature range filters", async () => {
    request.mockResolvedValue(pageFixture(creatureFixture()));
    const caller = wikiCreaturesRouter.createCaller(testContext(request));

    await caller.list({
      challengeRatingMin: 0.5,
      challengeRatingMax: 2,
      armorClassMin: 12,
      armorClassMax: 18,
    });
    expect(request).toHaveBeenCalledWith("creatures", expect.anything(), {
      page: 1,
      limit: 20,
      name__icontains: undefined,
      size: undefined,
      category__iexact: undefined,
      challenge_rating__gte: 0.5,
      challenge_rating__lte: 2,
      armor_class__gte: 12,
      armor_class__lte: 18,
      fields:
        "key,name,document,type,size,challenge_rating,category,armor_class,hit_points",
    });
  });

  it("uses species/subspecies filters without separate routers", async () => {
    request.mockResolvedValue(pageFixture(speciesFixture()));
    const caller = wikiSpeciesRouter.createCaller(testContext(request));

    await caller.list({ kind: "all" });
    expect(request).toHaveBeenCalledWith("species", expect.anything(), {
      page: 1,
      limit: 20,
      name__icontains: undefined,
      subspecies_of__isnull: undefined,
      fields: "key,name,document,is_subspecies,subspecies_of",
    });
  });

  it("keeps mundane and magic item catalogs separate", async () => {
    request.mockResolvedValueOnce(pageFixture(itemFixture()));
    const items = wikiItemsRouter.createCaller(testContext(request));
    await expect(items.list()).resolves.toMatchObject({
      items: [{ key: "srd-2024_rope" }],
    });
    expect(request).toHaveBeenLastCalledWith(
      "items",
      expect.anything(),
      expect.anything(),
    );

    request.mockResolvedValueOnce(pageFixture(magicItemFixture()));
    const magicItems = wikiMagicItemsRouter.createCaller(testContext(request));
    await expect(magicItems.list()).resolves.toMatchObject({
      items: [{ requiresAttunement: true }],
    });
    expect(request).toHaveBeenLastCalledWith(
      "magicitems",
      expect.anything(),
      expect.anything(),
    );
  });

  it("maps feats and rules", async () => {
    request.mockResolvedValueOnce(pageFixture(featFixture()));
    await expect(
      wikiFeatsRouter.createCaller(testContext(request)).list(),
    ).resolves.toMatchObject({ items: [{ hasPrerequisite: false }] });

    request.mockResolvedValueOnce(pageFixture(ruleFixture()));
    await expect(
      wikiRulesRouter.createCaller(testContext(request)).list(),
    ).resolves.toMatchObject({ items: [{ sourceKey: "srd-2024" }] });
  });

  it("gets a detail by source-qualified key", async () => {
    request.mockResolvedValue(spellFixture());
    const caller = wikiSpellsRouter.createCaller(testContext(request));

    await expect(
      caller.get({ key: "srd-2024_test-spark" }),
    ).resolves.toMatchObject({
      key: "srd-2024_test-spark",
    });
    expect(request).toHaveBeenCalledWith(
      "spells",
      "srd-2024_test-spark",
      expect.anything(),
    );
  });

  it("rejects invalid pagination and empty detail keys before I/O", async () => {
    const caller = wikiSpellsRouter.createCaller(testContext(request));

    await expect(caller.list({ page: 0 })).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
    await expect(caller.list({ limit: 51 })).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
    await expect(caller.get({ key: "" })).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
    expect(request).not.toHaveBeenCalled();
  });
});
