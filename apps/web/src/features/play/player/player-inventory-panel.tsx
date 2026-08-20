"use client";

import { useMemo, useState } from "react";
import {
  IconBook,
  IconFlask,
  IconPackage,
  IconSearch,
  IconShield,
  IconShirt,
  IconSword,
} from "@tabler/icons-react";

import { cn } from "@tablekeep/ui/lib/utils";

import { CurrencyTile, PlayActionButton } from "../shared/play-surfaces";
import type { PlayerSheet } from "./player-character-panel";

export type PlayerInventoryPanelProps = {
  items: PlayerSheet["items"];
  currencies: PlayerSheet["currencies"];
  onManageInventory: () => void;
};

type SheetItem = PlayerSheet["items"][number];

function itemGlyph(name: string) {
  const lower = name.toLowerCase();
  if (/shield/.test(lower)) return IconShield;
  if (/blade|sword/.test(lower)) return IconSword;
  if (/potion|flask/.test(lower)) return IconFlask;
  if (/book|scroll/.test(lower)) return IconBook;
  if (/cloth|armor|armour/.test(lower)) return IconShirt;
  return IconPackage;
}

function matchesQuery(item: SheetItem, query: string) {
  if (!query) return true;
  const haystack = `${item.name} ${item.notes ?? ""}`.toLowerCase();
  return haystack.includes(query);
}

function ItemRow({ item }: { item: SheetItem }) {
  const Glyph = itemGlyph(item.name);
  return (
    <li
      className={cn(
        "flex items-start gap-3 border border-white/10 bg-[#0e0e10] p-3",
        item.equipped && "border-l-2 border-l-[#e0b061] pl-2.5",
      )}
    >
      <span
        aria-hidden="true"
        className="flex size-10 shrink-0 items-center justify-center border border-white/10 bg-[#131316] text-[#c7c2b8]"
      >
        <Glyph className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className="truncate font-sans text-[#f4f2ec] text-sm">
            {item.name}
          </p>
          {item.qty > 1 ? (
            <span className="shrink-0 font-mono text-[#9b968c] text-xs tabular-nums">
              ×{item.qty}
            </span>
          ) : null}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
          {item.equipped ? (
            <span className="border border-[#e0b061]/40 px-1.5 py-0.5 font-sans text-[#e0b061] text-[9px] uppercase tracking-[0.14em]">
              Equipped
            </span>
          ) : null}
          {item.notes ? (
            <p
              className="line-clamp-2 min-w-0 font-sans text-[#8a857b] text-xs"
              title={item.notes}
            >
              {item.notes}
            </p>
          ) : null}
        </div>
      </div>
    </li>
  );
}

export function PlayerInventoryPanel({
  items,
  currencies,
  onManageInventory,
}: PlayerInventoryPanelProps) {
  const [query, setQuery] = useState("");

  const activeItems = useMemo(
    () => items.filter((item) => item.removedAt === null),
    [items],
  );
  const activeCurrencies = useMemo(
    () => currencies.filter((currency) => currency.removedAt === null),
    [currencies],
  );

  const normalizedQuery = query.trim().toLowerCase();
  const filteredItems = useMemo(
    () =>
      activeItems
        .filter((item) => matchesQuery(item, normalizedQuery))
        // Equipped gear reads first — it is what is actually in hand.
        .sort((a, b) => Number(b.equipped) - Number(a.equipped)),
    [activeItems, normalizedQuery],
  );

  return (
    <section
      aria-labelledby="player-inventory-heading"
      className="border border-white/10 bg-[#131316]/85 text-[#f4f2ec] backdrop-blur-sm"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-white/10 border-b px-5 py-4 sm:px-6">
        <h2
          id="player-inventory-heading"
          className="font-display text-2xl text-[#f4f2ec] leading-tight"
        >
          Inventory
        </h2>
        <PlayActionButton onClick={onManageInventory}>
          Manage inventory
        </PlayActionButton>
      </div>

      <div className="flex flex-col gap-6 px-5 py-5 sm:px-6">
        <section aria-labelledby="player-currency-heading">
          <h3
            id="player-currency-heading"
            className="font-sans text-[#8a857b] text-[10px] uppercase tracking-[0.2em]"
          >
            Purse
          </h3>
          {activeCurrencies.length > 0 ? (
            <ul className="mt-2 grid list-none grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {activeCurrencies.map((currency) => (
                <li key={currency.id}>
                  <CurrencyTile name={currency.name} amount={currency.amount} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 font-sans text-[#8a857b] text-sm">
              No currency tracked.
            </p>
          )}
        </section>

        <section aria-labelledby="player-carried-heading">
          <div className="flex items-center justify-between gap-3">
            <h3
              id="player-carried-heading"
              className="font-sans text-[#8a857b] text-[10px] uppercase tracking-[0.2em]"
            >
              Carried · {activeItems.length}
            </h3>
          </div>

          {activeItems.length > 0 ? (
            <>
              <div className="relative mt-3">
                <label htmlFor="inventory-search" className="sr-only">
                  Search inventory
                </label>
                <IconSearch
                  aria-hidden="true"
                  className="pointer-events-none absolute top-3 left-3 size-4 text-[#6f6a61]"
                />
                <input
                  id="inventory-search"
                  type="text"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search inventory"
                  className="h-11 w-full rounded-sm border border-white/10 bg-[#0e0e10] pl-9 font-sans text-[#f4f2ec] text-sm outline-none placeholder:text-[#6f6a61] focus-visible:border-[#e0b061]/60 focus-visible:ring-2 focus-visible:ring-[#e0b061]/30"
                />
              </div>

              {filteredItems.length > 0 ? (
                <ul className="mt-3 grid list-none gap-2 sm:grid-cols-2">
                  {filteredItems.map((item) => (
                    <ItemRow key={item.id} item={item} />
                  ))}
                </ul>
              ) : (
                <p className="mt-3 font-sans text-[#8a857b] text-sm">
                  No items match &quot;{query.trim()}&quot;.
                </p>
              )}
            </>
          ) : (
            <p className="mt-3 font-sans text-[#8a857b] text-sm">
              Your pack is empty.
            </p>
          )}
        </section>
      </div>
    </section>
  );
}
