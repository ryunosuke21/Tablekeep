"use client";

import { useCallback, useDeferredValue, useMemo, useState } from "react";
import { IconMoodEmpty, IconPlugConnectedX } from "@tabler/icons-react";
import { useSearchParams } from "next/navigation";

import { Button } from "@tablekeep/ui/components/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@tablekeep/ui/components/empty";
import { Skeleton } from "@tablekeep/ui/components/skeleton";

import {
  WIKI_CATEGORY_META,
  type WikiCategory,
  type WikiListItem,
  wikiAccentStyle,
} from "@/lib/wiki/catalog";
import {
  facetsFor,
  matchesSearch,
  searchTerms,
  searchTextOf,
  sortsFor,
  type WikiFacet,
} from "@/lib/wiki/facets";
import {
  EMPTY_WIKI_QUERY,
  parseWikiQuery,
  serializeWikiQuery,
  type WikiFilterState,
  type WikiQueryState,
} from "@/lib/wiki/query-state";
import { api } from "@/trpc/react";
import type { WikiSource } from "@/types/wiki";

import { type FacetOptions, WikiControls } from "./wiki-controls";
import { groupEntries, WikiResults } from "./wiki-results";

/** Catalogs change about as often as a rules printing, so hold them for the session. */
const CATALOG_QUERY_OPTIONS = {
  staleTime: 60 * 60 * 1000,
  gcTime: 60 * 60 * 1000,
  refetchOnWindowFocus: false,
} as const;

type CatalogData = {
  items: WikiListItem[];
  sources: WikiSource[];
  isPending: boolean;
  isError: boolean;
  refetch: () => void;
};

/**
 * Reads the whole category in one request. Every hook runs on every render and
 * only the active category is enabled, so the browser holds the full catalog
 * and no filter ever costs a round trip.
 */
function useWikiCatalog(category: WikiCategory): CatalogData {
  const enabledFor = (target: WikiCategory) => ({
    ...CATALOG_QUERY_OPTIONS,
    enabled: category === target,
  });

  const species = api.wiki.species.catalog.useQuery(
    undefined,
    enabledFor("species"),
  );
  const backgrounds = api.wiki.backgrounds.catalog.useQuery(
    undefined,
    enabledFor("backgrounds"),
  );
  const classes = api.wiki.classes.catalog.useQuery(
    undefined,
    enabledFor("classes"),
  );
  const spells = api.wiki.spells.catalog.useQuery(
    undefined,
    enabledFor("spells"),
  );
  const creatures = api.wiki.creatures.catalog.useQuery(
    undefined,
    enabledFor("creatures"),
  );
  const feats = api.wiki.feats.catalog.useQuery(undefined, enabledFor("feats"));
  const rules = api.wiki.rules.catalog.useQuery(undefined, enabledFor("rules"));
  const gear = api.wiki.items.catalog.useQuery(undefined, enabledFor("items"));
  const magicItems = api.wiki.magicItems.catalog.useQuery(
    undefined,
    enabledFor("items"),
  );

  return useMemo(() => {
    if (category === "items") {
      const sources = new Map<string, WikiSource>();
      for (const source of [
        ...(gear.data?.sources ?? []),
        ...(magicItems.data?.sources ?? []),
      ])
        sources.set(source.key, source);
      return {
        items: [...(gear.data?.items ?? []), ...(magicItems.data?.items ?? [])],
        sources: [...sources.values()],
        isPending: gear.isPending || magicItems.isPending,
        isError: gear.isError || magicItems.isError,
        refetch: () => {
          void gear.refetch();
          void magicItems.refetch();
        },
      };
    }

    const query = {
      species,
      backgrounds,
      classes,
      spells,
      creatures,
      feats,
      rules,
      items: gear,
    }[category];

    return {
      items: query.data?.items ?? [],
      sources: query.data?.sources ?? [],
      isPending: query.isPending,
      isError: query.isError,
      refetch: () => void query.refetch(),
    };
  }, [
    backgrounds,
    category,
    classes,
    creatures,
    feats,
    gear,
    magicItems,
    rules,
    species,
    spells,
  ]);
}

