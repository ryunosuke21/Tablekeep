"use client";

import { useId, useState } from "react";
import { IconChevronDown } from "@tabler/icons-react";

import { Button } from "@tablekeep/ui/components/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@tablekeep/ui/components/collapsible";

const COMPACT_ITEM_COUNT = 3;

type ExpandableCardCollectionProps<T> = {
  title: string;
  description: string;
  items: T[];
  emptyState: React.ReactNode;
  getKey: (item: T) => string;
  renderItem: (item: T) => React.ReactNode;
};

export function ExpandableCardCollection<T>({
  title,
  description,
  items,
  emptyState,
  getKey,
  renderItem,
}: ExpandableCardCollectionProps<T>) {
  const [expanded, setExpanded] = useState(false);
  const headingId = useId();
  const compactItems = items.slice(0, COMPACT_ITEM_COUNT);
  const additionalItems = items.slice(COMPACT_ITEM_COUNT);
  const hiddenCount = additionalItems.length;

  return (
    <Collapsible open={expanded} onOpenChange={setExpanded}>
      <section aria-labelledby={headingId}>
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2
                id={headingId}
                className="font-semibold text-xl tracking-[-0.025em]"
              >
                {title}
              </h2>
              <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground tabular-nums">
                {items.length}
              </span>
            </div>
            <p className="mt-1 text-muted-foreground text-sm">{description}</p>
          </div>

          {hiddenCount > 0 ? (
            <CollapsibleTrigger asChild>
              <Button
                type="button"
                variant="outline"
                aria-label={
                  expanded
                    ? `Show fewer ${title.toLowerCase()}`
                    : `Show ${hiddenCount} more ${title.toLowerCase()}`
                }
                className="self-start sm:self-auto"
              >
                {expanded ? "Show less" : `Show all (${hiddenCount})`}
                <IconChevronDown
                  className={`transition-transform duration-200 motion-reduce:transition-none ${
                    expanded ? "rotate-180" : ""
                  }`}
                />
              </Button>
            </CollapsibleTrigger>
          ) : null}
        </div>

        {items.length === 0 ? (
          emptyState
        ) : (
          <>
            <div className="grid items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {compactItems.map((item) => (
                <div key={getKey(item)}>{renderItem(item)}</div>
              ))}
            </div>
            {hiddenCount > 0 ? (
              <CollapsibleContent className="data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-top-1 data-[state=open]:animate-in motion-reduce:animate-none">
                <div className="mt-4 grid items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {additionalItems.map((item) => (
                    <div key={getKey(item)}>{renderItem(item)}</div>
                  ))}
                </div>
              </CollapsibleContent>
            ) : null}
          </>
        )}
      </section>
    </Collapsible>
  );
}
