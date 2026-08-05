"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  IconCards,
  IconFilter,
  IconList,
  IconSearch,
  IconX,
} from "@tabler/icons-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Button } from "@tablekeep/ui/components/button";
import { ButtonGroup } from "@tablekeep/ui/components/button-group";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@tablekeep/ui/components/empty";
import {
  createFilter,
  type Filter,
  type FilterFieldConfig,
  Filters,
} from "@tablekeep/ui/components/filters";
import { Input } from "@tablekeep/ui/components/input";
import { Spinner } from "@tablekeep/ui/components/spinner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@tablekeep/ui/components/tooltip";

import {
  WIKI_CATEGORY_META,
  type WikiCategory,
  type WikiItemKind,
  type WikiListItem,
} from "@/lib/wiki/catalog";
import type { WikiQueryState } from "@/lib/wiki/query-state";
import { api } from "@/trpc/react";
import type { WikiPage } from "@/types/wiki";

import { WikiCard, WikiTableView } from "./wiki-list-display";

type InfiniteResult = {
  data?: { pages: WikiPage<WikiListItem>[] };
  error: unknown;
  fetchNextPage: () => Promise<unknown>;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  refetch: () => Promise<unknown>;
};

function nextPage(lastPage: WikiPage<WikiListItem>) {
  return lastPage.pageInfo.hasNextPage ? lastPage.pageInfo.page + 1 : undefined;
}

function ClassesCatalog(props: CatalogProps) {
  const result = api.wiki.classes.list.useInfiniteQuery(
    {
      limit: 20,
      name: props.query.q || undefined,
      kind: (props.query.kind as "class" | "subclass" | "all") ?? "all",
    },
    {
      enabled: props.query.view === "cards",
      initialCursor: 1,
      getNextPageParam: nextPage,
    },
  );
  return <CatalogResults {...props} infinite={result as InfiniteResult} />;
}

function SpeciesCatalog(props: CatalogProps) {
  const result = api.wiki.species.list.useInfiniteQuery(
    {
      limit: 20,
      name: props.query.q || undefined,
      kind: (props.query.kind as "species" | "subspecies" | "all") ?? "all",
    },
    {
      enabled: props.query.view === "cards",
      initialCursor: 1,
      getNextPageParam: nextPage,
    },
  );
  return <CatalogResults {...props} infinite={result as InfiniteResult} />;
}

function SpellsCatalog(props: CatalogProps) {
  const result = api.wiki.spells.list.useInfiniteQuery(
    { limit: 20, name: props.query.q || undefined, level: props.query.level },
    {
      enabled: props.query.view === "cards",
      initialCursor: 1,
      getNextPageParam: nextPage,
    },
  );
  return <CatalogResults {...props} infinite={result as InfiniteResult} />;
}

function CreaturesCatalog(props: CatalogProps) {
  const result = api.wiki.creatures.list.useInfiniteQuery(
    {
      limit: 20,
      name: props.query.q || undefined,
      challengeRatingMin: props.query.crMin,
      challengeRatingMax: props.query.crMax,
      armorClassMin: props.query.acMin,
      armorClassMax: props.query.acMax,
    },
    {
      enabled: props.query.view === "cards",
      initialCursor: 1,
      getNextPageParam: nextPage,
    },
  );
  return <CatalogResults {...props} infinite={result as InfiniteResult} />;
}

function BackgroundsCatalog(props: CatalogProps) {
  const result = api.wiki.backgrounds.list.useInfiniteQuery(
    { limit: 20, name: props.query.q || undefined },
    {
      enabled: props.query.view === "cards",
      initialCursor: 1,
      getNextPageParam: nextPage,
    },
  );
  return <CatalogResults {...props} infinite={result as InfiniteResult} />;
}

function FeatsCatalog(props: CatalogProps) {
  const result = api.wiki.feats.list.useInfiniteQuery(
    { limit: 20, name: props.query.q || undefined },
    {
      enabled: props.query.view === "cards",
      initialCursor: 1,
      getNextPageParam: nextPage,
    },
  );
  return <CatalogResults {...props} infinite={result as InfiniteResult} />;
}

function RulesCatalog(props: CatalogProps) {
  const result = api.wiki.rules.list.useInfiniteQuery(
    { limit: 20, name: props.query.q || undefined },
    {
      enabled: props.query.view === "cards",
      initialCursor: 1,
      getNextPageParam: nextPage,
    },
  );
  return <CatalogResults {...props} infinite={result as InfiniteResult} />;
}

function MundaneItemsCatalog(props: CatalogProps) {
  const result = api.wiki.items.list.useInfiniteQuery(
    { limit: 20, name: props.query.q || undefined },
    {
      enabled: props.query.view === "cards",
      initialCursor: 1,
      getNextPageParam: nextPage,
    },
  );
  return (
    <CatalogResults
      {...props}
      itemKind="mundane"
      infinite={result as InfiniteResult}
    />
  );
}

