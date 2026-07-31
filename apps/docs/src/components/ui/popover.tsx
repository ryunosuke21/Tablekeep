"use client";
import type * as React from "react";
import { Popover as Primitive } from "@base-ui/react/popover";

import { cn } from "../../lib/cn";

export const Popover = Primitive.Root;

export const PopoverTrigger = Primitive.Trigger;

export function PopoverContent({
  className,
  align = "center",
  sideOffset = 4,
  ...props
}: React.ComponentProps<typeof Primitive.Popup> &
  Pick<Primitive.Positioner.Props, "sideOffset" | "align">) {
  return (
    <Primitive.Portal>
      <Primitive.Positioner
        align={align}
        side="bottom"
        sideOffset={sideOffset}
        className="z-50"
      >
        <Primitive.Popup
          className={(s) =>
            cn(
              "z-50 max-h-(--available-height) w-(--anchor-width) min-w-[240px] max-w-[98vw] origin-(--transform-origin) overflow-y-auto rounded-xl border bg-fd-popover/60 p-2 text-fd-popover-foreground text-sm shadow-lg backdrop-blur-lg focus-visible:outline-none data-closed:animate-fd-popover-out data-open:animate-fd-popover-in",
              typeof className === "function" ? className(s) : className,
            )
          }
          {...props}
        />
      </Primitive.Positioner>
    </Primitive.Portal>
  );
}

export const PopoverClose = Primitive.Close;
