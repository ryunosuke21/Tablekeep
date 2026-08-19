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
        className="flex items-center gap-2 border-border border-y bg-muted/30 px-4 py-2 text-muted-foreground text-sm"
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
      className="border-border border-y bg-card/40"
    >
      <p className="px-4 pt-2 text-muted-foreground text-xs uppercase tracking-widest">
        {round !== null ? `Round ${round}` : "Round not set"}
      </p>

      {orderedCombatants.length === 0 ? (
        <p className="px-4 py-3 text-muted-foreground text-sm">
          Initiative order has not been set.
        </p>
      ) : (
        <div className="relative overflow-x-auto">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-4 top-1/2 h-px -translate-y-1/2 bg-border"
          />
          <ol
            aria-label="Turn order"
            className="relative flex list-none items-center gap-2 px-4 py-3"
          >
            {orderedCombatants.map((combatant) => {
              const isActive = combatant.position === activePosition;

              return (
                <li
                  key={combatant.id}
                  aria-current={isActive ? "step" : undefined}
                  className={cn(
                    "relative z-10 flex min-w-20 max-w-36 shrink-0 flex-col gap-0.5 rounded-md border border-border bg-background px-2.5 py-1.5 shadow-sm transition-[transform,box-shadow] motion-reduce:transition-none",
                    isActive &&
                      "-translate-y-1 border-2 border-tk-ember shadow-md motion-reduce:translate-y-0",
                  )}
                >
                  <span
                    title={combatant.name}
                    className="truncate font-medium text-foreground text-sm"
                  >
                    {combatant.name}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {combatant.initiativeTotal !== null ? (
                      `Init ${combatant.initiativeTotal}`
                    ) : (
                      <>
                        <span aria-hidden="true">Init pending</span>
                        <span className="sr-only">Initiative not set</span>
                      </>
                    )}
                  </span>
                  {isActive && (
                    <span className="font-medium text-tk-ember text-xs">
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
