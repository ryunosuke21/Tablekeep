import type * as Party from "partykit/server";

import { verifyPartyKitToken } from "../src/lib/partykit-token";

type EncounterChangedEvent = {
  campaignId: string;
  encounterId: string;
  revision: number;
  type: "encounter.changed";
};

function secretFrom(env: Record<string, unknown>) {
  return typeof env.PARTYKIT_SECRET === "string" &&
    env.PARTYKIT_SECRET.length >= 32
    ? env.PARTYKIT_SECRET
    : null;
}

function bearerToken(request: Party.Request) {
  const authorization = request.headers.get("authorization");
  return authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : null;
}

function isEncounterChangedEvent(
  value: unknown,
  campaignId: string,
): value is EncounterChangedEvent {
  if (!value || typeof value !== "object") return false;
  const event = value as Record<string, unknown>;
  return (
    event.type === "encounter.changed" &&
    event.campaignId === campaignId &&
    typeof event.encounterId === "string" &&
    typeof event.revision === "number" &&
    Number.isInteger(event.revision) &&
    event.revision >= 0
  );
}

export default class Server implements Party.Server {
  static async onBeforeConnect(request: Party.Request, lobby: Party.Lobby) {
    const secret = secretFrom(lobby.env);
    const token = new URL(request.url).searchParams.get("token");
    if (!secret || !token) {
      return new Response("Unauthorized", { status: 401 });
    }

    const claims = await verifyPartyKitToken(token, secret, {
      scope: "connect",
    });
    if (!claims || claims.campaignId !== lobby.id) {
      return new Response("Forbidden", { status: 403 });
    }

    return request;
  }

  constructor(readonly room: Party.Room) {}

  async getConnectionTags(
    _connection: Party.Connection,
    context: Party.ConnectionContext,
  ) {
    const secret = secretFrom(this.room.env);
    const token = new URL(context.request.url).searchParams.get("token");
    if (!secret || !token) return [];
    const claims = await verifyPartyKitToken(token, secret, {
      scope: "connect",
    });
    return claims?.scope === "connect" && claims.campaignId === this.room.id
      ? [`user:${claims.sub}`]
      : [];
  }

  async onRequest(request: Party.Request) {
    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    const secret = secretFrom(this.room.env);
    const token = bearerToken(request);
    if (!secret || !token) {
      return new Response("Unauthorized", { status: 401 });
    }

    const claims = await verifyPartyKitToken(token, secret, {
      scope: "publish",
    });
    if (!claims || claims.campaignId !== this.room.id) {
      return new Response("Forbidden", { status: 403 });
    }

    const event: unknown = await request.json().catch(() => null);
    if (!isEncounterChangedEvent(event, this.room.id)) {
      return new Response("Invalid event", { status: 400 });
    }

    this.room.broadcast(JSON.stringify(event));
    return new Response(null, { status: 202 });
  }
}

Server satisfies Party.Worker;
