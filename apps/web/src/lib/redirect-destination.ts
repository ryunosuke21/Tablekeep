export const NEXT_PARAM = "next";

const NON_DESTINATIONS = new Set(["/sign-in", "/new-profile"]);

/**
 * Control characters are rejected without a regex so the check stays readable
 * and lint-clean; `\r` and `\n` in particular must never reach a Location header.
 */
function hasControlCharacters(value: string): boolean {
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);

    if (code <= 0x1f || code === 0x7f) {
      return true;
    }
  }

  return false;
}

export function safeDestination(
  candidate: string | null | undefined,
): string | null {
  if (!candidate?.startsWith("/") || candidate.startsWith("//")) {
    return null;
  }

  if (candidate.includes("\\")) {
    return null;
  }

  let decoded: string;
  try {
    decoded = decodeURIComponent(candidate);
  } catch {
    return null;
  }
  if (
    decoded.startsWith("//") ||
    decoded.includes("\\") ||
    hasControlCharacters(decoded)
  ) {
    return null;
  }

  const pathname = decoded.split(/[?#]/, 1)[0];
  if (!pathname || NON_DESTINATIONS.has(pathname)) {
    return null;
  }

  return candidate;
}

export function withDestination(
  target: string,
  destination: string | null,
): string {
  const safe = safeDestination(destination);
  if (!safe) {
    return target;
  }

  const separator = target.includes("?") ? "&" : "?";
  return `${target}${separator}${NEXT_PARAM}=${encodeURIComponent(safe)}`;
}

export function readDestination(
  params: URLSearchParams | Record<string, string | string[] | undefined>,
): string | null {
  const candidate =
    params instanceof URLSearchParams
      ? params.get(NEXT_PARAM)
      : params[NEXT_PARAM];

  return safeDestination(Array.isArray(candidate) ? candidate[0] : candidate);
}