function MagicItemsCatalog(props: CatalogProps) {
  const result = api.wiki.magicItems.list.useInfiniteQuery(
    { limit: 20, name: props.query.q || undefined },
    {
      enabled: props.query.view === "cards",
      initialCursor: 1,
      getNextPageParam: nextPage,
    },
  );
  return (
    <CatalogResults
      {...props}
      itemKind="magic"
      infinite={result as InfiniteResult}
    />
  );
}

type CatalogProps = {
  category: WikiCategory;
  query: WikiQueryState;
  initialPage: WikiPage<WikiListItem>;
};

export function WikiCatalog(props: CatalogProps) {
  switch (props.category) {
    case "classes":
      return <ClassesCatalog {...props} />;
    case "species":
      return <SpeciesCatalog {...props} />;
    case "spells":
      return <SpellsCatalog {...props} />;
    case "creatures":
      return <CreaturesCatalog {...props} />;
    case "backgrounds":
      return <BackgroundsCatalog {...props} />;
    case "feats":
      return <FeatsCatalog {...props} />;
    case "rules":
      return <RulesCatalog {...props} />;
    case "items":
      return props.query.kind === "magic" ? (
        <MagicItemsCatalog {...props} />
      ) : (
        <MundaneItemsCatalog {...props} />
      );
  }
}

function CatalogResults({
  category,
  query,
  initialPage,
  infinite,
  itemKind,
}: CatalogProps & { infinite: InfiniteResult; itemKind?: WikiItemKind }) {
  const meta = WIKI_CATEGORY_META[category];
  const items =
    query.view === "cards"
      ? (infinite.data?.pages ?? [initialPage]).flatMap((page) => page.items)
      : initialPage.items;
  const sentinel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = sentinel.current;
    if (!node || query.view !== "cards" || !infinite.hasNextPage) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && !infinite.isFetchingNextPage)
          void infinite.fetchNextPage();
      },
      { rootMargin: "320px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [
    infinite.fetchNextPage,
    infinite.hasNextPage,
    infinite.isFetchingNextPage,
    query.view,
  ]);

  return (
    <main className="relative mx-auto flex w-full max-w-[92rem] flex-1 flex-col px-4 py-8 sm:px-6 sm:py-10 lg:px-10">
      <CatalogHeader
        category={category}
        query={query}
        count={initialPage.pageInfo.count}
      />
      <div className="mt-7 pb-14">
        {infinite.error && query.view === "cards" ? (
          <Empty className="border bg-card">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <IconX />
              </EmptyMedia>
              <EmptyTitle>Could not load {meta.title.toLowerCase()}</EmptyTitle>
              <EmptyDescription>
                The rules service did not answer. Try again.
              </EmptyDescription>
            </EmptyHeader>
            <Button onClick={() => void infinite.refetch()}>Try again</Button>
          </Empty>
        ) : items.length === 0 ? (
          <Empty className="border bg-card">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <IconSearch />
              </EmptyMedia>
              <EmptyTitle>No {meta.title.toLowerCase()} found</EmptyTitle>
              <EmptyDescription>
                Try a shorter search or clear the filters.
              </EmptyDescription>
            </EmptyHeader>
            <ClearFiltersButton />
          </Empty>
        ) : query.view === "cards" ? (
          <>
            <ul className="grid items-stretch gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {items.map((item, index) => (
                <li key={item.key}>
                  <WikiCard
                    category={category}
                    item={item}
                    itemKind={itemKind}
                    priority={index < 3}
                  />
                </li>
              ))}
            </ul>
            <div
              ref={sentinel}
              className="flex min-h-28 items-center justify-center pt-8"
            >
              {infinite.isFetchingNextPage ? (
                <span className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Spinner />
                  Loading more…
                </span>
              ) : infinite.hasNextPage ? (
                <Button
                  variant="outline"
                  onClick={() => void infinite.fetchNextPage()}
                >
                  Load more
                </Button>
              ) : (
                <p className="font-mono text-muted-foreground text-xs uppercase tracking-[0.14em]">
                  End of the list
                </p>
              )}
            </div>
          </>
        ) : (
          <>
            <WikiTableView
              category={category}
              items={items}
              itemKind={itemKind}
            />
            <TablePagination query={query} pageInfo={initialPage.pageInfo} />
          </>
        )}
      </div>
    </main>
  );
}

