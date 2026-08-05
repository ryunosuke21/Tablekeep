import type { WikiCategory, WikiView } from "@/lib/wiki/catalog";

export type WikiSearchParams = Record<string, string | string[] | undefined>;

export type WikiQueryState = {
  view: WikiView;
  q: string;
  page: number;
  limit: 10 | 20 | 50;
  kind?: string;
  level?: number;
  crMin?: number;
  crMax?: number;
  acMin?: number;
  acMax?: number;
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function positiveInteger(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function optionalNumber(value: string | undefined) {
  if (value === undefined || value.trim() === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

export function parseWikiQuery(
  category: WikiCategory,
  params: WikiSearchParams,
): WikiQueryState {
  const rawLimit = positiveInteger(first(params.limit), 20);
  const limit = rawLimit === 10 || rawLimit === 50 ? rawLimit : 20;
  const view = first(params.view) === "table" ? "table" : "cards";
  const q = first(params.q)?.trim().slice(0, 100) ?? "";
  const state: WikiQueryState = {
    view,
    q,
    page: view === "table" ? positiveInteger(first(params.page), 1) : 1,
    limit,
  };

  const rawKind = first(params.kind);
  if (
    category === "classes" &&
    ["class", "subclass", "all"].includes(rawKind ?? "")
  ) {
    state.kind = rawKind;
  }
  if (
    category === "species" &&
    ["species", "subspecies", "all"].includes(rawKind ?? "")
  ) {
    state.kind = rawKind;
  }
  if (category === "items") {
    state.kind = rawKind === "magic" ? "magic" : "mundane";
  }
  if (category === "spells") {
    const level = optionalNumber(first(params.level));
    if (level !== undefined && Number.isInteger(level) && level <= 9)
      state.level = level;
  }
  if (category === "creatures") {
    state.crMin = optionalNumber(first(params.crMin));
    state.crMax = optionalNumber(first(params.crMax));
    state.acMin = optionalNumber(first(params.acMin));
    state.acMax = optionalNumber(first(params.acMax));
  }

  return state;
}

export function wikiQueryKey(query: WikiQueryState) {
  return JSON.stringify(query);
}
