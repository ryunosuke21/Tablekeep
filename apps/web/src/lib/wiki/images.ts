import { WIKI_CATEGORY_META, type WikiCategory } from "@/lib/wiki/catalog";

/**
 * Artwork is opt-in and hand-added. Drop a file at
 * `public/images/wiki/<category>/<slug>.png` and the entry picks it up; every
 * entry without one falls back to its category plate.
 *
 * The slug comes from the entry name rather than its source-qualified key, so
 * one file covers the same entry across every source book: `aboleth.png` is
 * used by the 2014, 2024, Black Flag, and Menagerie aboleths alike.
 */
export const WIKI_IMAGE_EXTENSION = "png";

export function wikiImageSlug(name: string) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['\u2019]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function wikiImageSrc(category: WikiCategory, name: string) {
  const slug = wikiImageSlug(name);
  if (!slug) return wikiImageFallback(category);
  return `/images/wiki/${category}/${slug}.${WIKI_IMAGE_EXTENSION}`;
}

export function wikiImageFallback(category: WikiCategory) {
  return WIKI_CATEGORY_META[category].art;
}
