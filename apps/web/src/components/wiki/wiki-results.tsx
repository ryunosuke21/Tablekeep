"use client";

import { useMemo } from "react";
import { IconChevronRight } from "@tabler/icons-react";
import Link from "next/link";

import { cn } from "@tablekeep/ui/lib/utils";

import type { WikiCategory, WikiListItem, WikiView } from "@/lib/wiki/catalog";
import { WIKI_CATEGORY_META } from "@/lib/wiki/catalog";
import {
  descriptorOf,
  detailHref,
  type SourceLookup,
  statsFor,
  type WikiGroup,
  type WikiSort,
} from "@/lib/wiki/facets";

import { WikiImage } from "./wiki-image";

export type WikiResultGroup = WikiGroup & { items: WikiListItem[] };

export function groupEntries(
  items: WikiListItem[],
  sort: WikiSort,
): WikiResultGroup[] {
  const groups: WikiResultGroup[] = [];
  let current: WikiResultGroup | undefined;

  for (const item of items) {
    const group = sort.groupOf(item);
    if (!current || current.key !== group.key) {
      current = { ...group, items: [] };
      groups.push(current);
    }
    current.items.push(item);
  }

  return groups;
}

function StatStrip({
  category,
  item,
  className,
}: {
  category: WikiCategory;
  item: WikiListItem;
  className?: string;
}) {
  const stats = statsFor(category, item);
  if (!stats.length) return null;
  return (
    <dl className={cn("flex items-baseline gap-4", className)}>
      {stats.map((stat) => (
        <div key={stat.label} className="flex items-baseline gap-1.5">
          <dt className="font-mono text-[0.6rem] text-muted-foreground uppercase tracking-[0.1em]">
            {stat.label}
          </dt>
          <dd className="font-medium font-mono text-[0.8rem] tabular-nums">
            {stat.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function EntryRow({
  category,
  item,
  sourceName,
}: {
  category: WikiCategory;
  item: WikiListItem;
  sourceName: string;
}) {
  return (
    <li className="wiki-row border-border/70 border-b last:border-b-0">
      <Link
        href={detailHref(category, item)}
        className="group flex items-center gap-3 py-2.5 pr-3 pl-3 transition-colors hover:bg-[color-mix(in_oklab,var(--wiki-accent)_7%,transparent)] focus-visible:bg-[color-mix(in_oklab,var(--wiki-accent)_7%,transparent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset sm:gap-4 sm:pl-4"
      >
        <WikiImage
          category={category}
          name={item.name}
          className="size-11 rounded-lg border"
        />
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium text-[0.95rem] leading-snug group-hover:text-[var(--wiki-accent)]">
            {item.name}
          </span>
          <span className="mt-0.5 flex items-center gap-2 truncate text-muted-foreground text-xs">
            <span className="truncate">{descriptorOf(category, item)}</span>
            <span aria-hidden className="text-border">
              /
            </span>
            <span className="truncate">{sourceName}</span>
          </span>
          <StatStrip
            category={category}
            item={item}
            className="mt-1.5 flex-wrap sm:hidden"
          />
        </span>
        <StatStrip
          category={category}
          item={item}
          className="hidden shrink-0 justify-end sm:flex"
        />
        <IconChevronRight className="size-4 shrink-0 text-border transition-colors group-hover:text-[var(--wiki-accent)]" />
      </Link>
    </li>
  );
}

function EntryCard({
  category,
  item,
  sourceName,
}: {
  category: WikiCategory;
  item: WikiListItem;
  sourceName: string;
}) {
  const stats = statsFor(category, item);
  return (
    <li className="wiki-card">
      <Link
        href={detailHref(category, item)}
        className="group flex h-full flex-col overflow-hidden rounded-xl border bg-card shadow-xs transition duration-150 hover:-translate-y-0.5 hover:border-[color-mix(in_oklab,var(--wiki-accent)_45%,var(--border))] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transform-none motion-reduce:transition-none"
      >
        <WikiImage
          category={category}
          name={item.name}
          className="aspect-[16/9] w-full border-b"
          imageClassName="transition-transform duration-300 group-hover:scale-[1.03] motion-reduce:transform-none"
        />
        <span className="flex flex-1 flex-col p-4">
          <p className="font-mono text-[0.6rem] text-[var(--wiki-accent)] uppercase tracking-[0.16em]">
            {WIKI_CATEGORY_META[category].singular}
          </p>
          <h3 className="mt-1.5 font-display font-semibold text-lg leading-tight tracking-[-0.01em]">
            {item.name}
          </h3>
          <p className="mt-1 text-muted-foreground text-sm">
            {descriptorOf(category, item)}
          </p>
          {stats.length ? (
            <dl className="mt-4 grid grid-cols-3 gap-2 border-t pt-3">
              {stats.map((stat) => (
                <div key={stat.label} className="min-w-0">
                  <dt className="font-mono text-[0.58rem] text-muted-foreground uppercase tracking-[0.12em]">
                    {stat.label}
                  </dt>
                  <dd className="truncate font-medium font-mono text-sm tabular-nums">
                    {stat.value}
                  </dd>
                </div>
              ))}
            </dl>
          ) : null}
          <p className="mt-auto truncate pt-3 text-muted-foreground text-xs">
            {sourceName}
          </p>
        </span>
      </Link>
    </li>
  );
}

export function WikiResults({
  category,
  groups,
  view,
  sourceName,
}: {
  category: WikiCategory;
  groups: WikiResultGroup[];
  view: WikiView;
  sourceName: SourceLookup;
}) {
  const nameOf = useMemo(
    () => (key: string) => sourceName(key)?.displayName ?? "Unknown source",
    [sourceName],
  );

  return (
    <div className="space-y-8">
      {groups.map((group) => (
        <section key={group.key}>
          <div className="sticky top-[7.25rem] z-10 flex items-baseline gap-3 bg-[color-mix(in_oklab,var(--muted)_28%,var(--background))] py-1.5">
            <h2 className="font-display font-semibold text-[var(--wiki-accent)] text-sm uppercase tracking-[0.12em]">
              {group.label}
            </h2>
            <span className="font-mono text-[0.65rem] text-muted-foreground tabular-nums">
              {group.items.length}
            </span>
            <span aria-hidden className="h-px flex-1 bg-border" />
          </div>
          {view === "cards" ? (
            <ul className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {group.items.map((item) => (
                <EntryCard
                  key={item.key}
                  category={category}
                  item={item}
                  sourceName={nameOf(item.sourceKey)}
                />
              ))}
            </ul>
          ) : (
            <ul className="mt-2 overflow-hidden rounded-xl border bg-card shadow-xs">
              {group.items.map((item) => (
                <EntryRow
                  key={item.key}
                  category={category}
                  item={item}
                  sourceName={nameOf(item.sourceKey)}
                />
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}
