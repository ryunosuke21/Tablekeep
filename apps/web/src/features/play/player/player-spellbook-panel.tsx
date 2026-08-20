"use client";

import { useMemo, useState } from "react";
import { IconBook2, IconSearch, IconSparkles } from "@tabler/icons-react";

import { Button } from "@tablekeep/ui/components/button";
import { Input } from "@tablekeep/ui/components/input";
import { cn } from "@tablekeep/ui/lib/utils";

import type { PlayerSheet } from "./player-character-panel";

type SheetSpell = PlayerSheet["spells"][number];

export function PlayerSpellbookPanel({
  spells,
  onManageSpells,
}: {
  spells: PlayerSheet["spells"];
  onManageSpells: () => void;
}) {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const normalizedQuery = query.trim().toLowerCase();
  const filteredSpells = useMemo(
    () =>
      spells.filter((spell) =>
        `${spell.name} ${spell.notes ?? ""}`
          .toLowerCase()
          .includes(normalizedQuery),
      ),
    [spells, normalizedQuery],
  );
  const prepared = spells.filter((spell) => spell.prepared);
  const selected =
    filteredSpells.find((spell) => spell.id === selectedId) ?? null;
  const levels = [...new Set(filteredSpells.map((spell) => spell.level))].sort(
    (a, b) => a - b,
  );

  return (
    <section
      aria-labelledby="player-spellbook-heading"
      className="border border-[#6b4a24]/70 bg-[#120d0a] text-[#e9dfc5]"
    >
      <div className="flex flex-wrap items-center justify-between gap-4 border-[#6b4a24]/60 border-b px-4 py-4 sm:px-6">
        <div>
          <p className="font-sans text-[#9b7444] text-[10px] uppercase tracking-[0.2em]">
            Prepared {prepared.length} of {spells.length}
          </p>
          <h2
            id="player-spellbook-heading"
            className="mt-1 font-display text-2xl text-[#f2e5c8]"
          >
            Spellbook
          </h2>
        </div>
        <Button
          type="button"
          variant="outline"
          className="min-h-11 rounded-none border-[#8d6635] bg-[#0b0807] text-[#e9dfc5] hover:bg-[#24170f] hover:text-[#fff3d6] focus-visible:ring-cyan-300/60"
          onClick={onManageSpells}
        >
          Manage spellbook
        </Button>
      </div>

      <div className="grid lg:grid-cols-[15rem_minmax(0,1fr)]">
        <aside className="border-[#4a3218]/60 border-b px-4 py-5 sm:px-6 lg:border-r lg:border-b-0">
          <h3 className="flex items-center gap-2 font-display text-[#c9a25c] text-sm">
            <IconSparkles aria-hidden="true" className="size-4" />
            Prepared
          </h3>
          {prepared.length > 0 ? (
            <ul className="mt-3 grid list-none gap-2">
              {prepared.map((spell) => (
                <SpellButton
                  key={spell.id}
                  spell={spell}
                  selected={spell.id === selectedId}
                  onSelect={() => setSelectedId(spell.id)}
                  compact
                />
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-[#8f7656] text-sm">No spells prepared.</p>
          )}
        </aside>

        <div className="min-w-0 px-4 py-5 sm:px-6">
          {spells.length > 0 ? (
            <>
              <div className="relative">
                <label
                  htmlFor="spellbook-search"
                  className="mb-1 block font-sans text-[#9b7444] text-[10px] uppercase tracking-[0.14em]"
                >
                  Search spellbook
                </label>
                <IconSearch
                  aria-hidden="true"
                  className="pointer-events-none absolute bottom-3.5 left-3 size-4 text-[#8f7656]"
                />
                <Input
                  id="spellbook-search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Filter by name or notes"
                  className="h-11 rounded-none border-[#6b4a24] bg-[#0c0907] pl-9 text-[#e9dfc5] placeholder:text-[#5f4a30] focus-visible:border-cyan-300/60 focus-visible:ring-cyan-300/40"
                />
              </div>

              {filteredSpells.length > 0 ? (
                <div className="mt-5 grid gap-5">
                  {levels.map((level) => (
                    <section
                      key={level}
                      aria-labelledby={`spell-level-${level}`}
                    >
                      <h3
                        id={`spell-level-${level}`}
                        className="border-[#4a3218]/70 border-b pb-1 font-display text-[#a9885e] text-xs uppercase tracking-[0.18em]"
                      >
                        Level {level}
                      </h3>
                      <ul className="mt-2 grid list-none grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">
                        {filteredSpells
                          .filter((spell) => spell.level === level)
                          .map((spell) => (
                            <SpellButton
                              key={spell.id}
                              spell={spell}
                              selected={spell.id === selectedId}
                              onSelect={() => setSelectedId(spell.id)}
                            />
                          ))}
                      </ul>
                    </section>
                  ))}
                </div>
              ) : (
                <p className="mt-5 text-[#8f7656] text-sm">
                  No spells match &quot;{query.trim()}&quot;.
                </p>
              )}
            </>
          ) : (
            <div className="py-8 text-center">
              <IconBook2
                aria-hidden="true"
                className="mx-auto size-8 text-[#6b4a24]"
              />
              <p className="mt-3 text-[#8f7656] text-sm">No spells recorded.</p>
            </div>
          )}

          <div
            aria-live="polite"
            className="mt-5 min-h-28 border border-[#4a3218]/60 bg-[#0c0907] p-4"
          >
            {selected ? (
              <>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-display text-[#f2e5c8] text-lg">
                      {selected.name}
                    </p>
                    <p className="mt-1 font-mono text-[#8f7656] text-xs">
                      Level {selected.level}
                    </p>
                  </div>
                  <span className="border border-[#6b4a24]/70 px-2 py-1 font-sans text-[#b99c70] text-[10px] uppercase tracking-wider">
                    {selected.prepared ? "Prepared" : "Learned"}
                  </span>
                </div>
                <p className="mt-3 whitespace-pre-wrap font-sans text-[#b99c70] text-sm">
                  {selected.notes || "No notes recorded."}
                </p>
              </>
            ) : (
              <p className="text-[#8f7656] text-sm">
                Select a spell to read its notes.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function SpellButton({
  spell,
  selected,
  onSelect,
  compact = false,
}: {
  spell: SheetSpell;
  selected: boolean;
  onSelect: () => void;
  compact?: boolean;
}) {
  return (
    <li>
      <button
        type="button"
        aria-pressed={selected}
        aria-label={`${spell.name}, level ${spell.level}${
          spell.prepared ? ", prepared" : ""
        }`}
        onClick={onSelect}
        className={cn(
          "group flex min-h-11 w-full items-center gap-2 border bg-[#0c0907] p-2 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-cyan-300/70 motion-reduce:transition-none",
          spell.prepared ? "border-cyan-700/70" : "border-[#6b4a24]/60",
          selected
            ? "border-[#c9a25c] text-[#fff3d6]"
            : "hover:border-[#8d6635]",
          compact && "lg:grid lg:grid-cols-[2rem_minmax(0,1fr)]",
        )}
      >
        <span
          aria-hidden="true"
          className="flex size-8 shrink-0 items-center justify-center border border-[#6b4a24]/70 bg-[#181009] font-display text-[#c9a25c] text-sm"
        >
          {spell.name.trim().charAt(0).toUpperCase() || "?"}
        </span>
        <span className="min-w-0">
          <span className="block truncate font-sans text-[#e9dfc5] text-xs">
            {spell.name}
          </span>
          <span className="block font-mono text-[#8f7656] text-[10px]">
            L{spell.level}
          </span>
        </span>
      </button>
    </li>
  );
}
