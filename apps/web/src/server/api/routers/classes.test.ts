import { beforeEach, describe, expect, it, vi } from "vitest";

import { classesRouter } from "@/server/api/routers/classes";
import { testContext } from "@/test/context";
import {
  classFixture,
  prerequisiteChoiceFixture,
} from "@/test/fixtures/reference-data";

const request = vi.fn();

beforeEach(() => request.mockReset());

describe("classes router", () => {
  it("adds an equality filter only when hitDie is supplied", async () => {
    const classItem = {
      index: "guardian",
      name: "Guardian",
      hit_die: 10,
      subclasses: null,
    };
    request.mockResolvedValue({ classes: [classItem] });
    const caller = classesRouter.createCaller(testContext(request));

    await expect(
      caller.list({ cursor: 2, limit: 8, name: "guard", hitDie: 10 }),
    ).resolves.toEqual([classItem]);
    expect(request).toHaveBeenCalledWith(expect.anything(), {
      skip: 2,
      limit: 8,
      name: "guard",
      hit_die: { eq: 10 },
    });
  });

  it("omits the hit-die equality value when no filter is supplied", async () => {
    request.mockResolvedValue({ classes: [] });
    const caller = classesRouter.createCaller(testContext(request));

    await caller.list();

    expect(request).toHaveBeenCalledWith(expect.anything(), {
      skip: undefined,
      limit: undefined,
      name: undefined,
      hit_die: undefined,
    });
  });

  it("returns classes without multiclassing in one request", async () => {
    const classData = classFixture();
    request.mockResolvedValue({ class: classData });
    const caller = classesRouter.createCaller(testContext(request));

    await expect(caller.get({ index: "guardian" })).resolves.toEqual(classData);
    expect(request).toHaveBeenCalledOnce();
  });

  it("merges optional multiclass prerequisite choices", async () => {
    const classData = classFixture({
      multi_classing: {
        prerequisites: null,
        proficiencies: null,
        proficiency_choices: [],
      },
    });
    const prerequisiteOptions = prerequisiteChoiceFixture();
    request.mockResolvedValueOnce({ class: classData }).mockResolvedValueOnce({
      class: { multi_classing: { prerequisite_options: prerequisiteOptions } },
    });
    const caller = classesRouter.createCaller(testContext(request));

    await expect(caller.get({ index: "guardian" })).resolves.toMatchObject({
      multi_classing: { prerequisite_options: prerequisiteOptions },
    });
    expect(request).toHaveBeenCalledTimes(2);
  });

  it("falls back to null when the optional prerequisite query fails", async () => {
    const classData = classFixture({
      multi_classing: {
        prerequisites: null,
        proficiencies: null,
        proficiency_choices: [],
      },
    });
    request
      .mockResolvedValueOnce({ class: classData })
      .mockRejectedValueOnce(new Error("field is unavailable"));
    const caller = classesRouter.createCaller(testContext(request));

    await expect(caller.get({ index: "guardian" })).resolves.toMatchObject({
      multi_classing: { prerequisite_options: null },
    });
  });
});
