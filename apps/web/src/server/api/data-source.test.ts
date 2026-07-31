import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

import { dndApi } from "@/server/api/data-source";

const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

describe("dndApi", () => {
  it("performs a deterministic GET and returns unvalidated JSON", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ index: "arcana" }), { status: 200 }),
    );

    await expect(
      dndApi("/skills/arcana", { cache: "no-store" }),
    ).resolves.toEqual({ index: "arcana" });

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe("http://127.0.0.1:4100/api/2014/skills/arcana");
    expect(init).toMatchObject({ cache: "no-store", method: "GET" });
    expect(new Headers(init?.headers).get("Accept")).toBe("application/json");
  });

  it("parses data when a schema is supplied", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ level: 2 }), { status: 200 }),
    );

    await expect(
      dndApi("/levels/2", { schema: z.object({ level: z.number().int() }) }),
    ).resolves.toEqual({ level: 2 });
  });

  it("rejects schema drift", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ level: "two" }), { status: 200 }),
    );

    await expect(
      dndApi("/levels/2", { schema: z.object({ level: z.number() }) }),
    ).rejects.toBeInstanceOf(z.ZodError);
  });

  it("converts failed responses into a tRPC bad-request error", async () => {
    fetchMock.mockResolvedValue(
      new Response("unavailable", {
        status: 503,
        statusText: "Service Unavailable",
      }),
    );

    await expect(dndApi("/spells")).rejects.toMatchObject({
      code: "BAD_REQUEST",
      message: "Failed to fetch /spells: Service Unavailable",
    });
  });
});
