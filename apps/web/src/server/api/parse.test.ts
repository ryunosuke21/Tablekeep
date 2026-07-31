import { TRPCError } from "@trpc/server";
import { describe, expect, it } from "vitest";
import { z } from "zod";

import { parseEntity, parseFoundEntity } from "@/server/api/parse";

describe("parseEntity", () => {
  it("returns parsed values and preserves schema transformations", () => {
    const schema = z.object({ name: z.string().trim().toUpperCase() });

    expect(parseEntity(schema, { name: "  mage  " }, "character")).toEqual({
      name: "MAGE",
    });
  });

  it("reports schema drift as an internal server error", () => {
    expect.assertions(4);

    try {
      parseEntity(z.object({ level: z.number() }), { level: "one" }, "spell");
    } catch (error) {
      expect(error).toBeInstanceOf(TRPCError);
      expect(error).toMatchObject({
        code: "INTERNAL_SERVER_ERROR",
        message: "Invalid spell data",
      });
      expect((error as TRPCError).cause).toBeInstanceOf(z.ZodError);
      expect((error as TRPCError).message).toContain("spell");
    }
  });
});

describe("parseFoundEntity", () => {
  it.each([null, undefined])("reports %s as not found", (value) => {
    expect(() =>
      parseFoundEntity(z.object({ index: z.string() }), value, "Skill"),
    ).toThrowError(
      expect.objectContaining({
        code: "NOT_FOUND",
        message: "Skill not found",
      }),
    );
  });

  it("validates a present entity", () => {
    expect(
      parseFoundEntity(
        z.object({ index: z.string() }),
        { index: "arcana" },
        "Skill",
      ),
    ).toEqual({ index: "arcana" });
  });
});
