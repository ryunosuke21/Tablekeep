import { beforeEach, describe, expect, it, vi } from "vitest";

import { spellsRouter } from "@/server/api/routers/spells";
import { testContext } from "@/test/context";
import {
  reference,
  spellFixture,
  spellListItemFixture,
} from "@/test/fixtures/reference-data";

const request = vi.fn();

beforeEach(() => request.mockReset());

describe("spells router", () => {
  it("forwards pagination and spell filters", async () => {
    const spell = spellListItemFixture();
    request.mockResolvedValue({ spells: [spell] });
    const caller = spellsRouter.createCaller(testContext(request));

    await expect(
      caller.list({
        cursor: 10,
        limit: 5,
        level: [0, 1],
        school: ["evocation"],
      }),
    ).resolves.toEqual([spell]);
    expect(request).toHaveBeenCalledWith(expect.anything(), {
      skip: 10,
      limit: 5,
      level: [0, 1],
      school: ["evocation"],
    });
  });

  it("does not request slot damage for cantrips", async () => {
    const spell = spellFixture();
    request.mockResolvedValue({ spell });
    const caller = spellsRouter.createCaller(testContext(request));

    await expect(caller.get({ index: spell.index })).resolves.toEqual(spell);
    expect(request).toHaveBeenCalledOnce();
  });

  it("does not request slot damage for non-damaging spells", async () => {
    const spell = spellFixture({ level: 1, damage: null });
    request.mockResolvedValue({ spell });
    const caller = spellsRouter.createCaller(testContext(request));

    await expect(caller.get({ index: spell.index })).resolves.toEqual(spell);
    expect(request).toHaveBeenCalledOnce();
  });

  it("merges slot-level damage for a leveled damaging spell", async () => {
    const spell = spellFixture({
      level: 1,
      damage: {
        damage_type: reference("fire", "Fire"),
        damage_at_slot_level: null,
      },
    });
    request.mockResolvedValueOnce({ spell }).mockResolvedValueOnce({
      spell: {
        damage: {
          damage_at_slot_level: [
            { level: 1, value: "2d6" },
            { level: 2, value: "3d6" },
          ],
        },
      },
    });
    const caller = spellsRouter.createCaller(testContext(request));

    await expect(caller.get({ index: spell.index })).resolves.toMatchObject({
      damage: {
        damage_at_slot_level: [
          { level: 1, value: "2d6" },
          { level: 2, value: "3d6" },
        ],
      },
    });
    expect(request).toHaveBeenCalledTimes(2);
  });

  it("reports missing and malformed upstream spells", async () => {
    const caller = spellsRouter.createCaller(testContext(request));

    request.mockResolvedValueOnce({ spell: null });
    await expect(caller.get({ index: "missing" })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });

    request.mockResolvedValueOnce({ spell: { index: "broken" } });
    await expect(caller.get({ index: "broken" })).rejects.toMatchObject({
      code: "INTERNAL_SERVER_ERROR",
    });
  });
});
