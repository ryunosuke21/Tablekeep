import { cn } from "@tablekeep/ui/lib/utils";

const DIE_POINTS: Record<number, string> = {
  4: "12,42 32,8 52,42",
  6: "13,13 51,13 51,51 13,51",
  8: "32,7 54,32 32,57 10,32",
  10: "32,6 53,25 45,55 19,55 11,25",
  12: "32,6 52,20 45,51 19,51 12,20",
  20: "32,5 55,22 47,52 17,52 9,22",
};

export type DiceExpression = {
  count: number;
  sides: 4 | 6 | 8 | 10 | 12 | 20;
  modifier?: number;
};

export function formatDiceExpression({
  count,
  sides,
  modifier = 0,
}: DiceExpression) {
  const suffix =
    modifier === 0
      ? ""
      : modifier > 0
        ? ` + ${modifier}`
        : ` - ${Math.abs(modifier)}`;
  return `${count}d${sides}${suffix}`;
}

export function parseDiceExpression(value: string): DiceExpression | null {
  const match = value
    .trim()
    .match(/^(\d*)d(4|6|8|10|12|20)(?:\s*([+-])\s*(\d+))?$/i);
  if (!match) return null;

  const sides = Number(match[2]) as DiceExpression["sides"];
  const count = match[1] ? Number(match[1]) : 1;
  const rawModifier = match[4] ? Number(match[4]) : 0;
  const modifier = match[3] === "-" ? -rawModifier : rawModifier;
  if (!Number.isInteger(count) || count < 1 || count > 100) return null;

  return { count, sides, modifier };
}

export function DiceRoll({
  expression,
  className,
  compact = false,
}: {
  expression: DiceExpression | string;
  className?: string;
  compact?: boolean;
}) {
  const parsed =
    typeof expression === "string"
      ? parseDiceExpression(expression)
      : expression;
  if (!parsed) return <span className={className}>{String(expression)}</span>;

  const label = formatDiceExpression(parsed);
  return (
    <span
      role="img"
      className={cn(
        "inline-flex w-fit items-center gap-1.5 rounded-md border border-primary/15 bg-primary/8 px-1.5 py-0.5 align-middle font-medium font-mono text-[0.86em] text-foreground",
        compact && "gap-1 border-0 bg-transparent px-0 py-0",
        className,
      )}
      aria-label={`Dice roll ${label}`}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 64 64"
        className="size-5 shrink-0 text-primary"
      >
        <polygon
          points={DIE_POINTS[parsed.sides]}
          fill="currentColor"
          fillOpacity="0.12"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        <path
          d={
            parsed.sides === 6
              ? "M13 13 32 29 51 13M32 29v22"
              : "M12 25 32 34 52 25M32 6v28M19 55l13-21 13 21"
          }
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.72"
        />
      </svg>
      <span aria-hidden="true">{label}</span>
    </span>
  );
}
