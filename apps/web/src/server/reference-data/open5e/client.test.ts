import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

import { Open5eHttpClient } from "./client";

const fetchMock = vi.fn<typeof fetch>();
const entitySchema = z.object({ key: z.string() });

beforeEach(() => fetchMock.mockReset());

describe("Open5eHttpClient", () => {
  it("builds source-scoped, encoded list requests", async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({ count: 0, next: null, previous: null, results: [] }),
      ),
    );
    const client = new Open5eHttpClient(
      "https://api.example.test/v2",
      fetchMock,
    );

    await client.list("spells", entitySchema, {
      page: 2,
      limit: 10,
      name__icontains: "acid arrow",
      document__key__in: "wrong-source",
    });

    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(String(url)).toBe(
      "https://api.example.test/v2/spells/?page=2&limit=10&name__icontains=acid+arrow&document__key__in=srd-2024",
    );
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
