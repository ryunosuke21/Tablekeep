"use client";

import { useMemo, useState } from "react";
import { IconBook2, IconSearch } from "@tabler/icons-react";

import { cn } from "@tablekeep/ui/lib/utils";

import { PlayActionButton, PlayEyebrow } from "../shared/play-surfaces";
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
      className="border border-white/10 bg-[#131316]/85 text-[#f4f2ec] backdrop-blur-sm"
    >
      <div className="flex flex-wrap items-center justify-between gap-4 border-white/10 border-b px-5 py-4 sm:px-6">
        <div>
          <PlayEyebrow>
            Prepared {prepared.length} of {spells.length}
          </PlayEyebrow>
          <h2
            id="player-spellbook-heading"
            className="mt-1 font-display text-2xl text-[#f4f2ec] leading-tight"
          >
            Spellbook
          </h2>
        </div>
        <PlayActionButton onClick={onManageSpells}>
          Manage spellbook
        </PlayActionButton>
      </div>

      <div className="grid lg:grid-cols-[15rem_minmax(0,1fr)]">
        <aside className="border-white/10 border-b px-5 py-5 sm:px-6 lg:border-r lg:border-b-0">
          <h3 className="font-sans text-[#8a857b] text-[10px] uppercase tracking-[0.2em]">
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
                />
              ))}
            </ul>
          ) : (
            <p className="mt-3 font-sans text-[#8a857b] text-sm">
              No spells prepared.
            </p>
          )}
        </aside>

        <div className="min-w-0 px-5 py-5 sm:px-6">
          {spells.length > 0 ? (
            <>
              <div className="relative">
                <label htmlFor="spellbook-search" className="sr-only">
                  Search spellbook
                </label>
                <IconSearch
                  aria-hidden="true"
                  className="pointer-events-none absolute top-3 left-3 size-4 text-[#6f6a61]"
                />
                <input
                  id="spellbook-search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search spellbook"
                  className="h-11 w-full rounded-sm border border-white/10 bg-[#0e0e10] pl-9 font-sans text-[#f4f2ec] text-sm outline-none placeholder:text-[#6f6a61] focus-visible:border-[#e0b061]/60 focus-visible:ring-2 focus-visible:ring-[#e0b061]/30"
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
                        className="border-white/10 border-b pb-1 font-sans text-[#8a857b] text-[11px] uppercase tracking-[0.18em]"
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
                <p className="mt-5 font-sans text-[#8a857b] text-sm">
                  No spells match &quot;{query.trim()}&quot;.
                </p>
              )}
            </>
          ) : (
            <div className="py-8 text-center">
              <IconBook2
                aria-hidden="true"
                className="mx-auto size-8 text-[#3a3a3f]"
              />
              <p className="mt-3 font-sans text-[#8a857b] text-sm">
                No spells recorded.
              </p>
            </div>
          )}

          <div
            aria-live="polite"
            className="mt-5 min-h-28 border border-white/10 bg-[#0e0e10] p-4"
          >
            {selected ? (
              <>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-display text-[#f4f2ec] text-lg">
                      {selected.name}
                    </p>
                    <p className="mt-1 font-mono text-[#8a857b] text-xs">
                      Level {selected.level}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "border px-2 py-1 font-sans text-[10px] uppercase tracking-[0.14em]",
                      selected.prepared
                        ? "border-[#e0b061]/40 text-[#e0b061]"
                        : "border-white/15 text-[#9b968c]",
                    )}
                  >
                    {selected.prepared ? "Prepared" : "Learned"}
                  </span>
                </div>
                <p className="mt-3 whitespace-pre-wrap font-sans text-[#9b968c] text-sm">
                  {selected.notes || "No notes recorded."}
                </p>
              </>
            ) : (
              <p className="font-sans text-[#8a857b] text-sm">
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
}: {
  spell: SheetSpell;
  selected: boolean;
  onSelect: () => void;
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
          "group flex min-h-11 w-full items-center gap-2 border bg-[#0e0e10] p-2 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#e0b061]/60 motion-reduce:transition-none",
          spell.prepared ? "border-l-2 border-l-[#e0b061]" : "border-white/10",
          selected
            ? "border-[#e0b061] text-[#f4f2ec]"
            : "hover:border-white/25",
        )}
      >
        <span
          aria-hidden="true"
          className="flex size-8 shrink-0 items-center justify-center border border-white/10 bg-[#131316] font-display text-[#c7c2b8] text-sm"
        >
          {spell.name.trim().charAt(0).toUpperCase() || "?"}
        </span>
        <span className="min-w-0">
          <span className="block truncate font-sans text-[#e5e1d8] text-xs">
            {spell.name}
          </span>
          <span className="block font-mono text-[#6f6a61] text-[10px]">
            L{spell.level}
          </span>
        </span>
      </button>
    </li>
  );
}
