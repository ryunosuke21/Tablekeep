import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { fetchMock } = vi.hoisted(() => ({ fetchMock: vi.fn() }));

vi.mock("partysocket", () => ({
  default: { fetch: fetchMock },
}));

vi.mock("@/env/client", () => ({
  env: { NEXT_PUBLIC_PARTYKIT_HOST: "party.example.test" },
}));

vi.mock("@/env/server", () => ({
  env: {
    PARTYKIT_SECRET: "a-test-secret-that-is-at-least-32-characters",
  },
}));

const { publishEncounterChanged } = await import("./publish");

describe("publishEncounterChanged", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("publishes a signed revision event to its campaign room", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 202 }));

    await expect(
      publishEncounterChanged({
        campaignId: "campaign-1",
        encounterId: "encounter-1",
        revision: 3,
      }),
    ).resolves.toBe(true);

    expect(fetchMock).toHaveBeenCalledOnce();
    const [options, request] = fetchMock.mock.calls[0] ?? [];
    expect(options).toEqual({
      host: "party.example.test",
      room: "campaign-1",
    });
    expect(request).toMatchObject({ method: "POST" });
    expect(JSON.parse(String(request.body))).toEqual({
      campaignId: "campaign-1",
      encounterId: "encounter-1",
      revision: 3,
      type: "encounter.changed",
    });
    expect(request.headers.authorization).toMatch(/^Bearer [^.]+\.[^.]+$/u);
  });

  it("keeps a publish outage from changing the committed mutation result", async () => {
    fetchMock.mockRejectedValue(new Error("offline"));

    await expect(
      publishEncounterChanged({
        campaignId: "campaign-1",
        encounterId: "encounter-1",
        revision: 3,
      }),
    ).resolves.toBe(false);
    expect(console.warn).toHaveBeenCalledOnce();
  });
});
