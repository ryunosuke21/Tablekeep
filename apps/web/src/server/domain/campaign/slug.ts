const DIACRITICS = /[\u0300-\u036f]/g;
const NON_SLUG_CHARACTERS = /[^a-z0-9]+/g;
const EDGE_HYPHENS = /^-+|-+$/g;

export const MAX_CAMPAIGN_SLUG_LENGTH = 80;

/** Derive the stable, human-readable portion of a campaign slug. */
export function slugifyCampaignName(name: string): string {
  const slug = name
    .normalize("NFKD")
    .replace(DIACRITICS, "")
    .toLowerCase()
    .replace(NON_SLUG_CHARACTERS, "-")
    .replace(EDGE_HYPHENS, "")
    .slice(0, MAX_CAMPAIGN_SLUG_LENGTH)
    .replace(/-+$/, "");

  return slug || "campaign";
}

/**
 * Add a collision suffix without allowing the result to exceed the slug limit.
 * The persistence layer decides when a suffix is necessary and supplies it.
 */
export function deriveCampaignSlug(name: string, suffix?: string): string {
  const base = slugifyCampaignName(name);
  if (!suffix) return base;

  const normalizedSuffix = slugifyCampaignName(suffix);
  const availableBaseLength =
    MAX_CAMPAIGN_SLUG_LENGTH - normalizedSuffix.length - 1;
  const truncatedBase = base
    .slice(0, Math.max(1, availableBaseLength))
    .replace(/-+$/, "");
  return `${truncatedBase}-${normalizedSuffix}`;
}
