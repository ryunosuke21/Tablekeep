"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@tablekeep/ui/components/button";
import {
  Field,
  FieldDescription,
  FieldLabel,
} from "@tablekeep/ui/components/field";
import { LoadingSwap } from "@tablekeep/ui/components/loading-swap";
import { NativeSelectOption } from "@tablekeep/ui/components/native-select";
import { toast } from "@tablekeep/ui/components/sonner";

import { api } from "@/trpc/react";

import { SaveStatus, saveState } from "./save-status";

export type AttachableCharacter = { id: string; name: string };

/**
 * The player-side attach flow inside a campaign: pick one of your characters
 * and the campaign gets a sheet for them. Ownership is re-checked server-side.
 */
export function AttachCharacterForm({
  campaignId,
  campaignSlug,
  characters,
}: {
  campaignId: string;
  campaignSlug: string;
  characters: AttachableCharacter[];
}) {
  const router = useRouter();
  const [charId, setCharId] = useState(characters[0]?.id ?? "");

  const createSheet = api.character.sheet.create.useMutation({
    onSuccess: (sheet) => {
      toast.success("Sheet created");
      router.refresh();
      router.push(`/campaigns/${campaignSlug}/characters/${sheet.id}`);
    },
  });

  if (characters.length === 0) {
    return (
      <div className="rounded-xl border border-dashed px-5 py-6">
        <p className="font-medium text-sm">Name a character first</p>
        <p className="mt-1 text-muted-foreground text-sm">
          You have no character free for this table. Create one, then bring them
          in.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button asChild className="min-h-10">
            <Link href="/characters/new">Create a character</Link>
          </Button>
          <Button asChild variant="outline" className="min-h-10">
            <Link href="/characters">See your characters</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form
      className="rounded-xl border px-5 py-5"
      onSubmit={(event) => {
        event.preventDefault();
        if (!charId) return;
        createSheet.mutate({ campaignId, charId });
      }}
    >
      <Field>
        <FieldLabel htmlFor="attach-character">Your character</FieldLabel>
        <select
          id="attach-character"
          className="h-11 w-full min-w-0 rounded-lg border border-input bg-transparent px-3 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 dark:bg-input/30"
          value={charId}
          disabled={createSheet.isPending}
          onChange={(event) => setCharId(event.target.value)}
        >
          {characters.map((character) => (
            <NativeSelectOption key={character.id} value={character.id}>
              {character.name}
            </NativeSelectOption>
          ))}
        </select>
        <FieldDescription>
          One active sheet per player, per campaign. Retire a sheet before
          bringing in someone new.
        </FieldDescription>
      </Field>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button
          type="submit"
          className="min-h-11"
          disabled={createSheet.isPending || !charId}
        >
          <LoadingSwap isLoading={createSheet.isPending}>
            Bring them to the table
          </LoadingSwap>
        </Button>
        <SaveStatus
          state={saveState(createSheet)}
          savedLabel="Sheet created"
          onRetry={() =>
            charId ? createSheet.mutate({ campaignId, charId }) : undefined
          }
        />
      </div>
    </form>
  );
}
