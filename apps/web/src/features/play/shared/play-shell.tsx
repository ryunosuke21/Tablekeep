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
  backgroundImage,
  logo,
  sections,
  activeSection,
  onSectionChange,
  turnRail,
  children,
}: {
  campaignName: string;
  campaignHref: string;
  viewLabel: string;
  backgroundImage?: string | null;
  logo?: string | null;
  sections: readonly PlayShellSection[];
  activeSection: string;
  onSectionChange: (value: string) => void;
  turnRail?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="dark relative flex min-h-svh flex-col overflow-x-hidden bg-[#0b0b0d] text-[#f4f2ec]">
      {/* The campaign banner is the only source of color: a full-bleed backdrop
          under a flat dark wash so the menu itself stays quiet and legible. */}
      {backgroundImage ? (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 bg-center bg-cover"
          style={{ backgroundImage: `url("${backgroundImage}")` }}
        />
      ) : null}
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none fixed inset-0",
          backgroundImage ? "bg-[#0b0b0d]/82" : "bg-[#0b0b0d]",
        )}
      />

      <header className="relative z-10 flex items-center justify-between gap-4 border-white/10 border-b bg-[#0b0b0d]/60 px-4 py-3 backdrop-blur-sm sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          {logo ? (
            // biome-ignore lint/performance/noImgElement: user-provided avatar URL, not a bundled asset.
            <img
              src={logo}
              alt=""
              className="size-10 shrink-0 rounded-sm border border-white/15 object-cover"
            />
          ) : null}
          <div className="flex min-w-0 flex-col">
            <p className="font-sans text-[#8a857b] text-[10px] uppercase tracking-[0.22em]">
              {viewLabel}
            </p>
            <h1 className="truncate font-display text-[#f4f2ec] text-lg leading-tight sm:text-xl">
              {campaignName}
            </h1>
          </div>
        </div>

        <Link
          href={campaignHref}
          className="flex min-h-11 shrink-0 items-center rounded-sm border border-white/15 px-3 font-sans text-[#c7c2b8] text-xs uppercase tracking-[0.18em] outline-none transition-colors hover:border-white/30 hover:text-[#f4f2ec] focus-visible:border-[#e0b061] focus-visible:text-[#f4f2ec] focus-visible:ring-2 focus-visible:ring-[#e0b061]/50 motion-reduce:transition-none"
        >
          Leave table
        </Link>
      </header>

      {turnRail ? <div className="relative z-10">{turnRail}</div> : null}

      <div className="relative z-10 flex flex-1 items-start lg:flex-row">
        <nav
          aria-label="Play sections"
          className="fixed inset-x-0 bottom-0 z-20 flex border-white/10 border-t bg-[#0b0b0d]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm lg:sticky lg:inset-auto lg:top-0 lg:z-auto lg:h-full lg:w-56 lg:shrink-0 lg:flex-col lg:gap-1 lg:border-t-0 lg:border-r lg:bg-transparent lg:p-3 lg:backdrop-blur-none"
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
                  "group relative flex min-h-14 flex-1 flex-col items-center justify-center gap-1 px-1 font-sans text-[10px] uppercase tracking-[0.16em] outline-none transition-colors motion-reduce:transition-none lg:min-h-13 lg:flex-none lg:flex-row lg:justify-start lg:gap-3 lg:rounded-sm lg:px-4 lg:text-[13px] lg:tracking-[0.14em]",
                  "focus-visible:ring-2 focus-visible:ring-[#e0b061]/60 focus-visible:ring-inset",
                  isActive
                    ? "bg-[#e0b061] text-[#0b0b0d]"
                    : "text-[#8f8a80] hover:bg-white/5 hover:text-[#f4f2ec]",
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "flex size-5 items-center justify-center transition-colors motion-reduce:transition-none lg:size-5",
                    isActive
                      ? "text-[#0b0b0d]"
                      : "text-[#6f6a61] group-hover:text-[#e0b061]",
                  )}
                >
                  {entry.icon}
                </span>
                <span>{entry.label}</span>
              </button>
            );
          })}
        </nav>

        <main className="min-w-0 flex-1 px-4 py-6 pb-24 sm:px-6 lg:px-8 lg:pb-10">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
