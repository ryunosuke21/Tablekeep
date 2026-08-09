"use client";

import { useState } from "react";

import { Button } from "@tablekeep/ui/components/button";
import { Field, FieldLabel } from "@tablekeep/ui/components/field";
import { LoadingSwap } from "@tablekeep/ui/components/loading-swap";
import { Textarea } from "@tablekeep/ui/components/textarea";

import { ConfirmActionDialog } from "@/components/campaigns/confirm-action-dialog";
import { MAX_SHEET_FEATS } from "@/lib/constants";
import type { RouterOutputs } from "@/trpc/react";
import { api } from "@/trpc/react";

import { CatalogNameField } from "./catalog-name-field";
import { SaveStatus, saveState } from "./save-status";
import { EmptyNote, ReadEntry, ReadList } from "./sheet-readouts";
import { SheetRow } from "./sheet-section";

type SheetFeat = RouterOutputs["character"]["sheet"]["get"]["feats"][number];

/** Suggestions only; a failed catalog leaves the field a plain text input. */
function useFeatNames() {
  const catalog = api.wiki.feats.catalog.useQuery(undefined, {
    retry: false,
    staleTime: 60 * 60 * 1000,
  });
  return [
    ...new Set((catalog.data?.items ?? []).map((entry) => entry.name)),
  ].sort((left, right) => left.localeCompare(right));
}

function FeatRow({
  campaignId,
  sheetId,
  entry,
  suggestions,
  disabled,
}: {
  campaignId: string;
  sheetId: string;
  entry: SheetFeat;
  suggestions: string[];
  disabled: boolean;
}) {
  const utils = api.useUtils();
  const [name, setName] = useState(entry.name);
  const [notes, setNotes] = useState(entry.notes ?? "");

  const invalidate = () =>
    void utils.character.sheet.get.invalidate({ campaignId, sheetId });
  const update = api.character.sheet.feat.update.useMutation({
    onSuccess: invalidate,
  });
  const remove = api.character.sheet.feat.remove.useMutation({
    onSuccess: invalidate,
  });

  const nameInvalid = name.trim().length === 0;
  const isPending = update.isPending || remove.isPending;

  function save() {
    if (nameInvalid) return;
    update.mutate({
      campaignId,
      sheetId,
      featId: entry.id,
      name: name.trim(),
      notes: notes.trim() ? notes.trim() : null,
    });
  }

  return (
    <SheetRow>
      <Field>
        <FieldLabel htmlFor={`feat-name-${entry.id}`}>Feat</FieldLabel>
        <CatalogNameField
          id={`feat-name-${entry.id}`}
          value={name}
          onChange={setName}
          suggestions={suggestions}
          maxLength={100}
          disabled={disabled || isPending}
          aria-invalid={nameInvalid}
          className="h-11 px-3 text-base"
        />
      </Field>

      <Field className="mt-3">
        <FieldLabel htmlFor={`feat-notes-${entry.id}`}>Notes</FieldLabel>
        <Textarea
          id={`feat-notes-${entry.id}`}
          rows={3}
          maxLength={2000}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="What this feat does at your table."
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
          <LoadingSwap isLoading={update.isPending}>Save feat</LoadingSwap>
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
          consequence={`${entry.name} and its notes come off this sheet. Other campaigns are untouched.`}
          confirmLabel="Remove feat"
          cancelLabel="Keep feat"
          isPending={remove.isPending}
          onConfirm={() =>
            remove.mutate({ campaignId, sheetId, featId: entry.id })
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

export function SheetFeats({
  campaignId,
  sheetId,
  feats,
  disabled,
  canEdit,
}: {
  campaignId: string;
  sheetId: string;
  feats: SheetFeat[];
  disabled: boolean;
  canEdit: boolean;
}) {
  const utils = api.useUtils();
  const suggestions = useFeatNames();
  const [name, setName] = useState("");

  const create = api.character.sheet.feat.create.useMutation({
    onSuccess: () => {
      setName("");
      void utils.character.sheet.get.invalidate({ campaignId, sheetId });
    },
  });

  if (!canEdit) {
    if (feats.length === 0) {
      return <EmptyNote>No feats recorded on this sheet.</EmptyNote>;
    }
    return (
      <ReadList>
        {feats.map((entry) => (
          <ReadEntry key={entry.id} name={entry.name} notes={entry.notes} />
        ))}
      </ReadList>
    );
  }

  const atLimit = feats.length >= MAX_SHEET_FEATS;
  const invalid = name.trim().length === 0;

  function submit() {
    if (invalid) return;
    create.mutate({
      campaignId,
      sheetId,
      name: name.trim(),
      source: "custom",
      sort: feats.length,
    });
  }

  return (
    <>
      {feats.length > 0 ? (
        <div className="rounded-xl border px-4 py-4">
          {feats.map((entry) => (
            <FeatRow
              key={entry.id}
              campaignId={campaignId}
              sheetId={sheetId}
              entry={entry}
              suggestions={suggestions}
              disabled={disabled}
            />
          ))}
        </div>
      ) : (
        <EmptyNote>No feats yet.</EmptyNote>
      )}

      {atLimit ? (
        <p className="mt-5 text-muted-foreground text-sm">
          This sheet holds up to {MAX_SHEET_FEATS} feats.
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
            <FieldLabel htmlFor="new-feat-name">Add a feat</FieldLabel>
            <CatalogNameField
              id="new-feat-name"
              value={name}
              onChange={setName}
              suggestions={suggestions}
              maxLength={100}
              placeholder="Alert, tough, or your own"
              disabled={disabled || create.isPending}
              className="h-11 px-3 text-base"
            />
          </Field>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Button
              type="submit"
              variant="outline"
              className="min-h-10"
              disabled={disabled || create.isPending || invalid}
            >
              <LoadingSwap isLoading={create.isPending}>Add feat</LoadingSwap>
            </Button>
            <SaveStatus
              state={saveState(create)}
              savedLabel="Feat added"
              onRetry={submit}
            />
          </div>
        </form>
      )}
    </>
  );
}