type IndexedEntry = {
  item: WikiListItem;
  text: string;
  values: Map<string, string[]>;
};

function passesFilters(
  entry: IndexedEntry,
  filters: WikiFilterState,
  ignoredFacet?: string,
) {
  for (const [facet, selected] of Object.entries(filters)) {
    if (!selected.length || facet === ignoredFacet) continue;
    const values = entry.values.get(facet);
    if (!values?.some((value) => selected.includes(value))) return false;
  }
  return true;
}

function buildOptions(
  facets: WikiFacet[],
  labels: Map<string, Map<string, string>>,
  searched: IndexedEntry[],
  filters: WikiFilterState,
): FacetOptions {
  const options: FacetOptions = new Map();

  for (const facet of facets) {
    const counts = new Map<string, number>();
    for (const [value] of labels.get(facet.key) ?? []) counts.set(value, 0);
    for (const entry of searched) {
      if (!passesFilters(entry, filters, facet.key)) continue;
      for (const value of entry.values.get(facet.key) ?? [])
        counts.set(value, (counts.get(value) ?? 0) + 1);
    }

    const list = [...counts].map(([value, count]) => ({
      value,
      count,
      label: labels.get(facet.key)?.get(value) ?? value,
    }));

    list.sort((left, right) => {
      if (facet.order) {
        const leftIndex = facet.order.indexOf(left.value);
        const rightIndex = facet.order.indexOf(right.value);
        if (leftIndex !== rightIndex)
          return (
            (leftIndex === -1 ? facet.order.length : leftIndex) -
            (rightIndex === -1 ? facet.order.length : rightIndex)
          );
      }
      return right.count - left.count || left.label.localeCompare(right.label);
    });

    options.set(facet.key, list);
  }

  return options;
}

