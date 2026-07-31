import type * as React from "react";

import { cn } from "@tablekeep/ui/lib/utils";

/** Small mono label that names a section without decorating it. */
export function Eyebrow({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      className={cn(
        "font-mono text-[11px] text-muted-foreground uppercase tracking-[0.18em]",
        className,
      )}
      {...props}
    />
  );
}