function useUrlUpdate() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  return useCallback(
    (changes: Record<string, string | number | null>) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(changes))
        value === null || value === ""
          ? next.delete(key)
          : next.set(key, String(value));
      const suffix = next.toString();
      router.replace(suffix ? `${pathname}?${suffix}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );
}

function CatalogHeader({
  category,
  query,
  count,
}: {
  category: WikiCategory;
  query: WikiQueryState;
  count: number;
}) {
  const meta = WIKI_CATEGORY_META[category];
  const update = useUrlUpdate();
  const [search, setSearch] = useState(query.q);
  useEffect(() => setSearch(query.q), [query.q]);
  useEffect(() => {
    if (search.trim() === query.q) return;
    const timeout = window.setTimeout(
      () => update({ q: search.trim() || null, page: null }),
      300,
    );
    return () => window.clearTimeout(timeout);
  }, [query.q, search, update]);
  const fields = useMemo(() => filterFieldsFor(category), [category]);
  const filters = useMemo(
    () => filtersFromQuery(category, query),
    [category, query],
  );
  const onFiltersChange = useCallback(
    (nextFilters: Filter<string>[]) => {
      const changes: Record<string, string | number | null> = {
        kind: null,
        level: null,
        crMin: null,
        crMax: null,
        acMin: null,
        acMax: null,
        page: null,
      };
      for (const filter of nextFilters) {
        const value = filter.values[0];
        if (value !== undefined && value !== "") changes[filter.field] = value;
      }
      update(changes);
    },
    [update],
  );

  return (
    <>
      <header>
        <div>
          <p className="font-mono text-[10px] text-tk-ember uppercase tracking-[0.18em]">
            Rules field guide
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <h1 className="font-semibold text-3xl tracking-[-0.04em] sm:text-4xl">
              {meta.title}
            </h1>
            <span className="rounded-full border bg-card px-2.5 py-1 font-mono text-muted-foreground text-xs tabular-nums shadow-xs">
              {count.toLocaleString()} entries
            </span>
          </div>
          <p className="mt-2 max-w-xl text-muted-foreground">
            {meta.description}
          </p>
        </div>
      </header>
      <div className="mt-8 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="w-full rounded-xl border bg-card p-1.5 shadow-sm lg:max-w-md">
          <label htmlFor="wiki-search" className="relative block">
            <span className="sr-only">Search {meta.title.toLowerCase()}</span>
            <IconSearch className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="wiki-search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={`Search ${meta.title.toLowerCase()}…`}
              className="h-10 border-0 bg-transparent pr-10 pl-9 shadow-none focus-visible:ring-0"
            />
            {search ? (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => setSearch("")}
                className="absolute top-1/2 right-2 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <IconX className="size-4" />
              </button>
            ) : null}
          </label>
        </div>
        <div className="flex flex-wrap items-start gap-3 lg:justify-end">
          {fields.length ? (
            <div className="rounded-xl border bg-card p-1.5 shadow-sm">
              <Filters
                filters={filters}
                fields={fields}
                onChange={onFiltersChange}
                allowMultiple={false}
                showSearchInput={false}
                size="sm"
                trigger={
                  <Button variant="ghost" className="h-9">
                    <IconFilter />
                    Filters
                    {filters.length ? (
                      <span className="grid min-w-5 place-items-center rounded-full bg-primary px-1.5 text-[10px] text-primary-foreground tabular-nums">
                        {filters.length}
                      </span>
                    ) : null}
                  </Button>
                }
              />
            </div>
          ) : null}
          <TooltipProvider>
            <fieldset className="rounded-xl border bg-card p-1.5 shadow-sm">
              <legend className="sr-only">Choose a view</legend>
              <ButtonGroup>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="icon-lg"
                      variant={query.view === "cards" ? "secondary" : "ghost"}
                      aria-label="Card view"
                      aria-pressed={query.view === "cards"}
                      onClick={() =>
                        update({ view: null, page: null, limit: null })
                      }
                    >
                      <IconCards />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">Card view</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="icon-lg"
                      variant={query.view === "table" ? "secondary" : "ghost"}
                      aria-label="Table view"
                      aria-pressed={query.view === "table"}
                      onClick={() => update({ view: "table", page: 1 })}
                    >
                      <IconList />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">Table view</TooltipContent>
                </Tooltip>
              </ButtonGroup>
            </fieldset>
          </TooltipProvider>
        </div>
      </div>
    </>
  );
}

function filterFieldsFor(category: WikiCategory): FilterFieldConfig<string>[] {
  if (category === "classes")
    return [
      {
        key: "kind",
        label: "Kind",
        type: "select",
        searchable: false,
        options: [
          { value: "class", label: "Classes" },
          { value: "subclass", label: "Subclasses" },
        ],
      },
    ];
  if (category === "species")
    return [
      {
        key: "kind",
        label: "Kind",
        type: "select",
        searchable: false,
        options: [
          { value: "species", label: "Species" },
          { value: "subspecies", label: "Subspecies" },
        ],
      },
    ];
  if (category === "items")
    return [
      {
        key: "kind",
        label: "Kind",
        type: "select",
        searchable: false,
        options: [
          { value: "mundane", label: "Everyday items" },
          { value: "magic", label: "Magic items" },
        ],
      },
    ];
  if (category === "spells")
    return [
      {
        key: "level",
        label: "Level",
        type: "select",
        searchable: false,
        options: [
          { value: "0", label: "Cantrips" },
          ...[1, 2, 3, 4, 5, 6, 7, 8, 9].map((level) => ({
            value: String(level),
            label: `Level ${level}`,
          })),
        ],
      },
    ];
  if (category === "creatures")
    return [
      { key: "crMin", label: "Minimum CR", type: "text", placeholder: "0" },
      { key: "crMax", label: "Maximum CR", type: "text", placeholder: "30" },
      { key: "acMin", label: "Minimum AC", type: "text", placeholder: "0" },
      { key: "acMax", label: "Maximum AC", type: "text", placeholder: "30" },
    ];
  return [];
}

function filtersFromQuery(category: WikiCategory, query: WikiQueryState) {
  const filters: Filter<string>[] = [];
  if (query.kind && category !== "items")
    filters.push(createFilter("kind", "is", [query.kind]));
  if (category === "items" && query.kind === "magic")
    filters.push(createFilter("kind", "is", ["magic"]));
  if (query.level !== undefined)
    filters.push(createFilter("level", "is", [String(query.level)]));
  for (const key of ["crMin", "crMax", "acMin", "acMax"] as const) {
    if (query[key] !== undefined)
      filters.push(createFilter(key, "is", [String(query[key])]));
  }
  return filters;
}

function ClearFiltersButton() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const view = params.get("view");
  return (
    <Button
      variant="ghost"
      onClick={() =>
        router.replace(view === "table" ? `${pathname}?view=table` : pathname, {
          scroll: false,
        })
      }
    >
      Clear filters
    </Button>
  );
}

function TablePagination({
  query,
  pageInfo,
}: {
  query: WikiQueryState;
  pageInfo: WikiPage<WikiListItem>["pageInfo"];
}) {
  const update = useUrlUpdate();
  const searchParams = useSearchParams();
  const totalPages = Math.max(1, Math.ceil(pageInfo.count / query.limit));
  return (
    <div className="mt-5 flex flex-col items-center justify-between gap-3 sm:flex-row">
      <label className="flex items-center gap-2 text-muted-foreground text-sm">
        Rows
        <select
          className="h-9 rounded-lg border bg-card px-2 text-foreground"
          value={query.limit}
          onChange={(event) => update({ limit: event.target.value, page: 1 })}
        >
          <option value="10">10</option>
          <option value="20">20</option>
          <option value="50">50</option>
        </select>
      </label>
      <p className="font-mono text-muted-foreground text-xs">
        Page {Math.min(query.page, totalPages)} of {totalPages}
      </p>
      <div className="flex gap-2">
        <Button
          variant="outline"
          disabled={query.page <= 1}
          asChild={query.page > 1}
        >
          {query.page > 1 ? (
            <Link
              href={{
                query: Object.fromEntries([
                  ...searchParams.entries(),
                  ["page", "1"],
                ]),
              }}
            >
              First
            </Link>
          ) : (
            <span>First</span>
          )}
        </Button>
        <Button
          variant="outline"
          disabled={query.page <= 1}
          asChild={query.page > 1}
        >
          {query.page > 1 ? (
            <Link
              href={{
                query: Object.fromEntries([
                  ...searchParams.entries(),
                  ["page", String(query.page - 1)],
                ]),
              }}
            >
              Previous
            </Link>
          ) : (
            <span>Previous</span>
          )}
        </Button>
        <Button
          variant="outline"
          disabled={query.page >= totalPages}
          asChild={query.page < totalPages}
        >
          {query.page < totalPages ? (
            <Link
              href={{
                query: Object.fromEntries([
                  ...searchParams.entries(),
                  ["page", String(query.page + 1)],
                ]),
              }}
            >
              Next
            </Link>
          ) : (
            <span>Next</span>
          )}
        </Button>
        <Button
          variant="outline"
          disabled={query.page >= totalPages}
          asChild={query.page < totalPages}
        >
          {query.page < totalPages ? (
            <Link
              href={{
                query: Object.fromEntries([
                  ...searchParams.entries(),
                  ["page", String(totalPages)],
                ]),
              }}
            >
              Last
            </Link>
          ) : (
            <span>Last</span>
          )}
        </Button>
      </div>
    </div>
  );
}
