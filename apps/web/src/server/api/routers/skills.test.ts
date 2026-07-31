import { beforeEach, describe, expect, it, vi } from "vitest";

import { skillsRouter } from "@/server/api/routers/skills";
import { testContext } from "@/test/context";
import {
  skillFixture,
  skillListItemFixture,
} from "@/test/fixtures/reference-data";

const request = vi.fn();

beforeEach(() => request.mockReset());

describe("skills router", () => {
  it("translates list filters into GraphQL variables", async () => {
    const skill = skillListItemFixture();
    request.mockResolvedValue({ skills: [skill] });
    const caller = skillsRouter.createCaller(testContext(request));

    await expect(
      caller.list({
        cursor: 5,
        limit: 15,
        name: "arc",
        abilityScore: ["int"],
      }),
    ).resolves.toEqual([skill]);
    expect(request).toHaveBeenCalledWith(expect.anything(), {
      skip: 5,
      limit: 15,
      name: "arc",
      ability_score: ["int"],
    });
  });

  it("returns a validated skill by index", async () => {
    const skill = skillFixture();
    request.mockResolvedValue({ skill });
    const caller = skillsRouter.createCaller(testContext(request));

    await expect(caller.get({ index: "arcana" })).resolves.toEqual(skill);
    expect(request).toHaveBeenCalledWith(expect.anything(), {
      index: "arcana",
    });
  });

  it("reports missing skills as not found", async () => {
    request.mockResolvedValue({ skill: null });
    const caller = skillsRouter.createCaller(testContext(request));

    await expect(caller.get({ index: "missing" })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });

  it("reports malformed upstream data as an internal error", async () => {
    request.mockResolvedValue({ skill: { index: "arcana" } });
    const caller = skillsRouter.createCaller(testContext(request));

    await expect(caller.get({ index: "arcana" })).rejects.toMatchObject({
      code: "INTERNAL_SERVER_ERROR",
    });
  });

  it("rejects empty indexes before querying upstream", async () => {
    const caller = skillsRouter.createCaller(testContext(request));

    await expect(caller.get({ index: "" })).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
    expect(request).not.toHaveBeenCalled();
  });
});
