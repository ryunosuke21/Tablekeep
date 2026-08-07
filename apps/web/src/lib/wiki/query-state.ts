import type { WikiView } from "@/lib/wiki/catalog";

/** Selected facet values, keyed by facet. Everything is off by default. */
export type WikiFilterState = Record<string, string[]>;

export type WikiQueryState = {
  q: string;
  view: WikiView;
  sort: string;
  filters: WikiFilterState;
};

const FILTER_PREFIX = "f.";

export const EMPTY_WIKI_QUERY: WikiQueryState = {
  q: "",
  view: "index",
  sort: "name",
  filters: {},
};

export function parseWikiQuery(params: URLSearchParams): WikiQueryState {
  const filters: WikiFilterState = {};
  for (const [key, value] of params.entries()) {
    if (!key.startsWith(FILTER_PREFIX)) continue;
    const selected = value.split(",").filter(Boolean);
    if (selected.length) filters[key.slice(FILTER_PREFIX.length)] = selected;
  }

  return {
    q: params.get("q")?.slice(0, 100) ?? "",
    view: params.get("view") === "cards" ? "cards" : "index",
    sort: params.get("sort") || "name",
    filters,
  };
}

export function serializeWikiQuery(query: WikiQueryState) {
  const params = new URLSearchParams();
  if (query.q.trim()) params.set("q", query.q.trim());
  if (query.view !== EMPTY_WIKI_QUERY.view) params.set("view", query.view);
  if (query.sort !== EMPTY_WIKI_QUERY.sort) params.set("sort", query.sort);
  for (const [facet, values] of Object.entries(query.filters)) {
    if (values.length) params.set(`${FILTER_PREFIX}${facet}`, values.join(","));
  }
  return params.toString();
}

export function toggleFilterValue(
  filters: WikiFilterState,
  facet: string,
  value: string,
): WikiFilterState {
  const current = filters[facet] ?? [];
  const next = current.includes(value)
    ? current.filter((entry) => entry !== value)
    : [...current, value];
  const { [facet]: _removed, ...rest } = filters;
  return next.length ? { ...rest, [facet]: next } : rest;
}

export function countActiveFilters(filters: WikiFilterState) {
  return Object.values(filters).reduce(
    (total, values) => total + values.length,
    0,
  );
}
