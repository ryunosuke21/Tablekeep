import type * as Party from "partykit/server";
import { describe, expect, it, vi } from "vitest";

import Server from "../../party";
import { issuePartyKitToken } from "./partykit-token";

const secret = "a-test-secret-that-is-at-least-32-characters";

function lobby(id = "campaign-1") {
  return { env: { PARTYKIT_SECRET: secret }, id } as unknown as Party.Lobby;
}

function room(id = "campaign-1") {
  return {
    broadcast: vi.fn(),
    env: { PARTYKIT_SECRET: secret },
    id,
  } as unknown as Party.Room;
}

describe("PartyKit campaign room", () => {
  it("accepts a member token only for its campaign room", async () => {
    const token = await issuePartyKitToken(
      {
        campaignId: "campaign-1",
        role: "player",
        scope: "connect",
        sub: "user-1",
      },
      secret,
    );
    const request = new Request(
      `https://example.test/parties/main/campaign-1?token=${token}`,
    ) as unknown as Party.Request;

    await expect(Server.onBeforeConnect(request, lobby())).resolves.toBe(
      request,
    );
    const rejected = await Server.onBeforeConnect(request, lobby("campaign-2"));
    expect(rejected).toBeInstanceOf(Response);
    expect((rejected as Response).status).toBe(403);
  });

  it("rejects connections without a token", async () => {
    const response = await Server.onBeforeConnect(
      new Request(
        "https://example.test/parties/main/campaign-1",
      ) as unknown as Party.Request,
      lobby(),
    );
    expect(response).toBeInstanceOf(Response);
    expect((response as Response).status).toBe(401);
  });

  it("broadcasts only signed revision events from the web server", async () => {
    const campaignRoom = room();
    const server = new Server(campaignRoom);
    const token = await issuePartyKitToken(
      { campaignId: "campaign-1", scope: "publish", sub: "web" },
      secret,
    );
    const event = {
      campaignId: "campaign-1",
      encounterId: "encounter-1",
      revision: 4,
      type: "encounter.changed",
    } as const;
    const response = await server.onRequest(
      new Request("https://example.test/parties/main/campaign-1", {
        body: JSON.stringify(event),
        headers: { authorization: `Bearer ${token}` },
        method: "POST",
      }) as unknown as Party.Request,
    );

    expect(response.status).toBe(202);
    expect(campaignRoom.broadcast).toHaveBeenCalledWith(JSON.stringify(event));
    expect("onMessage" in server).toBe(false);
  });

  it("does not publish malformed or cross-campaign events", async () => {
    const campaignRoom = room();
    const server = new Server(campaignRoom);
    const token = await issuePartyKitToken(
      { campaignId: "campaign-1", scope: "publish", sub: "web" },
      secret,
    );
    const response = await server.onRequest(
      new Request("https://example.test/parties/main/campaign-1", {
        body: JSON.stringify({
          campaignId: "campaign-2",
          encounterId: "encounter-1",
          revision: 4,
          type: "encounter.changed",
        }),
        headers: { authorization: `Bearer ${token}` },
        method: "POST",
      }) as unknown as Party.Request,
    );

    expect(response.status).toBe(400);
    expect(campaignRoom.broadcast).not.toHaveBeenCalled();
  });

  it("rejects a publish token signed for another campaign", async () => {
    const campaignRoom = room();
    const server = new Server(campaignRoom);
    const token = await issuePartyKitToken(
      { campaignId: "campaign-2", scope: "publish", sub: "web" },
      secret,
    );
    const response = await server.onRequest(
      new Request("https://example.test/parties/main/campaign-1", {
        body: JSON.stringify({
          campaignId: "campaign-1",
          encounterId: "encounter-1",
          revision: 4,
          type: "encounter.changed",
        }),
        headers: { authorization: `Bearer ${token}` },
        method: "POST",
      }) as unknown as Party.Request,
    );

    expect(response.status).toBe(403);
    expect(campaignRoom.broadcast).not.toHaveBeenCalled();
  });
});
