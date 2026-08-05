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
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@tablekeep/ui/components/drawer";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@tablekeep/ui/components/empty";
import { Input } from "@tablekeep/ui/components/input";
import { Spinner } from "@tablekeep/ui/components/spinner";

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
      kind: (props.query.kind as "class" | "subclass" | "all") ?? "class",
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
      kind: (props.query.kind as "species" | "subspecies" | "all") ?? "species",
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
  const filterCount = useMemo(
    () =>
      [
        query.kind && !["class", "species", "mundane"].includes(query.kind),
        query.level !== undefined,
        query.crMin !== undefined,
        query.crMax !== undefined,
        query.acMin !== undefined,
        query.acMax !== undefined,
      ].filter(Boolean).length,
    [query],
  );

  return (
    <>
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-[10px] text-tk-ember uppercase tracking-[0.18em]">
            Rules field guide
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <h1 className="font-semibold text-3xl tracking-[-0.04em] sm:text-4xl">
              {meta.title}
            </h1>
            <span className="rounded-full bg-muted px-2.5 py-1 font-mono text-muted-foreground text-xs tabular-nums">
              {count}
            </span>
          </div>
          <p className="mt-2 max-w-xl text-muted-foreground">
            {meta.description}
          </p>
        </div>
        <fieldset className="inline-flex w-fit rounded-xl border bg-card p-1">
          <legend className="sr-only">Choose a view</legend>
          <Button
            size="sm"
            variant={query.view === "cards" ? "secondary" : "ghost"}
            aria-pressed={query.view === "cards"}
            onClick={() => update({ view: null, page: null, limit: null })}
          >
            <IconCards />
            Cards
          </Button>
          <Button
            size="sm"
            variant={query.view === "table" ? "secondary" : "ghost"}
            aria-pressed={query.view === "table"}
            onClick={() => update({ view: "table", page: 1 })}
          >
            <IconList />
            Table
          </Button>
        </fieldset>
      </header>
      <div className="mt-8 flex flex-col gap-3 rounded-2xl border bg-card p-3 shadow-sm sm:p-4">
        <div className="flex gap-2">
          <label htmlFor="wiki-search" className="relative flex-1">
            <span className="sr-only">Search {meta.title.toLowerCase()}</span>
            <IconSearch className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="wiki-search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={`Search ${meta.title.toLowerCase()}…`}
              className="h-11 pr-10 pl-9"
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
          <div className="sm:hidden">
            <MobileFilters
              category={category}
              query={query}
              filterCount={filterCount}
            />
          </div>
        </div>
        <div className="hidden items-end gap-3 sm:flex">
          <FilterFields category={category} query={query} />
          <ClearFiltersButton compact />
        </div>
      </div>
    </>
  );
}

function MobileFilters({
  category,
  query,
  filterCount,
}: {
  category: WikiCategory;
  query: WikiQueryState;
  filterCount: number;
}) {
  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="outline" className="h-11">
          <IconFilter />
          <span>Filters</span>
          {filterCount > 0 ? (
            <span className="rounded-full bg-primary px-1.5 text-primary-foreground text-xs">
              {filterCount}
            </span>
          ) : null}
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Filters</DrawerTitle>
          <DrawerDescription>
            Narrow this list to what you need.
          </DrawerDescription>
        </DrawerHeader>
        <div className="space-y-4 overflow-y-auto px-4 pb-2">
          <FilterFields category={category} query={query} />
        </div>
        <DrawerFooter>
          <DrawerClose asChild>
            <Button>Done</Button>
          </DrawerClose>
          <ClearFiltersButton />
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

function FilterFields({
  category,
  query,
}: {
  category: WikiCategory;
  query: WikiQueryState;
}) {
  const update = useUrlUpdate();
  const selectClass =
    "h-11 rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";
  if (category === "classes" || category === "species") {
    const base = category === "classes" ? "class" : "species";
    const child = category === "classes" ? "subclass" : "subspecies";
    return (
      <label className="flex min-w-44 flex-1 flex-col gap-1.5 font-medium text-xs">
        Kind
        <select
          className={selectClass}
          value={query.kind ?? base}
          onChange={(event) =>
            update({
              kind: event.target.value === base ? null : event.target.value,
              page: null,
            })
          }
        >
          <option value={base}>
            {category === "classes" ? "Classes" : "Species"}
          </option>
          <option value={child}>
            {category === "classes" ? "Subclasses" : "Subspecies"}
          </option>
          <option value="all">All</option>
        </select>
      </label>
    );
  }
  if (category === "items")
    return (
      <label className="flex min-w-44 flex-1 flex-col gap-1.5 font-medium text-xs">
        Kind
        <select
          className={selectClass}
          value={query.kind ?? "mundane"}
          onChange={(event) =>
            update({
              kind:
                event.target.value === "mundane" ? null : event.target.value,
              page: null,
            })
          }
        >
          <option value="mundane">Everyday items</option>
          <option value="magic">Magic items</option>
        </select>
      </label>
    );
  if (category === "spells")
    return (
      <label className="flex min-w-44 flex-1 flex-col gap-1.5 font-medium text-xs">
        Level
        <select
          className={selectClass}
          value={query.level ?? ""}
          onChange={(event) =>
            update({ level: event.target.value || null, page: null })
          }
        >
          <option value="">All levels</option>
          <option value="0">Cantrips</option>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((level) => (
            <option key={level} value={level}>
              Level {level}
            </option>
          ))}
        </select>
      </label>
    );
  if (category === "creatures")
    return (
      <div className="grid flex-1 grid-cols-2 gap-3 lg:grid-cols-4">
        {(
          [
            ["crMin", "Min CR"],
            ["crMax", "Max CR"],
            ["acMin", "Min AC"],
            ["acMax", "Max AC"],
          ] as const
        ).map(([key, label]) => (
          <label
            htmlFor={`wiki-filter-${key}`}
            key={key}
            className="flex flex-col gap-1.5 font-medium text-xs"
          >
            {label}
            <Input
              id={`wiki-filter-${key}`}
              type="number"
              min="0"
              step={key.startsWith("cr") ? "0.125" : "1"}
              className="h-11"
              value={query[key] ?? ""}
              onChange={(event) =>
                update({ [key]: event.target.value || null, page: null })
              }
            />
          </label>
        ))}
      </div>
    );
  return (
    <p className="flex-1 self-center text-muted-foreground text-sm">
      Search by name to narrow this list.
    </p>
  );
}

function ClearFiltersButton({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const view = params.get("view");
  return (
    <Button
      variant="ghost"
      size={compact ? "sm" : "default"}
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
