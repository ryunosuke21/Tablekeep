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
        className="flex items-center gap-2 border-white/10 border-b bg-[#0b0b0d]/60 px-4 py-2 font-sans text-[#8a857b] text-xs uppercase tracking-[0.16em] backdrop-blur-sm"
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
      className="relative flex items-stretch border-white/10 border-b bg-[#0b0b0d]/70 backdrop-blur-sm"
    >
      <div className="flex shrink-0 flex-col items-center justify-center border-white/10 border-r px-4 py-2">
        <span className="font-sans text-[#e0b061] text-xs uppercase tracking-[0.18em]">
          {round !== null ? `Round ${round}` : "Round not set"}
        </span>
      </div>

      {orderedCombatants.length === 0 ? (
        <p className="flex-1 self-center px-4 py-3 font-sans text-[#8a857b] text-sm">
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
                      "relative flex size-11 items-center justify-center rounded-sm border font-sans font-semibold text-sm",
                      isActive
                        ? "border-[#e0b061] bg-[#e0b061] text-[#0b0b0d]"
                        : "border-white/15 bg-white/5 text-[#e5e1d8]",
                    )}
                  >
                    <span aria-hidden="true">{initials}</span>
                    <span
                      aria-hidden="true"
                      className={cn(
                        "absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-sm border font-mono text-[10px] leading-none",
                        isActive
                          ? "border-[#e0b061] bg-[#0b0b0d] text-[#e0b061]"
                          : "border-white/15 bg-[#0b0b0d] text-[#c7c2b8]",
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
                      className="h-0 w-0 border-x-4 border-x-transparent border-t-4 border-t-[#e0b061]"
                    />
                  )}

                  <span
                    title={combatant.name}
                    className={cn(
                      "w-full truncate text-center font-sans text-xs",
                      isActive ? "text-[#f4f2ec]" : "text-[#c7c2b8]",
                    )}
                  >
                    {combatant.name}
                  </span>

                  {isActive && (
                    <span className="font-medium font-sans text-[#e0b061] text-[10px] uppercase tracking-wide">
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
