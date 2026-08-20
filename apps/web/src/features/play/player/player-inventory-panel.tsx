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

import { Button } from "@tablekeep/ui/components/button";
import { Input } from "@tablekeep/ui/components/input";
import { cn } from "@tablekeep/ui/lib/utils";

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

function itemAccessibleName(item: SheetItem) {
  const quantity = item.qty > 1 ? ` ×${item.qty}` : "";
  const equipped = item.equipped ? " (equipped)" : "";
  return `${item.name}${quantity}${equipped}`;
}

function InventoryCell({
  item,
  selected,
  onSelect,
}: {
  item: SheetItem;
  selected: boolean;
  onSelect: () => void;
}) {
  const Glyph = itemGlyph(item.name);
  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={selected}
        aria-label={itemAccessibleName(item)}
        className={cn(
          "relative flex aspect-square min-h-11 w-full items-center justify-center border bg-[#0c0907] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70 motion-reduce:transition-none",
          item.equipped ? "border-cyan-500/70" : "border-[#6b4a24]/60",
          selected
            ? "ring-2 ring-[#c9a25c] ring-offset-1 ring-offset-[#0c0907]"
            : "hover:border-[#8d6635]",
        )}
      >
        <Glyph aria-hidden="true" className="size-5 text-[#c9a25c]" />
        {item.qty > 1 ? (
          <span
            aria-hidden="true"
            className="absolute right-0.5 bottom-0.5 min-w-4 bg-[#1c130c] px-1 text-center font-mono text-[#f2e5c8] text-[10px] leading-tight"
          >
            {item.qty}
          </span>
        ) : null}
      </button>
    </li>
  );
}

export function PlayerInventoryPanel({
  items,
  currencies,
  onManageInventory,
}: PlayerInventoryPanelProps) {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const activeItems = useMemo(
    () => items.filter((item) => item.removedAt === null),
    [items],
  );
  const equippedItems = useMemo(
    () => activeItems.filter((item) => item.equipped),
    [activeItems],
  );
  const activeCurrencies = useMemo(
    () => currencies.filter((currency) => currency.removedAt === null),
    [currencies],
  );

  const normalizedQuery = query.trim().toLowerCase();
  const filteredItems = useMemo(
    () => activeItems.filter((item) => matchesQuery(item, normalizedQuery)),
    [activeItems, normalizedQuery],
  );

  const selectedItem =
    filteredItems.find((item) => item.id === selectedId) ?? null;

  return (
    <section
      aria-labelledby="player-inventory-heading"
      className="border border-[#6b4a24]/70 bg-[#120d0a] text-[#e9dfc5]"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-[#6b4a24]/60 border-b px-4 py-4 sm:px-6">
        <h2
          id="player-inventory-heading"
          className="font-display text-[#f2e5c8] text-xl"
        >
          Inventory &amp; equipment
        </h2>
        {activeCurrencies.length > 0 ? (
          <ul className="flex list-none flex-wrap gap-2">
            {activeCurrencies.map((currency) => (
              <li
                key={currency.id}
                className="flex items-center gap-1.5 border border-[#6b4a24]/60 bg-[#0c0907] px-2 py-1"
              >
                <span className="font-sans text-[#9b7444] text-[10px] uppercase tracking-[0.14em]">
                  {currency.name}
                </span>
                <span className="font-mono text-[#f2e5c8] text-sm">
                  {currency.amount}
                </span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <div className="grid gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[16rem_minmax(0,1fr)]">
        <div className="border-[#4a3218]/60 border-b pb-6 lg:border-r lg:border-b-0 lg:pr-6 lg:pb-0">
          <h3 className="font-display text-[#c9a25c] text-sm tracking-wide">
            Equipment rack
          </h3>
          {equippedItems.length > 0 ? (
            <ul className="mt-3 grid grid-cols-4 gap-1.5 sm:grid-cols-6 lg:grid-cols-4">
              {equippedItems.map((item) => (
                <InventoryCell
                  key={item.id}
                  item={item}
                  selected={item.id === selectedId}
                  onSelect={() => setSelectedId(item.id)}
                />
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-[#8f7656] text-sm">Nothing equipped.</p>
          )}
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-display text-[#c9a25c] text-sm tracking-wide">
              Inventory
            </h3>
            <Button
              type="button"
              variant="outline"
              className="min-h-11 rounded-none border-[#8d6635] bg-[#0b0807] text-[#e9dfc5] hover:bg-[#24170f] hover:text-[#fff3d6] focus-visible:ring-cyan-300/60"
              onClick={onManageInventory}
            >
              Manage inventory
            </Button>
          </div>

          {activeItems.length > 0 ? (
            <>
              <div className="relative mt-4">
                <label
                  htmlFor="inventory-search"
                  className="mb-1 block font-sans text-[#9b7444] text-[10px] uppercase tracking-[0.14em]"
                >
                  Search inventory
                </label>
                <IconSearch
                  aria-hidden="true"
                  className="pointer-events-none absolute bottom-2.5 left-2.5 size-4 text-[#8f7656]"
                />
                <Input
                  id="inventory-search"
                  type="text"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Filter by name or notes"
                  className="h-11 rounded-none border-[#6b4a24] bg-[#0c0907] pl-8 text-[#e9dfc5] placeholder:text-[#5f4a30] focus-visible:border-cyan-300/60 focus-visible:ring-cyan-300/40"
                />
              </div>

              {filteredItems.length > 0 ? (
                <ul className="mt-4 grid grid-cols-4 gap-1.5 sm:grid-cols-6 lg:grid-cols-8">
                  {filteredItems.map((item) => (
                    <InventoryCell
                      key={item.id}
                      item={item}
                      selected={item.id === selectedId}
                      onSelect={() => setSelectedId(item.id)}
                    />
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-[#8f7656] text-sm">
                  No items match &quot;{query.trim()}&quot;.
                </p>
              )}
            </>
          ) : (
            <p className="mt-4 text-[#8f7656] text-sm">Your pack is empty.</p>
          )}

          <div
            aria-live="polite"
            className="mt-4 border border-[#4a3218]/60 bg-[#0c0907] p-4"
          >
            {selectedItem ? (
              <>
                <p className="font-sans text-[#e9dfc5] text-base">
                  {selectedItem.name}
                </p>
                <p className="mt-1 font-mono text-[#8f7656] text-xs">
                  Quantity {selectedItem.qty}
                </p>
                <p className="mt-1 font-sans text-[#8f7656] text-xs">
                  {selectedItem.equipped ? "Equipped" : "Not equipped"}
                </p>
                <p className="mt-2 font-sans text-[#b99c70] text-sm">
                  {selectedItem.notes || "No notes recorded."}
                </p>
              </>
            ) : (
              <p className="font-sans text-[#8f7656] text-sm">
                Select an item to see its details.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
