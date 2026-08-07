"use client";

import { useEffect, useRef, useState } from "react";
import {
  IconAdjustmentsHorizontal,
  IconCheck,
  IconLayoutGrid,
  IconLayoutList,
  IconSearch,
  IconX,
} from "@tabler/icons-react";

import { Badge } from "@tablekeep/ui/components/badge";
import { Button } from "@tablekeep/ui/components/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@tablekeep/ui/components/select";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@tablekeep/ui/components/sheet";
import { cn } from "@tablekeep/ui/lib/utils";

import type { WikiCategory } from "@/lib/wiki/catalog";
import { WIKI_CATEGORY_META } from "@/lib/wiki/catalog";
import type { WikiFacet } from "@/lib/wiki/facets";
import {
  countActiveFilters,
  toggleFilterValue,
  type WikiQueryState,
} from "@/lib/wiki/query-state";

export type FacetOptionCount = { value: string; label: string; count: number };
export type FacetOptions = Map<string, FacetOptionCount[]>;

export function WikiControls({
  category,
  query,
  onChange,
  facets,
  options,
  sortOptions,
  resultCount,
}: {
  category: WikiCategory;
  query: WikiQueryState;
  onChange: (next: WikiQueryState) => void;
  facets: WikiFacet[];
  options: FacetOptions;
  sortOptions: Array<{ key: string; label: string }>;
  resultCount: number;
}) {
  const meta = WIKI_CATEGORY_META[category];
  const searchRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState(query.q);
  const activeCount = countActiveFilters(query.filters);

  useEffect(() => setDraft(query.q), [query.q]);

  useEffect(() => {
    if (draft === query.q) return;
    const timeout = window.setTimeout(
      () => onChange({ ...query, q: draft }),
      140,
    );
    return () => window.clearTimeout(timeout);
  }, [draft, onChange, query]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const typing =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target?.isContentEditable;
      if (event.key === "/" && !typing) {
        event.preventDefault();
        searchRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div className="sticky top-14 z-20 -mx-4 bg-[color-mix(in_oklab,var(--muted)_28%,var(--background))] px-4 pt-2 pb-2 sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-10">
      <div className="flex items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <IconSearch className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            ref={searchRef}
            type="search"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={`Search ${meta.title.toLowerCase()}`}
            aria-label={`Search ${meta.title.toLowerCase()}`}
            className="h-11 w-full rounded-xl border bg-card pr-10 pl-9 text-base shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-[var(--wiki-accent)] focus-visible:ring-2 focus-visible:ring-[color-mix(in_oklab,var(--wiki-accent)_35%,transparent)] sm:text-sm [&::-webkit-search-cancel-button]:hidden"
          />
          {draft ? (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => setDraft("")}
              className="absolute top-1/2 right-2 grid size-7 -translate-y-1/2 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <IconX className="size-4" />
            </button>
          ) : (
            <kbd className="pointer-events-none absolute top-1/2 right-3 hidden -translate-y-1/2 rounded border bg-muted px-1.5 font-mono text-[0.65rem] text-muted-foreground sm:block">
              /
            </kbd>
          )}
        </div>

        <FilterSheet
          facets={facets}
          options={options}
          query={query}
          onChange={onChange}
          activeCount={activeCount}
          resultCount={resultCount}
          categoryTitle={meta.title.toLowerCase()}
        />

        {sortOptions.length > 1 ? (
          <Select
            value={query.sort}
            onValueChange={(sort) => onChange({ ...query, sort })}
          >
            <SelectTrigger
              size="default"
              className="h-11 w-auto gap-1.5 bg-card"
              aria-label="Sort entries"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              {sortOptions.map((option) => (
                <SelectItem key={option.key} value={option.key}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}

        <div className="hidden rounded-xl border bg-card p-0.5 shadow-xs sm:flex">
          {(
            [
              { view: "index", label: "List view", icon: IconLayoutList },
              { view: "cards", label: "Card view", icon: IconLayoutGrid },
            ] as const
          ).map(({ view, label, icon: Icon }) => (
            <button
              key={view}
              type="button"
              aria-label={label}
              aria-pressed={query.view === view}
              onClick={() => onChange({ ...query, view })}
              className={cn(
                "grid size-10 place-items-center rounded-[0.55rem] text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                query.view === view &&
                  "bg-[color-mix(in_oklab,var(--wiki-accent)_14%,transparent)] text-[var(--wiki-accent)]",
              )}
            >
              <Icon className="size-4.5" />
            </button>
          ))}
        </div>
      </div>

      <ActiveFilters
        facets={facets}
        options={options}
        query={query}
        onChange={onChange}
      />
    </div>
  );
}

function labelFor(
  options: FacetOptions,
  facetKey: string,
  value: string,
): string {
  return (
    options.get(facetKey)?.find((option) => option.value === value)?.label ??
    value
  );
}

function ActiveFilters({
  facets,
  options,
  query,
  onChange,
}: {
  facets: WikiFacet[];
  options: FacetOptions;
  query: WikiQueryState;
  onChange: (next: WikiQueryState) => void;
}) {
  const entries = facets.flatMap((facet) =>
    (query.filters[facet.key] ?? []).map((value) => ({
      facet: facet.key,
      value,
      label: labelFor(options, facet.key, value),
    })),
  );
  if (!entries.length) return null;

  return (
    <div className="mt-2 flex flex-wrap items-center gap-1.5">
      {entries.map((entry) => (
        <button
          key={`${entry.facet}-${entry.value}`}
          type="button"
          onClick={() =>
            onChange({
              ...query,
              filters: toggleFilterValue(
                query.filters,
                entry.facet,
                entry.value,
              ),
            })
          }
          className="group inline-flex items-center gap-1 rounded-full border border-[color-mix(in_oklab,var(--wiki-accent)_35%,var(--border))] bg-[color-mix(in_oklab,var(--wiki-accent)_10%,transparent)] py-1 pr-1.5 pl-2.5 text-xs transition-colors hover:bg-[color-mix(in_oklab,var(--wiki-accent)_18%,transparent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {entry.label}
          <IconX className="size-3.5 text-muted-foreground group-hover:text-foreground" />
          <span className="sr-only">Remove filter</span>
        </button>
      ))}
      <Button
        variant="ghost"
        size="sm"
        className="h-7 text-muted-foreground text-xs"
        onClick={() => onChange({ ...query, filters: {} })}
      >
        Clear all
      </Button>
    </div>
  );
}

function FilterSheet({
  facets,
  options,
  query,
  onChange,
  activeCount,
  resultCount,
  categoryTitle,
}: {
  facets: WikiFacet[];
  options: FacetOptions;
  query: WikiQueryState;
  onChange: (next: WikiQueryState) => void;
  activeCount: number;
  resultCount: number;
  categoryTitle: string;
}) {
  if (!facets.length) return null;

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          className="h-11 gap-2 bg-card px-3 shadow-xs"
          aria-label="Filters"
        >
          <IconAdjustmentsHorizontal className="size-4.5" />
          <span className="hidden sm:inline">Filters</span>
          {activeCount ? (
            <Badge className="size-5 justify-center rounded-full bg-[var(--wiki-accent)] p-0 font-mono text-[0.65rem] text-white tabular-nums">
              {activeCount}
            </Badge>
          ) : null}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-sm">
        <SheetHeader className="border-b">
          <SheetTitle className="font-display">
            Filter {categoryTitle}
          </SheetTitle>
        </SheetHeader>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-2">
          {facets.map((facet) => {
            const facetOptions = options.get(facet.key) ?? [];
            if (!facetOptions.length) return null;
            const selected = query.filters[facet.key] ?? [];
            return (
              <fieldset
                key={facet.key}
                className="border-b py-3 last:border-b-0"
              >
                <legend className="font-mono text-[0.65rem] text-muted-foreground uppercase tracking-[0.14em]">
                  {facet.label}
                </legend>
                <div className="mt-2 space-y-0.5">
                  {facetOptions.map((option) => {
                    const checked = selected.includes(option.value);
                    return (
                      <label
                        key={option.value}
                        htmlFor={`${facet.key}-${option.value}`}
                        className={cn(
                          "flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm hover:bg-muted has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring",
                          option.count === 0 && !checked && "opacity-45",
                        )}
                      >
                        <input
                          id={`${facet.key}-${option.value}`}
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            onChange({
                              ...query,
                              filters: toggleFilterValue(
                                query.filters,
                                facet.key,
                                option.value,
                              ),
                            })
                          }
                          className="sr-only"
                        />
                        <span
                          aria-hidden
                          className={cn(
                            "grid size-4 shrink-0 place-items-center rounded-[4px] border transition-colors",
                            checked &&
                              "border-[var(--wiki-accent)] bg-[var(--wiki-accent)] text-white",
                          )}
                        >
                          {checked ? <IconCheck className="size-3" /> : null}
                        </span>
                        <span className="min-w-0 flex-1 truncate">
                          {option.label}
                        </span>
                        <span className="font-mono text-[0.7rem] text-muted-foreground tabular-nums">
                          {option.count}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            );
          })}
        </div>
        <SheetFooter className="flex-row gap-2 border-t">
          <Button
            variant="ghost"
            className="flex-1"
            disabled={activeCount === 0}
            onClick={() => onChange({ ...query, filters: {} })}
          >
            Clear all
          </Button>
          <SheetClose asChild>
            <Button className="flex-1">
              Show {resultCount.toLocaleString()}
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
