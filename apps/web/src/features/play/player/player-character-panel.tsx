import { IconHeartFilled } from "@tabler/icons-react";

import type { RouterOutputs } from "@/trpc/react";

import { PlayActionButton, PlayEyebrow } from "../shared/play-surfaces";

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

/** Vitality reads by color: healthy, hurt, bloodied. */
function hpColor(ratio: number) {
  if (ratio > 0.5) return "#4f9d78";
  if (ratio > 0.25) return "#d9a441";
  return "#d0524d";
}

function GroupHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="font-sans text-[#8a857b] text-[10px] uppercase tracking-[0.2em]">
      {children}
    </h3>
  );
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
  const hpValue = hasCurrentHp ? currentHp : sheet.maxHp;
  const hpRatio = sheet.maxHp > 0 ? hpValue / sheet.maxHp : 0;

  return (
    <section
      aria-labelledby="player-character-name"
      className="border border-white/10 bg-[#131316]/85 text-[#f4f2ec] backdrop-blur-sm"
    >
      <div className="grid gap-6 border-white/10 border-b px-5 py-6 sm:px-6 lg:grid-cols-[auto_minmax(0,1fr)_18rem] lg:items-center">
        <div className="mx-auto flex size-24 items-center justify-center border border-white/15 bg-[#0e0e10] font-display text-2xl text-[#e0b061] tracking-[0.06em] lg:mx-0">
          {initials(displayName)}
        </div>

        <div className="min-w-0 text-center lg:text-left">
          <PlayEyebrow>Active character</PlayEyebrow>
          <h2
            id="player-character-name"
            className="mt-1 text-balance font-display text-3xl text-[#f4f2ec] sm:text-4xl"
          >
            {displayName}
          </h2>
          <div className="mt-3 space-y-1 font-sans text-sm">
            <p className="text-[#d7d2c8]">{classes || "No class recorded"}</p>
            {sheet.ancestry ? (
              <p className="text-[#9b968c]">{sheet.ancestry}</p>
            ) : null}
            {backgrounds ? (
              <p className="text-[#9b968c]">{backgrounds}</p>
            ) : null}
            {sheet.alignment ? (
              <p className="text-[#6f6a61] text-xs uppercase tracking-[0.16em]">
                {sheet.alignment}
              </p>
            ) : null}
          </div>
        </div>

        <div className="border-white/10 border-t pt-5 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-6">
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 font-sans text-[#c7c2b8] text-xs uppercase tracking-[0.14em]">
              <IconHeartFilled
                aria-hidden="true"
                className="size-4 text-[#d0524d]"
              />
              Hit points
            </span>
            <span className="font-mono text-[#f4f2ec] text-lg tabular-nums">
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
            aria-valuenow={hpValue}
            aria-valuetext={
              hasCurrentHp
                ? `${currentHp} of ${sheet.maxHp} hit points`
                : `Maximum ${sheet.maxHp} hit points; current hit points unknown`
            }
            className="mt-2 h-2.5 overflow-hidden border border-white/10 bg-[#0a0a0b]"
          >
            <div
              className="h-full transition-[width] duration-300 motion-reduce:transition-none"
              style={{
                width: `${percentage(hpValue, sheet.maxHp)}%`,
                backgroundColor: hasCurrentHp ? hpColor(hpRatio) : "#7c7669",
              }}
            />
          </div>
          {tempHp !== undefined && tempHp !== null && tempHp > 0 ? (
            <p className="mt-2 font-mono text-[#e0b061] text-xs">
              +{tempHp} temporary
            </p>
          ) : null}
          <div className="mt-4 grid grid-cols-2 gap-2 border-white/10 border-t pt-3 text-center">
            <div>
              <p className="font-mono text-[#f4f2ec] text-lg tabular-nums">
                {activeItems.length}
              </p>
              <p className="font-sans text-[#6f6a61] text-[10px] uppercase tracking-[0.14em]">
                Carried
              </p>
            </div>
            <div>
              <p className="font-mono text-[#f4f2ec] text-lg tabular-nums">
                {preparedSpells}
              </p>
              <p className="font-sans text-[#6f6a61] text-[10px] uppercase tracking-[0.14em]">
                Prepared
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="border-white/10 border-b px-5 py-5 sm:px-6">
        <GroupHeading>Stats</GroupHeading>
        {sheet.stats.length > 0 ? (
          <ul className="mt-3 grid list-none grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
            {sheet.stats.map((stat) => (
              <li
                key={stat.id}
                className="min-w-0 border border-white/10 bg-[#0e0e10] px-2 py-3 text-center"
              >
                <p
                  className="truncate font-sans text-[#8a857b] text-[10px] uppercase tracking-[0.12em]"
                  title={stat.name}
                >
                  {stat.name}
                </p>
                <p className="mt-1 font-mono text-2xl text-[#f4f2ec] tabular-nums">
                  {stat.value}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 font-sans text-[#8a857b] text-sm">
            No stats recorded.
          </p>
        )}
      </div>

      <div className="grid gap-6 px-5 py-5 sm:px-6 lg:grid-cols-3">
        <div>
          <GroupHeading>Equipped</GroupHeading>
          {equippedItems.length > 0 ? (
            <ul className="mt-3 grid list-none gap-2">
              {equippedItems.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between gap-2 border border-white/10 bg-[#0e0e10] px-3 py-2"
                >
                  <span className="min-w-0 truncate font-sans text-[#e5e1d8] text-sm">
                    {item.name}
                  </span>
                  {item.qty > 1 ? (
                    <span className="shrink-0 font-mono text-[#8a857b] text-xs tabular-nums">
                      ×{item.qty}
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 font-sans text-[#8a857b] text-sm">
              Nothing equipped.
            </p>
          )}
        </div>

        <div>
          <GroupHeading>Effects</GroupHeading>
          {effects.length > 0 ? (
            <ul className="mt-3 flex list-none flex-wrap gap-2">
              {effects.map((effect) => (
                <li
                  key={effect.key}
                  className="border border-[#d0524d]/40 bg-[#d0524d]/10 px-2.5 py-1 font-sans text-[#e8b0ad] text-xs"
                >
                  {effect.name}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 font-sans text-[#8a857b] text-sm">No effects.</p>
          )}
        </div>

        <div>
          <GroupHeading>Resources</GroupHeading>
          {sheet.resources.length > 0 ? (
            <ul className="mt-3 grid list-none gap-3">
              {sheet.resources.map((resource) => (
                <li key={resource.id}>
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="min-w-0 truncate font-sans text-[#d7d2c8]">
                      {resource.name}
                    </span>
                    <span className="shrink-0 font-mono text-[#f4f2ec] tabular-nums">
                      {resource.currentValue}
                      {resource.maxValue !== null
                        ? `/${resource.maxValue}`
                        : ""}
                    </span>
                  </div>
                  {resource.maxValue !== null ? (
                    <div className="mt-1 h-1.5 overflow-hidden border border-white/10 bg-[#0a0a0b]">
                      <div
                        className="h-full bg-[#e0b061]"
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
            <p className="mt-3 font-sans text-[#8a857b] text-sm">
              No resources tracked.
            </p>
          )}
        </div>
      </div>

      <div className="flex justify-end border-white/10 border-t px-5 py-4 sm:px-6">
        <PlayActionButton onClick={onOpenFullSheet}>
          Open full sheet
        </PlayActionButton>
      </div>
    </section>
  );
}
