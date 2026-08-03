"use client";

import type { ReactNode } from "react";
import { useState } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@tablekeep/ui/components/alert-dialog";
import { Button } from "@tablekeep/ui/components/button";
import { LoadingSwap } from "@tablekeep/ui/components/loading-swap";

/**
 * Confirmation for an action that cannot be undone from the same screen. The
 * description must name the consequence, not just ask "are you sure".
 */
export function ConfirmActionDialog({
  trigger,
  title,
  consequence,
  confirmLabel,
  cancelLabel = "Keep as is",
  onConfirm,
  isPending = false,
  destructive = true,
}: {
  trigger: ReactNode;
  title: string;
  consequence: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  isPending?: boolean;
  destructive?: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{consequence}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <Button type="button" variant="outline" disabled={isPending}>
              {cancelLabel}
            </Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              type="button"
              variant={destructive ? "destructive" : "default"}
              disabled={isPending}
              onClick={(event) => {
                event.preventDefault();
                onConfirm();
                setOpen(false);
              }}
            >
              <LoadingSwap isLoading={isPending}>{confirmLabel}</LoadingSwap>
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
