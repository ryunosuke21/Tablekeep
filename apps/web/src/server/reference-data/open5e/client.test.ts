import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

import { Open5eHttpClient } from "./client";

const fetchMock = vi.fn<typeof fetch>();
const entitySchema = z.object({ key: z.string() });

beforeEach(() => fetchMock.mockReset());

describe("Open5eHttpClient", () => {
  it("reads every page of a catalog without narrowing the request", async () => {
    fetchMock
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            count: 2,
            next: "https://api.example.test/v2/spells/?page=2",
            previous: null,
            results: [{ key: "a5e-ag_accelerando" }],
          }),
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            count: 2,
            next: null,
            previous: "https://api.example.test/v2/spells/?page=1",
            results: [{ key: "srd-2024_fireball" }],
          }),
        ),
      );
    const client = new Open5eHttpClient(
      "https://api.example.test/v2",
      fetchMock,
    );

    await expect(
      client.listAll("spells", entitySchema, { fields: "key,name" }),
    ).resolves.toEqual([
      { key: "a5e-ag_accelerando" },
      { key: "srd-2024_fireball" },
    ]);

    const [firstUrl, init] = fetchMock.mock.calls[0] ?? [];
    expect(String(firstUrl)).toBe(
      "https://api.example.test/v2/spells/?fields=key%2Cname&page=1&limit=1000",
    );
    expect(String(fetchMock.mock.calls[1]?.[0])).toContain("page=2");
    expect(String(firstUrl)).not.toContain("document__key__in");
    expect(init).toMatchObject({ method: "GET", next: { revalidate: 86_400 } });
    expect(new Headers(init?.headers).get("Accept")).toBe("application/json");
  });

  it("encodes detail keys and validates responses", async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ key: "a/b" })));
    const client = new Open5eHttpClient(
      "https://api.example.test/v2/",
      fetchMock,
    );

    await expect(client.get("spells", "a/b", entitySchema)).resolves.toEqual({
      key: "a/b",
    });
    expect(String(fetchMock.mock.calls[0]?.[0])).toBe(
      "https://api.example.test/v2/spells/a%2Fb/",
    );
  });

  it.each([
    [404, "NOT_FOUND"],
    [429, "TOO_MANY_REQUESTS"],
    [503, "BAD_GATEWAY"],
  ])("maps upstream status %s to %s", async (status, code) => {
    fetchMock.mockResolvedValue(new Response("error", { status }));
    const client = new Open5eHttpClient(
      "https://api.example.test/v2",
      fetchMock,
    );

    await expect(
      client.get("spells", "missing", entitySchema),
    ).rejects.toMatchObject({ code });
  });

  it("maps malformed JSON and schema drift to a gateway error", async () => {
    const client = new Open5eHttpClient(
      "https://api.example.test/v2",
      fetchMock,
    );
    fetchMock.mockResolvedValueOnce(new Response("not-json"));
    await expect(
      client.get("spells", "bad", entitySchema),
    ).rejects.toMatchObject({ code: "BAD_GATEWAY" });

    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ key: 42 })));
    await expect(
      client.get("spells", "bad", entitySchema),
    ).rejects.toMatchObject({ code: "BAD_GATEWAY" });
  });

  it("maps network and timeout failures", async () => {
    const client = new Open5eHttpClient(
      "https://api.example.test/v2",
      fetchMock,
    );
    fetchMock.mockRejectedValueOnce(new Error("offline"));
    await expect(
      client.get("spells", "test", entitySchema),
    ).rejects.toMatchObject({ code: "BAD_GATEWAY" });

    fetchMock.mockRejectedValueOnce(
      new DOMException("timed out", "TimeoutError"),
    );
    await expect(
      client.get("spells", "test", entitySchema),
    ).rejects.toMatchObject({ code: "TIMEOUT" });
  });
});
