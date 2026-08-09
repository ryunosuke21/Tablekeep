"use client";

import { useState } from "react";

import { Button } from "@tablekeep/ui/components/button";
import { Field, FieldLabel } from "@tablekeep/ui/components/field";
import { Input } from "@tablekeep/ui/components/input";
import { LoadingSwap } from "@tablekeep/ui/components/loading-swap";

import { ConfirmActionDialog } from "@/components/campaigns/confirm-action-dialog";
import { MAX_SHEET_STATS, MAX_STAT_VALUE } from "@/lib/constants";
import type { RouterOutputs } from "@/trpc/react";
import { api } from "@/trpc/react";

import { SaveStatus, saveState } from "./save-status";
import { EmptyNote, ReadStat } from "./sheet-readouts";
import { SheetRow } from "./sheet-section";

type SheetStat = RouterOutputs["character"]["sheet"]["get"]["stats"][number];

/** Common ability names, offered as a starting point rather than a rule. */
const SUGGESTED_STATS = [
  "Strength",
  "Dexterity",
  "Constitution",
  "Intelligence",
  "Wisdom",
  "Charisma",
];

function StatRow({
  campaignId,
  sheetId,
  entry,
  disabled,
}: {
  campaignId: string;
  sheetId: string;
  entry: SheetStat;
  disabled: boolean;
}) {
  const utils = api.useUtils();
  const [name, setName] = useState(entry.name);
  const [value, setValue] = useState(String(entry.value));

  const invalidate = () =>
    void utils.character.sheet.get.invalidate({ campaignId, sheetId });
  const update = api.character.sheet.stat.update.useMutation({
    onSuccess: invalidate,
  });
  const remove = api.character.sheet.stat.remove.useMutation({
    onSuccess: invalidate,
  });

  const parsed = Number(value);
  const invalid =
    name.trim().length === 0 ||
    !Number.isInteger(parsed) ||
    Math.abs(parsed) > MAX_STAT_VALUE;
  const isPending = update.isPending || remove.isPending;

  function save() {
    if (invalid) return;
    update.mutate({
      campaignId,
      sheetId,
      statId: entry.id,
      name: name.trim(),
      value: parsed,
    });
  }

  return (
    <SheetRow>
      <div className="grid gap-3 sm:grid-cols-[1fr_7rem]">
        <Field>
          <FieldLabel htmlFor={`stat-name-${entry.id}`}>Stat</FieldLabel>
          <Input
            id={`stat-name-${entry.id}`}
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={40}
            autoComplete="off"
            className="h-11 px-3 text-base"
            disabled={disabled || isPending}
            aria-invalid={name.trim().length === 0}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor={`stat-value-${entry.id}`}>Score</FieldLabel>
          <Input
            id={`stat-value-${entry.id}`}
            type="number"
            inputMode="numeric"
            step={1}
            min={-MAX_STAT_VALUE}
            max={MAX_STAT_VALUE}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            className="h-11 px-3 text-base tabular-nums"
            disabled={disabled || isPending}
            aria-invalid={invalid}
          />
        </Field>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button
          type="button"
          className="min-h-10"
          disabled={disabled || isPending || invalid}
          onClick={save}
        >
          <LoadingSwap isLoading={update.isPending}>Save stat</LoadingSwap>
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
          consequence={`${entry.name} comes off this sheet. Other campaigns are untouched.`}
          confirmLabel="Remove stat"
          cancelLabel="Keep stat"
          isPending={remove.isPending}
          onConfirm={() =>
            remove.mutate({ campaignId, sheetId, statId: entry.id })
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

export function SheetStats({
  campaignId,
  sheetId,
  stats,
  disabled,
  canEdit,
}: {
  campaignId: string;
  sheetId: string;
  stats: SheetStat[];
  disabled: boolean;
  canEdit: boolean;
}) {
  const utils = api.useUtils();
  const [name, setName] = useState("");
  const [value, setValue] = useState("10");

  const create = api.character.sheet.stat.create.useMutation({
    onSuccess: () => {
      setName("");
      setValue("10");
      void utils.character.sheet.get.invalidate({ campaignId, sheetId });
    },
  });

  if (!canEdit) {
    if (stats.length === 0) {
      return <EmptyNote>No stats recorded for this character yet.</EmptyNote>;
    }
    return (
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
        {stats.map((entry) => (
          <ReadStat key={entry.id} label={entry.name} value={entry.value} />
        ))}
      </div>
    );
  }

  const atLimit = stats.length >= MAX_SHEET_STATS;
  const parsed = Number(value);
  const invalid =
    name.trim().length === 0 ||
    !Number.isInteger(parsed) ||
    Math.abs(parsed) > MAX_STAT_VALUE;

  function submit() {
    if (invalid) return;
    create.mutate({
      campaignId,
      sheetId,
      name: name.trim(),
      value: parsed,
      sort: stats.length,
    });
  }

  return (
    <>
      {stats.length > 0 ? (
        <div className="rounded-xl border px-4 py-4">
          {stats.map((entry) => (
            <StatRow
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
          No stats yet. Name them however your table names them.
        </EmptyNote>
      )}

      {atLimit ? (
        <p className="mt-5 text-muted-foreground text-sm">
          This sheet holds up to {MAX_SHEET_STATS} stats.
        </p>
      ) : (
        <form
          className="mt-5 rounded-xl border border-dashed px-4 py-4"
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
        >
          <div className="grid gap-3 sm:grid-cols-[1fr_7rem]">
            <Field>
              <FieldLabel htmlFor="new-stat-name">Add a stat</FieldLabel>
              <Input
                id="new-stat-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                list="sheet-stat-suggestions"
                maxLength={40}
                autoComplete="off"
                placeholder="Strength, or your own"
                className="h-11 px-3 text-base"
                disabled={disabled || create.isPending}
              />
              <datalist id="sheet-stat-suggestions">
                {SUGGESTED_STATS.filter(
                  (suggestion) =>
                    !stats.some(
                      (entry) =>
                        entry.name.toLowerCase() === suggestion.toLowerCase(),
                    ),
                ).map((suggestion) => (
                  <option key={suggestion} value={suggestion} />
                ))}
              </datalist>
            </Field>
            <Field>
              <FieldLabel htmlFor="new-stat-value">Score</FieldLabel>
              <Input
                id="new-stat-value"
                type="number"
                inputMode="numeric"
                step={1}
                min={-MAX_STAT_VALUE}
                max={MAX_STAT_VALUE}
                value={value}
                onChange={(event) => setValue(event.target.value)}
                className="h-11 px-3 text-base tabular-nums"
                disabled={disabled || create.isPending}
              />
            </Field>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Button
              type="submit"
              variant="outline"
              className="min-h-10"
              disabled={disabled || create.isPending || invalid}
            >
              <LoadingSwap isLoading={create.isPending}>Add stat</LoadingSwap>
            </Button>
            <SaveStatus
              state={saveState(create)}
              savedLabel="Stat added"
              onRetry={submit}
            />
          </div>
        </form>
      )}
    </>
  );
}
