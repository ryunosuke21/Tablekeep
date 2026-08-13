"use client";

import { useState } from "react";

import { Button } from "@tablekeep/ui/components/button";
import { Checkbox } from "@tablekeep/ui/components/checkbox";
import { Field, FieldLabel } from "@tablekeep/ui/components/field";
import { Input } from "@tablekeep/ui/components/input";
import { Label } from "@tablekeep/ui/components/label";
import { LoadingSwap } from "@tablekeep/ui/components/loading-swap";
import { Textarea } from "@tablekeep/ui/components/textarea";

import { ConfirmActionDialog } from "@/components/campaigns/confirm-action-dialog";
import { MAX_SHEET_SPELLS, MAX_SPELL_LEVEL } from "@/lib/constants";
import type { RouterOutputs } from "@/trpc/react";
import { api } from "@/trpc/react";

import { CatalogNameField } from "./catalog-name-field";
import { SaveStatus, saveState } from "./save-status";
import { EmptyNote, ReadChip, ReadEntry, ReadList } from "./sheet-readouts";
import { SheetRow } from "./sheet-section";

type SheetSpell = RouterOutputs["character"]["sheet"]["get"]["spells"][number];

/** Suggestions only; a failed catalog leaves the field a plain text input. */
function useSpellNames() {
  const catalog = api.wiki.spells.catalog.useQuery(undefined, {
    retry: false,
    staleTime: 60 * 60 * 1000,
  });
  return [
    ...new Set((catalog.data?.items ?? []).map((entry) => entry.name)),
  ].sort((left, right) => left.localeCompare(right));
}

/** Level 0 is a cantrip at most tables; anything else reads as a rank. */
function levelLabel(level: number) {
  return level === 0 ? "Cantrip" : `Level ${level}`;
}

function groupByLevel(spells: SheetSpell[]) {
  const groups = new Map<number, SheetSpell[]>();
  for (const spell of spells) {
    const bucket = groups.get(spell.level);
    if (bucket) bucket.push(spell);
    else groups.set(spell.level, [spell]);
  }
  return [...groups.entries()].sort(([left], [right]) => left - right);
}

