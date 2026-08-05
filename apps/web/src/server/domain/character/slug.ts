const DIACRITICS = /[\u0300-\u036f]/g;
const NON_SLUG_CHARACTERS = /[^a-z0-9]+/g;
const EDGE_HYPHENS = /^-+|-+$/g;

export const MAX_CHARACTER_SLUG_LENGTH = 100;

export function slugifyCharacterName(name: string): string {
  const slug = name
    .normalize("NFKD")
    .replace(DIACRITICS, "")
    .toLowerCase()
    .replace(NON_SLUG_CHARACTERS, "-")
    .replace(EDGE_HYPHENS, "")
    .slice(0, MAX_CHARACTER_SLUG_LENGTH)
    .replace(/-+$/, "");

  return slug || "character";
}

export function deriveCharacterSlug(name: string, suffix: string): string {
  const normalizedSuffix = slugifyCharacterName(suffix);
  const available = MAX_CHARACTER_SLUG_LENGTH - normalizedSuffix.length - 1;
  const base = slugifyCharacterName(name)
    .slice(0, Math.max(1, available))
    .replace(/-+$/, "");
  return `${base}-${normalizedSuffix}`;
}
