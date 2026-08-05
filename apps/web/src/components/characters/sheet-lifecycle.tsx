"use client";

import { useRouter } from "next/navigation";

import { Button } from "@tablekeep/ui/components/button";
import { LoadingSwap } from "@tablekeep/ui/components/loading-swap";
import { toast } from "@tablekeep/ui/components/sonner";

import { ConfirmActionDialog } from "@/components/campaigns/confirm-action-dialog";
import { api } from "@/trpc/react";

/**
 * Retiring keeps the sheet readable but frees the player's active slot in this
 * campaign. Reactivating is refused server-side while another sheet is active.
 */
export function SheetLifecycle({
  campaignId,
  sheetId,
  displayName,
  retired,
  campaignArchived,
}: {
  campaignId: string;
  sheetId: string;
  displayName: string;
  retired: boolean;
  campaignArchived: boolean;
}) {
  const router = useRouter();
  const utils = api.useUtils();

  function afterChange(message: string) {
    toast.success(message);
    void utils.character.sheet.get.invalidate({ campaignId, sheetId });
    void utils.character.sheet.list.invalidate({ campaignId });
    void utils.character.list.invalidate();
    router.refresh();
  }

  const retire = api.character.sheet.retire.useMutation({
    onSuccess: () => afterChange(`${displayName} is retired`),
    onError: (error) =>
      toast.error("That sheet was not retired", {
        description: error.message,
      }),
  });
  const reactivate = api.character.sheet.reactivate.useMutation({
    onSuccess: () => afterChange(`${displayName} is back in play`),
    onError: (error) =>
      toast.error("That sheet was not reactivated", {
        description: error.message,
      }),
  });

  if (campaignArchived) {
    return (
      <p className="text-muted-foreground text-sm">
        This campaign is archived, so the sheet is read-only.
      </p>
    );
  }

  if (retired) {
    return (
      <Button
        type="button"
        variant="outline"
        className="min-h-11"
        disabled={reactivate.isPending}
        onClick={() => reactivate.mutate({ campaignId, sheetId })}
      >
        <LoadingSwap isLoading={reactivate.isPending}>
          Return to play
        </LoadingSwap>
      </Button>
    );
  }

  return (
    <ConfirmActionDialog
      trigger={
        <Button
          type="button"
          variant="outline"
          className="min-h-11"
          disabled={retire.isPending}
        >
          Retire sheet
        </Button>
      }
      title={`Retire ${displayName}?`}
      consequence={`The sheet stops being editable and frees this player's active slot in the campaign. Everything stays readable, and you can return them to play later.`}
      confirmLabel="Retire sheet"
      cancelLabel="Keep in play"
      destructive={false}
      isPending={retire.isPending}
      onConfirm={() => retire.mutate({ campaignId, sheetId })}
    />
  );
}
