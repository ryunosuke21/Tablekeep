import { cn } from "@tablekeep/ui/lib/utils";

export type TurnRailCombatant = {
  id: string;
  name: string;
  initiativeTotal: number | null;
  position: number;
};

export type TurnRailProps = {
  combatants: readonly TurnRailCombatant[];
  activePosition: number | null;
  round: number | null;
  isEncounterActive: boolean;
};

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return (words[0] ?? "?").slice(0, 2).toUpperCase();
  const first = words[0]?.[0] ?? "";
  const last = words[words.length - 1]?.[0] ?? "";
  return `${first}${last}`.toUpperCase();
}

export function TurnRail({
  combatants,
  activePosition,
  round,
  isEncounterActive,
}: TurnRailProps) {
  if (!isEncounterActive) {
    return (
      <div
        data-slot="turn-rail"
        data-state="inactive"
        className="flex items-center gap-2 border-[#4a3218]/60 border-y bg-[#120d0a] px-4 py-2 font-sans text-[#8a6a45] text-xs uppercase tracking-widest"
      >
        <span
          aria-hidden="true"
          className="size-1.5 shrink-0 rounded-full border border-current"
        />
        <span>No active encounter</span>
      </div>
    );
  }

  const orderedCombatants = [...combatants].sort(
    (a, b) => a.position - b.position,
  );

  return (
    <div
      data-slot="turn-rail"
      data-state="active"
      className="relative flex items-stretch border-[#6b4a24]/70 border-y bg-[#140f0b]"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[#c9a25c]/30"
      />

      <div className="flex shrink-0 flex-col items-center justify-center border-[#6b4a24]/50 border-r bg-[#0d0a08] px-3 py-2">
        <span className="font-display text-[#c9a25c] text-xs uppercase tracking-[0.2em]">
          {round !== null ? `Round ${round}` : "Round not set"}
        </span>
      </div>

      {orderedCombatants.length === 0 ? (
        <p className="flex-1 self-center px-4 py-3 font-sans text-[#8a6a45] text-sm">
          Initiative order has not been set.
        </p>
      ) : (
        <div className="scrollbar-none min-w-0 flex-1 overflow-x-auto">
          <ol
            aria-label="Turn order"
            className="flex list-none items-start gap-3 px-4 py-3"
          >
            {orderedCombatants.map((combatant) => {
              const isActive = combatant.position === activePosition;
              const initials = getInitials(combatant.name);

              return (
                <li
                  key={combatant.id}
                  aria-current={isActive ? "step" : undefined}
                  className={cn(
                    "flex w-16 shrink-0 flex-col items-center gap-1 pt-1 transition-transform duration-150 motion-reduce:transition-none",
                    isActive ? "translate-y-2" : "translate-y-0",
                  )}
                >
                  <div
                    className={cn(
                      "relative flex size-11 items-center justify-center rounded-full border-2 font-sans font-semibold text-sm",
                      isActive
                        ? "border-cyan-300 bg-[#0d2b2e] text-cyan-100 shadow-[0_0_0_3px_rgba(34,211,238,0.15)]"
                        : "border-[#5c2323] bg-[#2a1414] text-[#e9dfc5]",
                    )}
                  >
                    <span aria-hidden="true">{initials}</span>
                    <span
                      aria-hidden="true"
                      className={cn(
                        "absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full border font-mono text-[10px] leading-none",
                        isActive
                          ? "border-cyan-300 bg-[#0d2b2e] text-cyan-100"
                          : "border-[#6b4a24]/70 bg-[#14100c] text-[#c9a25c]",
                      )}
                    >
                      {combatant.initiativeTotal ?? "–"}
                    </span>
                    <span className="sr-only">
                      {combatant.initiativeTotal !== null
                        ? `Init ${combatant.initiativeTotal}`
                        : "Initiative not set"}
                    </span>
                  </div>

                  {isActive && (
                    <span
                      aria-hidden="true"
                      className="h-0 w-0 border-x-4 border-x-transparent border-t-4 border-t-cyan-300"
                    />
                  )}

                  <span
                    title={combatant.name}
                    className="w-full truncate text-center font-sans text-[#e9dfc5] text-xs"
                  >
                    {combatant.name}
                  </span>

                  {isActive && (
                    <span className="font-medium font-sans text-[10px] text-cyan-300">
                      Current turn
                    </span>
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      )}
    </div>
  );
}
