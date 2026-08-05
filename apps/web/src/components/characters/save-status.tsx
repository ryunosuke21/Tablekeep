"use client";

import { Button } from "@tablekeep/ui/components/button";
import { cn } from "@tablekeep/ui/lib/utils";

type MutationLike = {
  isPending: boolean;
  isSuccess: boolean;
  error: { message: string } | null;
};

export type SaveState =
  | { kind: "idle" }
  | { kind: "saving" }
  | { kind: "saved" }
  | { kind: "error"; message: string };

/**
 * One save state for a group of mutations that share a control surface. Saving
 * wins over an older failure so a retry reads as progress, not as a stuck error.
 */
export function saveState(...mutations: MutationLike[]): SaveState {
  if (mutations.some((mutation) => mutation.isPending))
    return { kind: "saving" };
  const failed = mutations.find((mutation) => mutation.error);
  if (failed?.error) return { kind: "error", message: failed.error.message };
  if (mutations.some((mutation) => mutation.isSuccess))
    return { kind: "saved" };
  return { kind: "idle" };
}

/**
 * Live region for one editable area. It always occupies the same slot so the
 * layout does not shift while a save is in flight at the table.
 */
export function SaveStatus({
  state,
  onRetry,
  savedLabel = "Saved",
  className,
}: {
  state: SaveState;
  onRetry?: () => void;
  savedLabel?: string;
  className?: string;
}) {
  return (
    <p
      role="status"
      aria-live="polite"
      className={cn(
        "flex min-h-6 flex-wrap items-center gap-2 text-xs",
        state.kind === "error" ? "text-destructive" : "text-muted-foreground",
        className,
      )}
    >
      {state.kind === "saving" ? <span>Saving…</span> : null}
      {state.kind === "saved" ? <span>{savedLabel}</span> : null}
      {state.kind === "error" ? (
        <>
          <span>{state.message || "That change was not saved."}</span>
          {onRetry ? (
            <Button type="button" variant="outline" size="sm" onClick={onRetry}>
              Try again
            </Button>
          ) : null}
        </>
      ) : null}
    </p>
  );
}
