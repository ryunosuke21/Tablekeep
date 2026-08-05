"use client";

import { useRouter } from "next/navigation";

import { Button } from "@tablekeep/ui/components/button";
import { toast } from "@tablekeep/ui/components/sonner";

import { ConfirmActionDialog } from "@/components/campaigns/confirm-action-dialog";
import { api } from "@/trpc/react";

/**
 * Deleting a character retires its campaign sheets. It stays recoverable from
 * the characters list, and the dialog says so instead of implying erasure.
 */
export function DeleteCharacterDialog({
  charId,
  name,
  activeSheetCount,
}: {
  charId: string;
  name: string;
  activeSheetCount: number;
}) {
  const router = useRouter();
  const deleteCharacter = api.character.delete.useMutation({
    onSuccess: () => {
      toast.success(`${name} was deleted`, {
        description: "Restore them any time from Recently deleted.",
      });
      router.push("/characters");
      router.refresh();
    },
    onError: (error) => {
      toast.error("That character was not deleted", {
        description: error.message,
      });
    },
  });

  return (
    <ConfirmActionDialog
      trigger={
        <Button
          type="button"
          variant="outline"
          className="min-h-11 text-destructive hover:text-destructive"
          disabled={deleteCharacter.isPending}
        >
          Delete character
        </Button>
      }
      title={`Delete ${name}?`}
      consequence={
        activeSheetCount > 0
          ? `${name} leaves play and ${activeSheetCount === 1 ? "their campaign sheet is retired" : `their ${activeSheetCount} campaign sheets are retired`}. Nothing is erased — restore ${name} from Recently deleted to bring the sheets back.`
          : `${name} moves to Recently deleted. Nothing is erased, and you can restore them later.`
      }
      confirmLabel="Delete character"
      cancelLabel="Keep character"
      isPending={deleteCharacter.isPending}
      onConfirm={() => deleteCharacter.mutate({ charId })}
    />
  );
}
