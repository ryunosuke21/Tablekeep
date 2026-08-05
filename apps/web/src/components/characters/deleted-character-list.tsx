"use client";

import { useRouter } from "next/navigation";

import { Button } from "@tablekeep/ui/components/button";
import { LoadingSwap } from "@tablekeep/ui/components/loading-swap";
import { toast } from "@tablekeep/ui/components/sonner";

import { formatDate } from "@/lib/campaign-format";
import { api } from "@/trpc/react";

import { SaveStatus, saveState } from "./save-status";
import { SheetRow } from "./sheet-section";

export type DeletedCharacter = {
  id: string;
  name: string;
  deletedAt: Date | null;
};

function RestoreCharacterRow({ character }: { character: DeletedCharacter }) {
  const router = useRouter();
  const restore = api.character.restore.useMutation({
    onSuccess: (restored) => {
      toast.success(`${restored.name} is back in your roster`);
      router.refresh();
    },
    onError: (error) => {
      toast.error("That character was not restored", {
        description: error.message,
      });
    },
  });

  return (
    <SheetRow muted>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-medium text-sm">{character.name}</p>
          <p className="mt-0.5 text-muted-foreground text-xs">
            {character.deletedAt
              ? `Deleted ${formatDate(character.deletedAt)}`
              : "Deleted"}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Button
            type="button"
            variant="outline"
            className="min-h-10"
            disabled={restore.isPending}
            onClick={() => restore.mutate({ charId: character.id })}
          >
            <LoadingSwap isLoading={restore.isPending}>
              Restore {character.name}
            </LoadingSwap>
          </Button>
          <SaveStatus
            state={saveState(restore)}
            savedLabel="Restored"
            onRetry={() => restore.mutate({ charId: character.id })}
          />
        </div>
      </div>
    </SheetRow>
  );
}

/**
 * Deleted characters stay recoverable: their campaign sheets were retired, not
 * erased, so restoring the identity brings the record back for reattachment.
 */
export function DeletedCharacterList({
  characters,
}: {
  characters: DeletedCharacter[];
}) {
  return (
    <div className="rounded-xl border px-5 py-4">
      {characters.map((character) => (
        <RestoreCharacterRow key={character.id} character={character} />
      ))}
    </div>
  );
}
