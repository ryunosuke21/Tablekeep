"use client";

import { useState } from "react";

import { Button } from "@tablekeep/ui/components/button";
import { Field, FieldLabel } from "@tablekeep/ui/components/field";
import { Input } from "@tablekeep/ui/components/input";
import { LoadingSwap } from "@tablekeep/ui/components/loading-swap";
import { Textarea } from "@tablekeep/ui/components/textarea";

import { ConfirmActionDialog } from "@/components/campaigns/confirm-action-dialog";
import { MAX_SHEET_NPCS } from "@/lib/constants";
import type { RouterOutputs } from "@/trpc/react";
import { api } from "@/trpc/react";

import { SaveStatus, saveState } from "./save-status";
import { EmptyNote, ReadEntry, ReadList } from "./sheet-readouts";
import { SheetRow } from "./sheet-section";

type SheetNpc = RouterOutputs["character"]["sheet"]["get"]["npcs"][number];

function NpcRow({
  campaignId,
  sheetId,
  entry,
  disabled,
}: {
  campaignId: string;
  sheetId: string;
  entry: SheetNpc;
  disabled: boolean;
}) {
  const utils = api.useUtils();
  const [name, setName] = useState(entry.name);
  const [relationship, setRelationship] = useState(entry.relationship ?? "");
  const [notes, setNotes] = useState(entry.notes ?? "");

  const invalidate = () =>
    void utils.character.sheet.get.invalidate({ campaignId, sheetId });
  const update = api.character.sheet.npc.update.useMutation({
    onSuccess: invalidate,
  });
  const remove = api.character.sheet.npc.remove.useMutation({
    onSuccess: invalidate,
  });

  const nameInvalid = name.trim().length === 0;
  const isPending = update.isPending || remove.isPending;

  function save() {
    if (nameInvalid) return;
    update.mutate({
      campaignId,
      sheetId,
      npcId: entry.id,
      name: name.trim(),
      relationship: relationship.trim() ? relationship.trim() : null,
      notes: notes.trim() ? notes.trim() : null,
    });
  }

  return (
    <SheetRow>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor={`npc-name-${entry.id}`}>Name</FieldLabel>
          <Input
            id={`npc-name-${entry.id}`}
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={100}
            autoComplete="off"
            className="h-11 px-3 text-base"
            disabled={disabled || isPending}
            aria-invalid={nameInvalid}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor={`npc-relationship-${entry.id}`}>
            Relationship
          </FieldLabel>
          <Input
            id={`npc-relationship-${entry.id}`}
            value={relationship}
            onChange={(event) => setRelationship(event.target.value)}
            maxLength={120}
            autoComplete="off"
            placeholder="Mentor, rival, the one who owes them"
            className="h-11 px-3 text-base"
            disabled={disabled || isPending}
          />
        </Field>
      </div>

      <Field className="mt-3">
        <FieldLabel htmlFor={`npc-notes-${entry.id}`}>Notes</FieldLabel>
        <Textarea
          id={`npc-notes-${entry.id}`}
          rows={3}
          maxLength={2000}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="How they met, and what is still unsettled between them."
          disabled={disabled || isPending}
        />
      </Field>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button
          type="button"
          className="min-h-10"
          disabled={disabled || isPending || nameInvalid}
          onClick={save}
        >
          <LoadingSwap isLoading={update.isPending}>Save contact</LoadingSwap>
        </Button>

        <ConfirmActionDialog
          trigger={
            <Button
              type="button"
              variant="ghost"
              className="min-h-10 text-destructive hover:text-destructive"
              disabled={disabled || isPending}
            >
              Remove
            </Button>
          }
          title={`Remove ${entry.name}?`}
          consequence={`${entry.name} comes off this character's connections. The campaign is untouched.`}
          confirmLabel="Remove contact"
          cancelLabel="Keep contact"
          isPending={remove.isPending}
          onConfirm={() =>
            remove.mutate({ campaignId, sheetId, npcId: entry.id })
          }
        />

        <SaveStatus
          state={saveState(update, remove)}
          onRetry={save}
          className="basis-full sm:basis-auto"
        />
      </div>
    </SheetRow>
  );
}

export function SheetNpcs({
  campaignId,
  sheetId,
  npcs,
  disabled,
  canEdit,
}: {
  campaignId: string;
  sheetId: string;
  npcs: SheetNpc[];
  disabled: boolean;
  canEdit: boolean;
}) {
  const utils = api.useUtils();
  const [name, setName] = useState("");

  const create = api.character.sheet.npc.create.useMutation({
    onSuccess: () => {
      setName("");
      void utils.character.sheet.get.invalidate({ campaignId, sheetId });
    },
  });

  if (!canEdit) {
    if (npcs.length === 0) {
      return <EmptyNote>No connections recorded yet.</EmptyNote>;
    }
    return (
      <ReadList>
        {npcs.map((entry) => (
          <ReadEntry
            key={entry.id}
            name={entry.name}
            meta={entry.relationship}
            notes={entry.notes}
          />
        ))}
      </ReadList>
    );
  }

  const atLimit = npcs.length >= MAX_SHEET_NPCS;
  const invalid = name.trim().length === 0;

  function submit() {
    if (invalid) return;
    create.mutate({
      campaignId,
      sheetId,
      name: name.trim(),
      sort: npcs.length,
    });
  }

  return (
    <>
      {npcs.length > 0 ? (
        <div className="rounded-xl border px-4 py-4">
          {npcs.map((entry) => (
            <NpcRow
              key={entry.id}
              campaignId={campaignId}
              sheetId={sheetId}
              entry={entry}
              disabled={disabled}
            />
          ))}
        </div>
      ) : (
        <EmptyNote>
          No connections yet. Record the people this character carries with
          them.
        </EmptyNote>
      )}

      {atLimit ? (
        <p className="mt-5 text-muted-foreground text-sm">
          This sheet holds up to {MAX_SHEET_NPCS} connections.
        </p>
      ) : (
        <form
          className="mt-5 rounded-xl border border-dashed px-4 py-4"
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
        >
          <Field>
            <FieldLabel htmlFor="new-npc-name">Add a connection</FieldLabel>
            <Input
              id="new-npc-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={100}
              autoComplete="off"
              placeholder="Who they know"
              className="h-11 px-3 text-base"
              disabled={disabled || create.isPending}
            />
          </Field>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Button
              type="submit"
              variant="outline"
              className="min-h-10"
              disabled={disabled || create.isPending || invalid}
            >
              <LoadingSwap isLoading={create.isPending}>
                Add connection
              </LoadingSwap>
            </Button>
            <SaveStatus
              state={saveState(create)}
              savedLabel="Connection added"
              onRetry={submit}
            />
          </div>
        </form>
      )}
    </>
  );
}
