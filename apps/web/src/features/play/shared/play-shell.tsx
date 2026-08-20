import type { ReactNode } from "react";
import Link from "next/link";

import { cn } from "@tablekeep/ui/lib/utils";

export type PlayShellSection = {
  value: string;
  label: string;
  icon: ReactNode;
};

export function PlayShell({
  campaignName,
  campaignHref,
  viewLabel,
  sections,
  activeSection,
  onSectionChange,
  turnRail,
  children,
}: {
  campaignName: string;
  campaignHref: string;
  viewLabel: string;
  sections: readonly PlayShellSection[];
  activeSection: string;
  onSectionChange: (value: string) => void;
  turnRail?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="relative flex min-h-svh flex-col overflow-x-hidden bg-[#0b0908] text-[#e9dfc5]">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(120,90,50,0.16),transparent),radial-gradient(ellipse_60%_50%_at_50%_110%,rgba(20,15,10,0.6),transparent)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-3 border border-[#6b4a24]/40 sm:inset-4"
      />
      <div aria-hidden="true" className="pointer-events-none fixed inset-0">
        <span className="absolute top-3 left-3 size-3 border-[#c9a25c]/60 border-t border-l sm:top-4 sm:left-4" />
        <span className="absolute top-3 right-3 size-3 border-[#c9a25c]/60 border-t border-r sm:top-4 sm:right-4" />
        <span className="absolute bottom-3 left-3 size-3 border-[#c9a25c]/60 border-b border-l sm:bottom-4 sm:left-4" />
        <span className="absolute right-3 bottom-3 size-3 border-[#c9a25c]/60 border-r border-b sm:right-4 sm:bottom-4" />
      </div>

      <header className="relative z-10 flex items-center justify-between gap-4 border-[#4a3218]/60 border-b px-4 py-3 sm:px-8">
        <div className="flex min-w-0 flex-col">
          <h1 className="truncate font-display text-[#e9dfc5] text-lg sm:text-xl">
            {campaignName}
          </h1>
          <p className="truncate font-sans text-[#8a6a45] text-xs uppercase tracking-[0.18em]">
            {viewLabel}
          </p>
        </div>

        <Link
          href={campaignHref}
          className="flex min-h-11 shrink-0 items-center rounded-none border border-[#6b4a24]/60 px-3 font-sans text-[#c9a25c] text-xs uppercase tracking-widest outline-none transition-colors hover:border-[#c9a25c]/70 hover:text-[#e9dfc5] focus-visible:border-cyan-300 focus-visible:text-cyan-100 focus-visible:ring-2 focus-visible:ring-cyan-300/50 motion-reduce:transition-none"
        >
          Leave table
        </Link>
      </header>

      {turnRail ? <div className="relative z-10">{turnRail}</div> : null}

      <div className="relative z-10 flex flex-1 items-start lg:flex-row">
        <nav
          aria-label="Play sections"
          className="fixed inset-x-0 bottom-0 z-20 flex border-[#4a3218]/60 border-t bg-[#0b0908] pb-[env(safe-area-inset-bottom)] lg:sticky lg:inset-auto lg:top-0 lg:z-auto lg:flex lg:h-full lg:w-40 lg:shrink-0 lg:flex-col lg:border-t-0 lg:border-r lg:py-4"
        >
          {sections.map((entry) => {
            const isActive = entry.value === activeSection;
            return (
              <button
                key={entry.value}
                type="button"
                aria-current={isActive ? "page" : undefined}
                onClick={() => onSectionChange(entry.value)}
                className={cn(
                  "flex min-h-11 flex-1 flex-col items-center justify-center gap-0.5 px-1 font-sans text-[10px] uppercase tracking-widest outline-none transition-colors motion-reduce:transition-none lg:min-h-11 lg:flex-none lg:flex-row lg:justify-start lg:gap-2 lg:px-4 lg:text-xs",
                  "focus-visible:ring-2 focus-visible:ring-cyan-300/50 focus-visible:ring-inset",
                  isActive
                    ? "text-cyan-100"
                    : "text-[#8a6a45] hover:text-[#c9a25c]",
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "flex size-5 items-center justify-center",
                    isActive ? "text-cyan-300" : "text-[#6b4a24]",
                  )}
                >
                  {entry.icon}
                </span>
                <span>{entry.label}</span>
              </button>
            );
          })}
        </nav>

        <main className="min-w-0 flex-1 px-4 py-6 pb-24 sm:px-8 lg:pb-10">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
