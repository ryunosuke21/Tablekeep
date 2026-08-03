import { createRandomStringGenerator } from "@better-auth/utils/random";

export const INVITE_CODE_LENGTH = 10;
export const INVITE_CODE_DISPLAY_PATTERN = /^([A-Z0-9]{5})([A-Z0-9]{5})$/;

const AMBIGUOUS_GLYPHS = /[O0I1]/;
const generateCandidate = createRandomStringGenerator("A-Z", "0-9");

export function normalizeInviteCode(input: string): string {
  return input
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

export function formatInviteCode(input: string): string {
  const normalized = normalizeInviteCode(input);
  return normalized.replace(INVITE_CODE_DISPLAY_PATTERN, "$1-$2");
}

export function generateInviteCode(): string {
  for (let attempt = 0; attempt < 10; attempt++) {
    const candidate = generateCandidate(INVITE_CODE_LENGTH);
    if (!AMBIGUOUS_GLYPHS.test(candidate)) return candidate;
  }

  throw new Error("Could not generate an unambiguous invite code");
}
