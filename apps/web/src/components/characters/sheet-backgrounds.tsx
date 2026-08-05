"use client";

import { useState } from "react";

import { Button } from "@tablekeep/ui/components/button";
import { Field, FieldLabel } from "@tablekeep/ui/components/field";
import { LoadingSwap } from "@tablekeep/ui/components/loading-swap";
import { Textarea } from "@tablekeep/ui/components/textarea";

import { ConfirmActionDialog } from "@/components/campaigns/confirm-action-dialog";
import { MAX_SHEET_BACKGROUNDS } from "@/lib/constants";
import type { RouterOutputs } from "@/trpc/react";
import { api } from "@/trpc/react";

import { CatalogNameField } from "./catalog-name-field";
import { SaveStatus, saveState } from "./save-status";
import { SheetRow } from "./sheet-section";

type SheetBackground =
  RouterOutputs["character"]["sheet"]["get"]["backgrounds"][number];

/** Suggestions only; a failed catalog leaves the field a plain text input. */
function useBackgroundNames() {
  const catalog = api.backgrounds.list.useQuery(
    { limit: 100 },
    { retry: false, staleTime: 60 * 60 * 1000 },
  );
  return (catalog.data ?? []).map((entry) => entry.name);
}

function BackgroundRow({
  campaignId,
  sheetId,
  entry,
  suggestions,
  disabled,
}: {
  campaignId: string;
  sheetId: string;
  entry: SheetBackground;
  suggestions: string[];
  disabled: boolean;
}) {
  const utils = api.useUtils();
  const [name, setName] = useState(entry.name);
  const [notes, setNotes] = useState(entry.notes ?? "");

  const invalidate = () =>
    void utils.character.sheet.get.invalidate({ campaignId, sheetId });
  const update = api.character.sheet.background.update.useMutation({
    onSuccess: invalidate,
  });
  const remove = api.character.sheet.background.remove.useMutation({
    onSuccess: invalidate,
  });

  const nameInvalid = name.trim().length === 0;
  const isPending = update.isPending || remove.isPending;

  function save() {
    if (nameInvalid) return;
    update.mutate({
      campaignId,
      sheetId,
      backgroundId: entry.id,
      name: name.trim(),
      notes: notes.trim() ? notes.trim() : null,
    });
  }

  return (
    <SheetRow>
      <Field>
        <FieldLabel htmlFor={`background-name-${entry.id}`}>
          Background
        </FieldLabel>
        <CatalogNameField
          id={`background-name-${entry.id}`}
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
        <FieldLabel htmlFor={`background-notes-${entry.id}`}>Notes</FieldLabel>
        <Textarea
          id={`background-notes-${entry.id}`}
          rows={3}
          maxLength={2000}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="What this background gives them at your table."
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
          <LoadingSwap isLoading={update.isPending}>
            Save background
          </LoadingSwap>
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
          confirmLabel="Remove background"
          cancelLabel="Keep background"
          isPending={remove.isPending}
          onConfirm={() =>
            remove.mutate({ campaignId, sheetId, backgroundId: entry.id })
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

export function SheetBackgrounds({
  campaignId,
  sheetId,
  backgrounds,
  disabled,
}: {
  campaignId: string;
  sheetId: string;
  backgrounds: SheetBackground[];
  disabled: boolean;
}) {
  const utils = api.useUtils();
  const suggestions = useBackgroundNames();
  const [name, setName] = useState("");

  const create = api.character.sheet.background.create.useMutation({
    onSuccess: () => {
      setName("");
      void utils.character.sheet.get.invalidate({ campaignId, sheetId });
    },
  });

  const atLimit = backgrounds.length >= MAX_SHEET_BACKGROUNDS;
  const invalid = name.trim().length === 0;

  function submit() {
    if (invalid) return;
    create.mutate({
      campaignId,
      sheetId,
      name: name.trim(),
      source: "custom",
      sort: backgrounds.length,
    });
  }

  return (
    <>
      {backgrounds.length > 0 ? (
        <div className="rounded-xl border px-4 py-4">
          {backgrounds.map((entry) => (
            <BackgroundRow
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
        <p className="text-muted-foreground text-sm">
          No background yet. A character can carry more than one.
        </p>
      )}

      {atLimit ? (
        <p className="mt-5 text-muted-foreground text-sm">
          This sheet holds up to {MAX_SHEET_BACKGROUNDS} backgrounds.
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
            <FieldLabel htmlFor="new-background-name">
              Add a background
            </FieldLabel>
            <CatalogNameField
              id="new-background-name"
              value={name}
              onChange={setName}
              suggestions={suggestions}
              maxLength={100}
              placeholder="Sailor, guild artisan, or your own"
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
              <LoadingSwap isLoading={create.isPending}>
                Add background
              </LoadingSwap>
            </Button>
            <SaveStatus
              state={saveState(create)}
              savedLabel="Background added"
              onRetry={submit}
            />
          </div>
        </form>
      )}
    </>
  );
}
