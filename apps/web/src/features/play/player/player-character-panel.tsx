import {
  IconBackpack,
  IconHeartFilled,
  IconShield,
  IconSparkles,
} from "@tabler/icons-react";

import { Button } from "@tablekeep/ui/components/button";

import type { RouterOutputs } from "@/trpc/react";

export type PlayerSheet = NonNullable<
  RouterOutputs["play"]["player"]["bootstrap"]["sheet"]
>;

export type PlayerCharacterPanelProps = {
  sheet: PlayerSheet;
  currentHp?: number | null;
  tempHp?: number | null;
  encounterEffects?: readonly { id: string; name: string }[];
  onOpenFullSheet: () => void;
};

function initials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0]?.slice(0, 2).toUpperCase() || "?";
  return `${words[0]?.[0] ?? ""}${words.at(-1)?.[0] ?? ""}`.toUpperCase();
}

function percentage(value: number, max: number) {
  if (max <= 0) return 0;
  return Math.min(100, Math.max(0, (value / max) * 100));
}

export function PlayerCharacterPanel({
  sheet,
  currentHp,
  tempHp,
  encounterEffects = [],
  onOpenFullSheet,
}: PlayerCharacterPanelProps) {
  const displayName = sheet.name?.trim() || sheet.charName;
  const classes = sheet.classes
    .map((entry) => {
      const title = entry.subclass
        ? `${entry.name}, ${entry.subclass}`
        : entry.name;
      return `${title} ${entry.level}`;
    })
    .join(" / ");
  const backgrounds = sheet.backgrounds.map((entry) => entry.name).join(" / ");
  const activeItems = sheet.items.filter((entry) => entry.removedAt === null);
  const equippedItems = activeItems.filter((entry) => entry.equipped);
  const preparedSpells = sheet.spells.filter((entry) => entry.prepared).length;
  const effects = [
    ...sheet.conditions.map((entry) => ({
      key: `condition-${entry.id}`,
      name: entry.name,
    })),
    ...encounterEffects.map((entry) => ({
      key: `encounter-${entry.id}`,
      name: entry.name,
    })),
  ];
  const hasCurrentHp = currentHp !== undefined && currentHp !== null;

  return (
    <section
      aria-labelledby="player-character-name"
      className="relative isolate overflow-hidden border border-[#6b4a24]/70 bg-[#120d0a] text-[#e9dfc5] shadow-[0_20px_70px_rgba(0,0,0,0.38)]"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_22%_10%,rgba(115,77,35,0.2),transparent_32%),linear-gradient(115deg,transparent_49.8%,rgba(201,162,92,0.035)_50%,transparent_50.2%)]"
      />
      <span
        aria-hidden="true"
        className="absolute top-2 left-2 size-8 border-[#c9a25c]/45 border-t border-l"
      />
      <span
        aria-hidden="true"
        className="absolute right-2 bottom-2 size-8 border-[#c9a25c]/45 border-r border-b"
      />

      <div className="grid gap-6 border-[#6b4a24]/60 border-b px-4 py-6 sm:px-7 lg:grid-cols-[10rem_minmax(0,1fr)_15rem] lg:items-center">
        <div className="mx-auto flex size-32 items-center justify-center rounded-full border border-[#c9a25c]/70 bg-[#0b0807] p-2 shadow-[0_0_0_5px_rgba(107,74,36,0.18)] lg:mx-0">
          <div className="flex size-full items-center justify-center rounded-full border border-[#6b4a24] bg-[radial-gradient(circle,rgba(104,48,42,0.7),rgba(28,14,13,0.95)_65%)] font-display text-3xl text-[#f2e5c8] tracking-[0.08em]">
            {initials(displayName)}
          </div>
        </div>

        <div className="min-w-0 text-center lg:text-left">
          <p className="font-sans text-[#9b7444] text-[10px] uppercase tracking-[0.24em]">
            Active character
          </p>
          <h2
            id="player-character-name"
            className="mt-1 text-balance font-display text-3xl text-[#f2e5c8] sm:text-4xl"
          >
            {displayName}
          </h2>
          <div className="mt-3 space-y-1 font-sans text-sm">
            <p className="text-[#d1b88b]">{classes || "No class recorded"}</p>
            {sheet.ancestry ? <p>{sheet.ancestry}</p> : null}
            {backgrounds ? (
              <p className="text-[#b99c70]">{backgrounds}</p>
            ) : null}
            {sheet.alignment ? (
              <p className="text-[#8f7656] text-xs uppercase tracking-[0.16em]">
                {sheet.alignment}
              </p>
            ) : null}
          </div>
        </div>

        <div className="border-[#6b4a24]/50 border-t pt-5 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-6">
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 font-display text-[#c9a25c] text-sm">
              <IconHeartFilled
                aria-hidden="true"
                className="size-4 text-[#8f3937]"
              />
              Hit points
            </span>
            <span className="font-mono text-[#f2e5c8] text-lg">
              {hasCurrentHp
                ? `${currentHp}/${sheet.maxHp}`
                : `Max ${sheet.maxHp}`}
            </span>
          </div>
          <div
            role="progressbar"
            aria-label="Hit points"
            aria-valuemin={0}
            aria-valuemax={sheet.maxHp}
            aria-valuenow={hasCurrentHp ? currentHp : sheet.maxHp}
            aria-valuetext={
              hasCurrentHp
                ? `${currentHp} of ${sheet.maxHp} hit points`
                : `Maximum ${sheet.maxHp} hit points; current hit points unknown`
            }
            className="mt-2 h-2 overflow-hidden border border-[#6b4a24] bg-[#090705]"
          >
            <div
              className="h-full bg-[#2d8c9a] transition-[width] duration-300 motion-reduce:transition-none"
              style={{
                width: `${percentage(
                  hasCurrentHp ? currentHp : sheet.maxHp,
                  sheet.maxHp,
                )}%`,
              }}
            />
          </div>
          {tempHp !== undefined && tempHp !== null && tempHp > 0 ? (
            <p className="mt-2 font-mono text-cyan-200 text-xs">
              +{tempHp} temporary
            </p>
          ) : null}
          <div className="mt-4 grid grid-cols-2 gap-2 border-[#4a3218]/60 border-t pt-3 text-center">
            <div>
              <p className="font-mono text-[#f2e5c8] text-lg">
                {activeItems.length}
              </p>
              <p className="font-sans text-[#8f7656] text-[10px] uppercase tracking-wider">
                Carried
              </p>
            </div>
            <div>
              <p className="font-mono text-[#f2e5c8] text-lg">
                {preparedSpells}
              </p>
              <p className="font-sans text-[#8f7656] text-[10px] uppercase tracking-wider">
                Prepared
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="border-[#4a3218]/60 border-b px-4 py-5 sm:px-7">
        <h3 className="font-display text-[#c9a25c] text-sm tracking-wide">
          Recorded stats
        </h3>
        {sheet.stats.length > 0 ? (
          <ul className="mt-4 grid list-none grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {sheet.stats.map((stat) => (
              <li key={stat.id} className="min-w-0 text-center">
                <p
                  className="truncate font-sans text-[#a9885e] text-[10px] uppercase tracking-[0.14em]"
                  title={stat.name}
                >
                  {stat.name}
                </p>
                <div className="mx-auto mt-1 flex size-14 items-center justify-center rounded-full border border-[#8d6635] bg-[#0d0907] font-mono text-2xl text-[#f2e5c8] shadow-[inset_0_0_0_3px_rgba(107,74,36,0.16)]">
                  {stat.value}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-[#8f7656] text-sm">No stats recorded.</p>
        )}
      </div>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.8fr)]">
        <div className="border-[#4a3218]/60 px-4 py-6 sm:px-7 lg:border-r">
          <h3 className="flex items-center gap-2 font-display text-[#c9a25c] text-lg">
            <IconShield aria-hidden="true" className="size-5" />
            Equipped
          </h3>
          {equippedItems.length > 0 ? (
            <ul className="mt-4 grid list-none grid-cols-2 gap-2 sm:grid-cols-3">
              {equippedItems.map((item) => (
                <li
                  key={item.id}
                  className="min-h-24 border border-[#6b4a24]/70 bg-[#0c0907] p-3"
                >
                  <IconShield
                    aria-hidden="true"
                    className="size-5 text-[#8f6638]"
                  />
                  <p className="mt-3 break-words font-sans text-[#e9dfc5] text-sm">
                    {item.name}
                  </p>
                  <p className="mt-1 font-mono text-[#8f7656] text-xs">
                    ×{item.qty}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-[#8f7656] text-sm">Nothing equipped.</p>
          )}
        </div>

        <div className="grid content-start gap-6 border-[#4a3218]/60 border-t px-4 py-6 sm:px-7 lg:border-t-0">
          <div>
            <h3 className="flex items-center gap-2 font-display text-[#c9a25c] text-lg">
              <IconSparkles aria-hidden="true" className="size-5" />
              Effects
            </h3>
            {effects.length > 0 ? (
              <ul className="mt-3 flex list-none flex-wrap gap-2">
                {effects.map((effect) => (
                  <li
                    key={effect.key}
                    className="border border-[#7c3f39]/70 bg-[#2a1414] px-2.5 py-1 font-sans text-[#e3c9b3] text-xs"
                  >
                    {effect.name}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-[#8f7656] text-sm">No effects.</p>
            )}
          </div>

          <div>
            <h3 className="flex items-center gap-2 font-display text-[#c9a25c] text-lg">
              <IconBackpack aria-hidden="true" className="size-5" />
              Resources
            </h3>
            {sheet.resources.length > 0 ? (
              <ul className="mt-3 grid list-none gap-3">
                {sheet.resources.map((resource) => (
                  <li key={resource.id}>
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="truncate font-sans text-[#d1b88b]">
                        {resource.name}
                      </span>
                      <span className="shrink-0 font-mono text-[#f2e5c8]">
                        {resource.currentValue}
                        {resource.maxValue !== null
                          ? `/${resource.maxValue}`
                          : ""}
                      </span>
                    </div>
                    {resource.maxValue !== null ? (
                      <div className="mt-1 h-1.5 overflow-hidden border border-[#4a3218] bg-[#090705]">
                        <div
                          className="h-full bg-[#2d8c9a]"
                          style={{
                            width: `${percentage(resource.currentValue, resource.maxValue)}%`,
                          }}
                        />
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-[#8f7656] text-sm">
                No resources tracked.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end border-[#6b4a24]/60 border-t px-4 py-4 sm:px-7">
        <Button
          type="button"
          variant="outline"
          className="min-h-11 rounded-none border-[#8d6635] bg-[#0b0807] text-[#e9dfc5] hover:bg-[#24170f] hover:text-[#fff3d6] focus-visible:ring-cyan-300/60"
          onClick={onOpenFullSheet}
        >
          Open full sheet
        </Button>
      </div>
    </section>
  );
}