function SpellRow({
  campaignId,
  sheetId,
  entry,
  suggestions,
  disabled,
}: {
  campaignId: string;
  sheetId: string;
  entry: SheetSpell;
  suggestions: string[];
  disabled: boolean;
}) {
  const utils = api.useUtils();
  const [name, setName] = useState(entry.name);
  const [level, setLevel] = useState(String(entry.level));
  const [notes, setNotes] = useState(entry.notes ?? "");

  const invalidate = () =>
    void utils.character.sheet.get.invalidate({ campaignId, sheetId });
  const update = api.character.sheet.spell.update.useMutation({
    onSuccess: invalidate,
  });
  const remove = api.character.sheet.spell.remove.useMutation({
    onSuccess: invalidate,
  });

  const parsedLevel = Number(level);
  const levelInvalid =
    !Number.isInteger(parsedLevel) ||
    parsedLevel < 0 ||
    parsedLevel > MAX_SPELL_LEVEL;
  const nameInvalid = name.trim().length === 0;
  const isPending = update.isPending || remove.isPending;

  function save() {
    if (nameInvalid || levelInvalid) return;
    update.mutate({
      campaignId,
      sheetId,
      spellId: entry.id,
      name: name.trim(),
      level: parsedLevel,
      notes: notes.trim() ? notes.trim() : null,
    });
  }

  return (
    <SheetRow>
      <div className="grid gap-3 sm:grid-cols-[1fr_7rem]">
        <Field>
          <FieldLabel htmlFor={`spell-name-${entry.id}`}>Spell</FieldLabel>
          <CatalogNameField
            id={`spell-name-${entry.id}`}
            value={name}
            onChange={setName}
            suggestions={suggestions}
            maxLength={100}
            disabled={disabled || isPending}
            aria-invalid={nameInvalid}
            className="h-11 px-3 text-base"
          />
        </Field>
        <Field>
          <FieldLabel htmlFor={`spell-level-${entry.id}`}>Level</FieldLabel>
          <Input
            id={`spell-level-${entry.id}`}
            type="number"
            inputMode="numeric"
            step={1}
            min={0}
            max={MAX_SPELL_LEVEL}
            value={level}
            onChange={(event) => setLevel(event.target.value)}
            className="h-11 px-3 text-base tabular-nums"
            disabled={disabled || isPending}
            aria-invalid={levelInvalid}
          />
        </Field>
      </div>

      <Field className="mt-3">
        <FieldLabel htmlFor={`spell-notes-${entry.id}`}>Notes</FieldLabel>
        <Textarea
          id={`spell-notes-${entry.id}`}
          rows={2}
          maxLength={2000}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="How this table rules it, or what it cost last time."
          disabled={disabled || isPending}
        />
      </Field>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <span className="flex items-center gap-2">
          <Checkbox
            id={`spell-prepared-${entry.id}`}
            checked={entry.prepared}
            disabled={disabled || isPending}
            onCheckedChange={(checked) =>
              update.mutate({
                campaignId,
                sheetId,
                spellId: entry.id,
                prepared: checked === true,
              })
            }
          />
          <Label htmlFor={`spell-prepared-${entry.id}`} className="text-sm">
            Prepared
          </Label>
        </span>

        <Button
          type="button"
          className="min-h-10"
          disabled={disabled || isPending || nameInvalid || levelInvalid}
          onClick={save}
        >
          <LoadingSwap isLoading={update.isPending}>Save spell</LoadingSwap>
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
          consequence={`${entry.name} comes out of this spellbook. Other campaigns are untouched.`}
          confirmLabel="Remove spell"
          cancelLabel="Keep spell"
          isPending={remove.isPending}
          onConfirm={() =>
            remove.mutate({ campaignId, sheetId, spellId: entry.id })
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

export function SheetSpells({
  campaignId,
  sheetId,
  spells,
  disabled,
  canEdit,
}: {
  campaignId: string;
  sheetId: string;
  spells: SheetSpell[];
  disabled: boolean;
  canEdit: boolean;
}) {
  const utils = api.useUtils();
  const suggestions = useSpellNames();
  const [name, setName] = useState("");
  const [level, setLevel] = useState("0");
  const [prepared, setPrepared] = useState(false);

  const create = api.character.sheet.spell.create.useMutation({
    onSuccess: () => {
      setName("");
      setLevel("0");
      setPrepared(false);
      void utils.character.sheet.get.invalidate({ campaignId, sheetId });
    },
  });

  const preparedCount = spells.filter((spell) => spell.prepared).length;

  if (!canEdit) {
    if (spells.length === 0) {
      return <EmptyNote>This character has no spells recorded.</EmptyNote>;
    }
    return (
      <div className="flex flex-col gap-5">
        <p className="text-muted-foreground text-sm">
          {spells.length} learned · {preparedCount} prepared
        </p>
        {groupByLevel(spells).map(([spellLevel, entries]) => (
          <div key={spellLevel}>
            <h3 className="mb-2 text-[10px] text-muted-foreground uppercase tracking-[0.14em]">
              {levelLabel(spellLevel)}
            </h3>
            <ReadList>
              {entries.map((entry) => (
                <ReadEntry
                  key={entry.id}
                  name={entry.name}
                  notes={entry.notes}
                  muted={!entry.prepared}
                  badges={
                    entry.prepared ? <ReadChip>Prepared</ReadChip> : undefined
                  }
                />
              ))}
            </ReadList>
          </div>
        ))}
      </div>
    );
  }

  const atLimit = spells.length >= MAX_SHEET_SPELLS;
  const parsedLevel = Number(level);
  const invalid =
    name.trim().length === 0 ||
    !Number.isInteger(parsedLevel) ||
    parsedLevel < 0 ||
    parsedLevel > MAX_SPELL_LEVEL;

  function submit() {
    if (invalid) return;
    create.mutate({
      campaignId,
      sheetId,
      name: name.trim(),
      level: parsedLevel,
      prepared,
      source: "custom",
      sort: spells.length,
    });
  }

  return (
    <>
      {spells.length > 0 ? (
        <>
          <p className="mb-4 text-muted-foreground text-sm">
            {spells.length} learned · {preparedCount} prepared
          </p>
          <div className="rounded-xl border px-4 py-4">
            {spells.map((entry) => (
              <SpellRow
                key={entry.id}
                campaignId={campaignId}
                sheetId={sheetId}
                entry={entry}
                suggestions={suggestions}
                disabled={disabled}
              />
            ))}
          </div>
        </>
      ) : (
        <EmptyNote>
          No spells yet. Add what this character has learned, then mark what is
          prepared today.
        </EmptyNote>
      )}

      {atLimit ? (
        <p className="mt-5 text-muted-foreground text-sm">
          This spellbook holds up to {MAX_SHEET_SPELLS} spells.
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
              <FieldLabel htmlFor="new-spell-name">Add a spell</FieldLabel>
              <CatalogNameField
                id="new-spell-name"
                value={name}
                onChange={setName}
                suggestions={suggestions}
                maxLength={100}
                placeholder="Any spell your table uses"
                disabled={disabled || create.isPending}
                className="h-11 px-3 text-base"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="new-spell-level">Level</FieldLabel>
              <Input
                id="new-spell-level"
                type="number"
                inputMode="numeric"
                step={1}
                min={0}
                max={MAX_SPELL_LEVEL}
                value={level}
                onChange={(event) => setLevel(event.target.value)}
                className="h-11 px-3 text-base tabular-nums"
                disabled={disabled || create.isPending}
              />
            </Field>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-2">
              <Checkbox
                id="new-spell-prepared"
                checked={prepared}
                disabled={disabled || create.isPending}
                onCheckedChange={(checked) => setPrepared(checked === true)}
              />
              <Label htmlFor="new-spell-prepared" className="text-sm">
                Prepared already
              </Label>
            </span>
            <Button
              type="submit"
              variant="outline"
              className="min-h-10"
              disabled={disabled || create.isPending || invalid}
            >
              <LoadingSwap isLoading={create.isPending}>Add spell</LoadingSwap>
            </Button>
            <SaveStatus
              state={saveState(create)}
              savedLabel="Spell added"
              onRetry={submit}
            />
          </div>
        </form>
      )}
    </>
  );
}
