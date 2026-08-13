"use client";

import { useState } from "react";
import { IconX } from "@tabler/icons-react";

import { Button } from "@tablekeep/ui/components/button";
import { Field, FieldLabel } from "@tablekeep/ui/components/field";
import { Input } from "@tablekeep/ui/components/input";
import { LoadingSwap } from "@tablekeep/ui/components/loading-swap";

import { MAX_SHEET_CONDITIONS } from "@/lib/constants";
import type { RouterOutputs } from "@/trpc/react";
import { api } from "@/trpc/react";

import { SaveStatus, saveState } from "./save-status";
import { EmptyNote, ReadChip } from "./sheet-readouts";

type SheetCondition =
  RouterOutputs["character"]["sheet"]["get"]["conditions"][number];

function ConditionChip({
  campaignId,
  sheetId,
  entry,
  disabled,
}: {
  campaignId: string;
  sheetId: string;
  entry: SheetCondition;
  disabled: boolean;
}) {
  const utils = api.useUtils();
  const remove = api.character.sheet.condition.remove.useMutation({
    onSuccess: () =>
      void utils.character.sheet.get.invalidate({ campaignId, sheetId }),
  });

  return (
    <span className="inline-flex items-center gap-1 rounded-full border bg-muted/40 py-1 pr-1 pl-3 text-sm">
      <span className="font-medium">{entry.name}</span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-8 rounded-full"
        aria-label={`Clear ${entry.name}`}
        disabled={disabled || remove.isPending}
        onClick={() =>
          remove.mutate({ campaignId, sheetId, conditionId: entry.id })
        }
      >
        <IconX aria-hidden="true" className="size-4" />
      </Button>
    </span>
  );
}

/**
 * Conditions change constantly mid-session, so clearing one is a single tap and
 * carries no confirmation: it is recorded as removed and can be added straight
 * back.
 */
export function SheetConditions({
  campaignId,
  sheetId,
  conditions,
  disabled,
  canEdit,
}: {
  campaignId: string;
  sheetId: string;
  conditions: SheetCondition[];
  disabled: boolean;
  canEdit: boolean;
}) {
  const utils = api.useUtils();
  const [name, setName] = useState("");

  const create = api.character.sheet.condition.create.useMutation({
    onSuccess: () => {
      setName("");
      void utils.character.sheet.get.invalidate({ campaignId, sheetId });
    },
  });

  if (!canEdit) {
    if (conditions.length === 0) {
      return <EmptyNote>Nothing is affecting them right now.</EmptyNote>;
    }
    return (
      <ul className="flex flex-wrap gap-2">
        {conditions.map((entry) => (
          <li key={entry.id}>
            <ReadChip>{entry.name}</ReadChip>
          </li>
        ))}
      </ul>
    );
  }

  const invalid = name.trim().length === 0;
  const atLimit = conditions.length >= MAX_SHEET_CONDITIONS;

  function submit() {
    if (invalid) return;
    create.mutate({ campaignId, sheetId, name: name.trim() });
  }

  return (
    <>
      {conditions.length > 0 ? (
        <ul className="flex flex-wrap gap-2">
          {conditions.map((entry) => (
            <li key={entry.id}>
              <ConditionChip
                campaignId={campaignId}
                sheetId={sheetId}
                entry={entry}
                disabled={disabled}
              />
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted-foreground text-sm">
          Nothing is affecting this character right now.
        </p>
      )}

      {atLimit ? null : (
        <form
          className="mt-5 flex flex-wrap items-end gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
        >
          <Field className="min-w-48 flex-1">
            <FieldLabel htmlFor="new-condition-name">
              Add a condition
            </FieldLabel>
            <Input
              id="new-condition-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={80}
              autoComplete="off"
              placeholder="Poisoned, blessed, on fire"
              disabled={disabled || create.isPending}
              className="h-11 px-3 text-base"
            />
          </Field>
          <Button
            type="submit"
            variant="outline"
            className="min-h-11"
            disabled={disabled || create.isPending || invalid}
          >
            <LoadingSwap isLoading={create.isPending}>Add</LoadingSwap>
          </Button>
          <SaveStatus
            state={saveState(create)}
            savedLabel="Condition added"
            onRetry={submit}
            className="basis-full"
          />
        </form>
      )}
    </>
  );
}
