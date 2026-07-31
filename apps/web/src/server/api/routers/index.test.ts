import { describe, expect, it, vi } from "vitest";

import { appRouter } from "@/server/api/routers";
import { testContext } from "@/test/context";

describe("health router", () => {
  it("reports an operational API", async () => {
    const caller = appRouter.createCaller(testContext(vi.fn()));

    await expect(caller.health.check()).resolves.toEqual({ status: "ok" });
  });
});
