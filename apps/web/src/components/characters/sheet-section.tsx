import type { ReactNode } from "react";

import { cn } from "@tablekeep/ui/lib/utils";

/**
 * A ruled band on the sheet. Sections stay flat and stacked so a phone at the
 * table scrolls one column instead of hunting through nested cards.
 */
export function SheetSection({
  title,
  description,
  count,
  action,
  children,
  className,
}: {
  title: string;
  description?: string;
  count?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("border-t pt-7", className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-baseline sm:justify-between">
        <div>
          <h2 className="font-medium text-lg tracking-[-0.03em]">
            {title}
            {count ? (
              <span className="ml-2 font-normal text-muted-foreground text-sm tabular-nums">
                {count}
              </span>
            ) : null}
          </h2>
          {description ? (
            <p className="mt-1 text-muted-foreground text-sm">{description}</p>
          ) : null}
        </div>
        {action}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

/** A single editable row: full-width on a phone, ruled between siblings. */
export function SheetRow({
  children,
  muted = false,
  className,
}: {
  children: ReactNode;
  muted?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "border-b py-4 first:pt-0 last:border-b-0 last:pb-0",
        muted ? "opacity-70" : undefined,
        className,
      )}
    >
      {children}
    </div>
  );
}
