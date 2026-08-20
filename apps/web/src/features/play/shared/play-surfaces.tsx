import type { ReactNode } from "react";
import { IconChevronLeft } from "@tabler/icons-react";

import { cn } from "@tablekeep/ui/lib/utils";

export function PlayEyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="font-sans text-[#8a857b] text-[10px] uppercase tracking-[0.22em]">
      {children}
    </p>
  );
}

/** A titled section rendered as a single flat panel. */
export function PlaySection({
  headingId,
  heading,
  eyebrow,
  action,
  children,
  bodyClassName,
}: {
  headingId: string;
  heading: string;
  eyebrow?: string;
  action?: ReactNode;
  children: ReactNode;
  bodyClassName?: string;
}) {
  return (
    <section
      aria-labelledby={headingId}
      className="border border-white/10 bg-[#131316]/85 backdrop-blur-sm"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-white/10 border-b px-5 py-4 sm:px-6">
        <div className="min-w-0">
          {eyebrow ? <PlayEyebrow>{eyebrow}</PlayEyebrow> : null}
          <h2
            id={headingId}
            className="font-display text-2xl text-[#f4f2ec] leading-tight"
          >
            {heading}
          </h2>
        </div>
        {action}
      </div>
      <div className={cn("px-5 py-5 sm:px-6", bodyClassName)}>{children}</div>
    </section>
  );
}

/** A single stat read-out: uppercase label over a big mono value. */
export function StatTile({
  label,
  value,
  hint,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
}) {
  return (
    <div className="border border-white/10 bg-[#0e0e10] px-3 py-3">
      <p className="truncate font-sans text-[#8a857b] text-[10px] uppercase tracking-[0.16em]">
        {label}
      </p>
      <p className="mt-1 font-mono text-[#f4f2ec] text-xl tabular-nums">
        {value}
      </p>
      {hint ? (
        <p className="mt-0.5 font-sans text-[#6f6a61] text-[11px]">{hint}</p>
      ) : null}
    </div>
  );
}

/**
 * Currency read-out. A coin mark, the freely-named currency, and a big amount —
 * no coin-system assumptions, just a clean ledger tile.
 */
export function CurrencyTile({
  name,
  amount,
}: {
  name: string;
  amount: number | string;
}) {
  return (
    <div className="flex items-center gap-3 border border-white/10 bg-[#0e0e10] px-3 py-2.5">
      <span
        aria-hidden="true"
        className="flex size-8 shrink-0 items-center justify-center rounded-full border border-[#e0b061]/50 font-display text-[#e0b061] text-sm"
      >
        ◈
      </span>
      <span className="min-w-0">
        <span className="block truncate font-sans text-[#9b968c] text-[10px] uppercase tracking-[0.16em]">
          {name}
        </span>
        <span className="block font-mono text-[#f4f2ec] text-lg tabular-nums leading-tight">
          {amount}
        </span>
      </span>
    </div>
  );
}

/** Consistent "go back one step" control for sub-views. */
export function PlayBackButton({
  onClick,
  children,
}: {
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex min-h-11 w-fit items-center gap-1.5 rounded-sm border border-white/15 px-3 font-sans text-[#c7c2b8] text-xs uppercase tracking-[0.16em] outline-none transition-colors hover:border-white/30 hover:text-[#f4f2ec] focus-visible:ring-2 focus-visible:ring-[#e0b061]/60 motion-reduce:transition-none"
    >
      <IconChevronLeft aria-hidden="true" className="size-4" />
      {children}
    </button>
  );
}

/** A flat outline button for in-panel actions (manage, open, etc.). */
export function PlayActionButton({
  onClick,
  children,
}: {
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex min-h-11 items-center justify-center rounded-sm border border-white/15 bg-white/5 px-4 font-sans text-[#f4f2ec] text-xs uppercase tracking-[0.14em] outline-none transition-colors hover:border-[#e0b061]/60 hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-[#e0b061]/60 motion-reduce:transition-none"
    >
      {children}
    </button>
  );
}

export function PlayEmpty({ children }: { children: ReactNode }) {
  return <p className="font-sans text-[#8a857b] text-sm">{children}</p>;
}