export function WikiCatalog({ category }: { category: WikiCategory }) {
  const meta = WIKI_CATEGORY_META[category];
  const catalog = useWikiCatalog(category);
  const searchParams = useSearchParams();
  const [query, setQuery] = useState<WikiQueryState>(() =>
    parseWikiQuery(new URLSearchParams(searchParams.toString())),
  );

  const update = useCallback((next: WikiQueryState) => {
    setQuery(next);
    const search = serializeWikiQuery(next);
    window.history.replaceState(
      null,
      "",
      search ? `?${search}` : window.location.pathname,
    );
  }, []);

  const sourcesByKey = useMemo(
    () => new Map(catalog.sources.map((source) => [source.key, source])),
    [catalog.sources],
  );
  const sourceLookup = useCallback(
    (key: string) => sourcesByKey.get(key),
    [sourcesByKey],
  );

  const facets = useMemo(
    () => facetsFor(category, sourceLookup),
    [category, sourceLookup],
  );
  const sorts = useMemo(() => sortsFor(category), [category]);

  const { entries, labels } = useMemo(() => {
    const labelsByFacet = new Map<string, Map<string, string>>(
      facets.map((facet) => [facet.key, new Map<string, string>()]),
    );
    const indexed = catalog.items.map((item) => {
      const values = new Map<string, string[]>();
      for (const facet of facets) {
        const facetValues = facet.valuesOf(item);
        for (const { value, label } of facetValues)
          labelsByFacet.get(facet.key)?.set(value, label);
        values.set(
          facet.key,
          facetValues.map(({ value }) => value),
        );
      }
      return {
        item,
        text: searchTextOf(category, item, sourceLookup),
        values,
      };
    });
    return { entries: indexed, labels: labelsByFacet };
  }, [catalog.items, category, facets, sourceLookup]);

  const deferred = useDeferredValue(query);
  const [defaultSort] = sorts;
  const sort =
    sorts.find((option) => option.key === deferred.sort) ?? defaultSort;

  const { groups, options, resultCount } = useMemo(() => {
    const terms = searchTerms(deferred.q);
    const searched = terms.length
      ? entries.filter((entry) => matchesSearch(entry.text, terms))
      : entries;
    const matched = searched
      .filter((entry) => passesFilters(entry, deferred.filters))
      .map((entry) => entry.item)
      .sort(sort.compare);

    return {
      groups: groupEntries(matched, sort),
      options: buildOptions(facets, labels, searched, deferred.filters),
      resultCount: matched.length,
    };
  }, [deferred.filters, deferred.q, entries, facets, labels, sort]);

  const isFiltered =
    deferred.q.trim().length > 0 ||
    Object.values(deferred.filters).some((values) => values.length > 0);

  return (
    <main
      className="mx-auto w-full max-w-[88rem] flex-1 px-4 pb-16 sm:px-6 lg:px-10"
      style={wikiAccentStyle(category)}
    >
      <header className="pt-6 pb-4 sm:pt-8">
        <p className="font-mono text-[0.65rem] text-muted-foreground uppercase tracking-[0.2em]">
          Wiki
          <span className="mx-2 text-border">/</span>
          <span className="text-[var(--wiki-accent)]">{meta.title}</span>
        </p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
          <h1 className="font-display font-semibold text-4xl leading-none tracking-[-0.02em] sm:text-5xl">
            {meta.title}
          </h1>
          <p className="font-mono text-muted-foreground text-xs tabular-nums">
            {catalog.isPending ? (
              "Loading the catalog"
            ) : isFiltered ? (
              <>
                <span className="font-medium text-foreground">
                  {resultCount.toLocaleString()}
                </span>{" "}
                of {catalog.items.length.toLocaleString()} entries
              </>
            ) : (
              <>
                <span className="font-medium text-foreground">
                  {catalog.items.length.toLocaleString()}
                </span>{" "}
                entries
              </>
            )}
          </p>
        </div>
        <p className="mt-2 max-w-xl text-muted-foreground text-sm">
          {meta.description}
        </p>
      </header>

      <WikiControls
        category={category}
        query={query}
        onChange={update}
        facets={facets}
        options={options}
        sortOptions={sorts.map(({ key, label }) => ({ key, label }))}
        resultCount={resultCount}
      />

      <div className="mt-4">
        {catalog.isError ? (
          <Empty className="rounded-xl border bg-card">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <IconPlugConnectedX />
              </EmptyMedia>
              <EmptyTitle>The rules service did not answer</EmptyTitle>
              <EmptyDescription>
                Nothing loaded for {meta.title.toLowerCase()}. Try again in a
                moment.
              </EmptyDescription>
            </EmptyHeader>
            <Button onClick={catalog.refetch}>Try again</Button>
          </Empty>
        ) : catalog.isPending ? (
          <CatalogSkeleton />
        ) : resultCount === 0 ? (
          <Empty className="rounded-xl border bg-card">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <IconMoodEmpty />
              </EmptyMedia>
              <EmptyTitle>Nothing matches yet</EmptyTitle>
              <EmptyDescription>
                Shorten the search or drop a filter to widen the list.
              </EmptyDescription>
            </EmptyHeader>
            <Button
              variant="outline"
              onClick={() => update({ ...EMPTY_WIKI_QUERY, view: query.view })}
            >
              Reset the list
            </Button>
          </Empty>
        ) : (
          <>
            <WikiResults
              category={category}
              groups={groups}
              view={deferred.view}
              sourceName={sourceLookup}
            />
            <p className="mt-10 text-center font-mono text-[0.65rem] text-muted-foreground uppercase tracking-[0.18em]">
              {resultCount.toLocaleString()} {meta.title.toLowerCase()} shown
            </p>
          </>
        )}
      </div>
    </main>
  );
}

function CatalogSkeleton() {
  return (
    <div className="space-y-2 overflow-hidden rounded-xl border bg-card p-4">
      {Array.from({ length: 12 }, (_, index) => index).map((index) => (
        <div key={index} className="flex items-center gap-4 py-1.5">
          <div className="min-w-0 flex-1 space-y-1.5">
            <Skeleton
              className="h-4"
              style={{ width: `${35 + ((index * 7) % 40)}%` }}
            />
            <Skeleton className="h-3 w-40" />
          </div>
          <Skeleton className="hidden h-4 w-32 sm:block" />
        </div>
      ))}
    </div>
  );
}
