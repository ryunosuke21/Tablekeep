const TOKEN_VERSION = 1;

type CampaignRole = "dm" | "player";

export type PartyKitTokenClaims =
  | {
      campaignId: string;
      exp: number;
      role: CampaignRole;
      scope: "connect";
      sub: string;
      v: typeof TOKEN_VERSION;
    }
  | {
      campaignId: string;
      exp: number;
      scope: "publish";
      sub: "web";
      v: typeof TOKEN_VERSION;
    };

export type PartyKitTokenInput =
  | {
      campaignId: string;
      role: CampaignRole;
      scope: "connect";
      sub: string;
    }
  | {
      campaignId: string;
      scope: "publish";
      sub: "web";
    };

const encoder = new TextEncoder();

function encodeBase64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/u, "");
}

function decodeBase64Url(value: string) {
  const padded = value.replaceAll("-", "+").replaceAll("_", "/");
  const binary = atob(padded.padEnd(Math.ceil(padded.length / 4) * 4, "="));
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function hmacKey(secret: string, usages: KeyUsage[]) {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { hash: "SHA-256", name: "HMAC" },
    false,
    usages,
  );
}

async function signPayload(payload: string, secret: string) {
  const signature = await crypto.subtle.sign(
    "HMAC",
    await hmacKey(secret, ["sign"]),
    encoder.encode(payload),
  );
  return encodeBase64Url(new Uint8Array(signature));
}

export async function issuePartyKitToken(
  claims: PartyKitTokenInput,
  secret: string,
  options: { now?: number; ttlSeconds?: number } = {},
) {
  const now = options.now ?? Date.now();
  const ttlSeconds = options.ttlSeconds ?? 60;
  const payload = encodeBase64Url(
    encoder.encode(
      JSON.stringify({
        ...claims,
        exp: Math.floor(now / 1000) + ttlSeconds,
        v: TOKEN_VERSION,
      }),
    ),
  );
  return `${payload}.${await signPayload(payload, secret)}`;
}

function isClaims(value: unknown): value is PartyKitTokenClaims {
  if (!value || typeof value !== "object") return false;
  const claims = value as Record<string, unknown>;
  if (
    claims.v !== TOKEN_VERSION ||
    typeof claims.exp !== "number" ||
    !Number.isInteger(claims.exp) ||
    typeof claims.campaignId !== "string" ||
    typeof claims.sub !== "string"
  ) {
    return false;
  }
  if (claims.scope === "publish") return claims.sub === "web";
  return (
    claims.scope === "connect" &&
    (claims.role === "dm" || claims.role === "player")
  );
}

export async function verifyPartyKitToken(
  token: string,
  secret: string,
  options: { now?: number; scope?: PartyKitTokenClaims["scope"] } = {},
): Promise<PartyKitTokenClaims | null> {
  try {
    const [payload, signature, extra] = token.split(".");
    if (!payload || !signature || extra !== undefined) return null;

    const validSignature = await crypto.subtle.verify(
      "HMAC",
      await hmacKey(secret, ["verify"]),
      decodeBase64Url(signature),
      encoder.encode(payload),
    );
    if (!validSignature) return null;

    const claims: unknown = JSON.parse(
      new TextDecoder().decode(decodeBase64Url(payload)),
    );
    if (!isClaims(claims)) return null;
    if (options.scope && claims.scope !== options.scope) return null;

    const nowSeconds = Math.floor((options.now ?? Date.now()) / 1000);
    return claims.exp > nowSeconds ? claims : null;
  } catch {
    return null;
  }
}
