"use client";

import { Badge } from "@tablekeep/ui/components/badge";
import { Button } from "@tablekeep/ui/components/button";
import { Progress } from "@tablekeep/ui/components/progress";
import { cn } from "@tablekeep/ui/lib/utils";
import { IconChevronRight, IconShieldFilled } from "@tabler/icons-react";
import { useState } from "react";

type Combatant = {
  initiative: number;
  name: string;
  side: "party" | "adversary";
  hp: number;
  maxHp: number;
  ac: number;
  conditions?: string[];
};

/** One round of a real-feeling fight, ordered the way initiative is rolled. */
const ORDER: Combatant[] = [
  {
    initiative: 21,
    name: "Sera Valdis",
    side: "party",
    hp: 31,
    maxHp: 38,
    ac: 16,
  },
  {
    initiative: 18,
    name: "Bandit captain",
    side: "adversary",
    hp: 42,
    maxHp: 65,
    ac: 15,
  },
  {
    initiative: 14,
    name: "Brother Oda",
    side: "party",
    hp: 9,
    maxHp: 44,
    ac: 18,
    conditions: ["Concentrating"],
  },
  {
    initiative: 11,
    name: "Thornback wolf",
    side: "adversary",
    hp: 0,
    maxHp: 26,
    ac: 13,
    conditions: ["Down"],
  },
  {
    initiative: 7,
    name: "Pike",
    side: "party",
    hp: 27,
    maxHp: 33,
    ac: 14,
    conditions: ["Prone"],
  },
];

export function InitiativeRail() {
  const [turn, setTurn] = useState(0);
  const round = Math.floor(turn / ORDER.length) + 1;
  const activeIndex = turn % ORDER.length;

  return (
    <div className="overflow-hidden rounded-2xl bg-card/70 shadow-2xl shadow-tk-keep/30 ring-1 ring-foreground/10 backdrop-blur-md">
      <div className="flex items-center justify-between gap-4 border-border/60 border-b px-4 py-3 sm:px-5">
        <div className="flex items-baseline gap-3">
          <span className="font-mono text-[11px] text-muted-foreground uppercase tracking-[0.18em]">
            Initiative
          </span>
          <span className="font-mono text-foreground text-xs tabular-nums">
            Round {round}
          </span>
        </div>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => setTurn((value) => value + 1)}
        >
          Next turn
          <IconChevronRight data-icon="inline-end" />
        </Button>
      </div>

      <ol className="divide-y divide-border/60">
        {ORDER.map((combatant, index) => {
          const isActive = index === activeIndex;
          const isDown = combatant.hp === 0;

          return (
            <li
              key={combatant.name}
              aria-current={isActive ? "step" : undefined}
              className={cn(
                "relative flex items-center gap-3 px-4 py-3 transition-colors sm:gap-4 sm:px-5",
                isActive ? "bg-tk-ember/8" : "hover:bg-muted/40",
                isDown && "opacity-55",
              )}
            >
              {/* The active turn is the only place ember appears. */}
              <span
                aria-hidden
                className={cn(
                  "absolute top-1/2 left-0 h-8 w-0.5 -translate-y-1/2 rounded-r-full transition-colors",
                  isActive ? "bg-tk-ember" : "bg-transparent",
                )}
              />

              <span
                className={cn(
                  "w-7 shrink-0 text-right font-mono text-sm tabular-nums",
                  isActive ? "text-tk-ember" : "text-muted-foreground",
                )}
              >
                {combatant.initiative}
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span
                    className={cn(
                      "truncate font-medium text-sm",
                      combatant.side === "adversary" && "text-muted-foreground",
                    )}
                  >
                    {combatant.name}
                  </span>
                  {isActive ? (
                    <span className="font-mono text-[10px] text-tk-ember uppercase tracking-[0.18em]">
                      Their turn
                    </span>
                  ) : null}
                  {combatant.conditions?.map((condition) => (
                    <Badge key={condition} variant="outline">
                      {condition}
                    </Badge>
                  ))}
                </div>
                <Progress
                  aria-label={`${combatant.name} hit points`}
                  value={(combatant.hp / combatant.maxHp) * 100}
                  className="mt-2 h-1"
                />
              </div>

              <div className="flex shrink-0 items-center gap-3 font-mono text-xs tabular-nums">
                <span className="text-muted-foreground">
                  <span className="text-foreground">{combatant.hp}</span>/
                  {combatant.maxHp}
                </span>
                <span className="hidden items-center gap-1 text-muted-foreground sm:inline-flex">
                  <IconShieldFilled className="size-3" aria-hidden />
                  <span className="sr-only">Armor class </span>
                  {combatant.ac}
                </span>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
