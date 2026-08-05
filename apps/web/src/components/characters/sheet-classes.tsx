"use client";

import { useState } from "react";
import { IconArrowDown, IconArrowUp } from "@tabler/icons-react";

import { Button } from "@tablekeep/ui/components/button";
import { Field, FieldLabel } from "@tablekeep/ui/components/field";
import { Input } from "@tablekeep/ui/components/input";
import { LoadingSwap } from "@tablekeep/ui/components/loading-swap";

import { ConfirmActionDialog } from "@/components/campaigns/confirm-action-dialog";
import { MAX_CLASS_LEVEL, MAX_SHEET_CLASSES } from "@/lib/constants";
import type { RouterOutputs } from "@/trpc/react";
import { api } from "@/trpc/react";

import { CatalogNameField } from "./catalog-name-field";
import { SaveStatus, saveState } from "./save-status";
import { SheetRow } from "./sheet-section";

type SheetClass = RouterOutputs["character"]["sheet"]["get"]["classes"][number];

type Catalog = {
  names: string[];
  subclassesByClass: Record<string, string[]>;
};

/** The wiki caps a page at 50 entries, which covers the reference classes. */
const CATALOG_LIMIT = 50;
const catalogQueryOptions = {
  retry: false,
  staleTime: 60 * 60 * 1000,
} as const;

/**
 * Reference classes are a convenience. The queries never retry and their
 * failure is silent, because every field here also accepts a homebrew name.
 * Classes and subclasses are separate wiki pages, so subclasses are grouped
 * back under their parent class for the subclass suggestions.
 */
function useClassCatalog(): Catalog {
  const classes = api.wiki.classes.list.useQuery(
    { limit: CATALOG_LIMIT, kind: "class" },
    catalogQueryOptions,
  );
  const subclasses = api.wiki.classes.list.useQuery(
    { limit: CATALOG_LIMIT, kind: "subclass" },
    catalogQueryOptions,
  );

  const subclassesByClass: Record<string, string[]> = {};
  for (const entry of subclasses.data?.items ?? []) {
    const parent = entry.parentClass?.name.trim().toLowerCase();
    if (!entry.isSubclass || !parent) continue;
    const group = subclassesByClass[parent] ?? [];
    group.push(entry.name);
    subclassesByClass[parent] = group;
  }

  return {
    names: (classes.data?.items ?? [])
      .filter((entry) => !entry.isSubclass)
      .map((entry) => entry.name),
    subclassesByClass,
  };
}

function subclassSuggestions(catalog: Catalog, className: string) {
  return catalog.subclassesByClass[className.trim().toLowerCase()] ?? [];
}

function ClassRow({
  campaignId,
  sheetId,
  entry,
  catalog,
  disabled,
  canMoveUp,
  canMoveDown,
  onMove,
  isMoving,
}: {
  campaignId: string;
  sheetId: string;
  entry: SheetClass;
  catalog: Catalog;
  disabled: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMove: (direction: -1 | 1) => void;
  isMoving: boolean;
}) {
  const utils = api.useUtils();
  const [name, setName] = useState(entry.name);
  const [subclass, setSubclass] = useState(entry.subclass ?? "");
  const [level, setLevel] = useState(String(entry.level));

  const invalidate = () =>
    void utils.character.sheet.get.invalidate({ campaignId, sheetId });

  const update = api.character.sheet.class.update.useMutation({
    onSuccess: invalidate,
  });
  const remove = api.character.sheet.class.remove.useMutation({
    onSuccess: () => {
      invalidate();
      void utils.character.list.invalidate();
    },
  });

  const parsedLevel = Number.parseInt(level, 10);
  const levelInvalid =
    !Number.isInteger(parsedLevel) ||
    parsedLevel < 1 ||
    parsedLevel > MAX_CLASS_LEVEL;
  const nameInvalid = name.trim().length === 0;
  const isPending = update.isPending || remove.isPending || isMoving;

  function save() {
    if (nameInvalid || levelInvalid) return;
    update.mutate({
      campaignId,
      sheetId,
      classId: entry.id,
      name: name.trim(),
      subclass: subclass.trim() ? subclass.trim() : null,
      level: parsedLevel,
    });
  }

  return (
    <SheetRow>
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_5.5rem]">
        <Field>
          <FieldLabel htmlFor={`class-name-${entry.id}`}>Class</FieldLabel>
          <CatalogNameField
            id={`class-name-${entry.id}`}
            value={name}
            onChange={setName}
            suggestions={catalog.names}
            maxLength={100}
            disabled={disabled || isPending}
            aria-invalid={nameInvalid}
            className="h-11 px-3 text-base"
          />
        </Field>

        <Field>
          <FieldLabel htmlFor={`class-subclass-${entry.id}`}>
            Subclass
          </FieldLabel>
          <CatalogNameField
            id={`class-subclass-${entry.id}`}
            value={subclass}
            onChange={setSubclass}
            suggestions={subclassSuggestions(catalog, name)}
            maxLength={100}
            placeholder="Optional"
            disabled={disabled || isPending}
            className="h-11 px-3 text-base"
          />
        </Field>

        <Field>
          <FieldLabel htmlFor={`class-level-${entry.id}`}>Level</FieldLabel>
          <Input
            id={`class-level-${entry.id}`}
            type="number"
            inputMode="numeric"
            min={1}
            max={MAX_CLASS_LEVEL}
            step={1}
            value={level}
            onChange={(event) => setLevel(event.target.value)}
            disabled={disabled || isPending}
            aria-invalid={levelInvalid}
            className="h-11 px-3 text-base tabular-nums"
          />
        </Field>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button
          type="button"
          className="min-h-10"
          disabled={disabled || isPending || nameInvalid || levelInvalid}
          onClick={save}
        >
          <LoadingSwap isLoading={update.isPending}>Save class</LoadingSwap>
        </Button>

        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-10"
          aria-label={`Move ${entry.name} earlier`}
          disabled={disabled || isPending || !canMoveUp}
          onClick={() => onMove(-1)}
        >
          <IconArrowUp aria-hidden="true" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-10"
          aria-label={`Move ${entry.name} later`}
          disabled={disabled || isPending || !canMoveDown}
          onClick={() => onMove(1)}
        >
          <IconArrowDown aria-hidden="true" />
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
          consequence={`This drops ${entry.name} and its ${entry.level} level${entry.level === 1 ? "" : "s"} from the sheet, lowering the total level. You can add the class again.`}
          confirmLabel="Remove class"
          cancelLabel="Keep class"
          isPending={remove.isPending}
          onConfirm={() =>
            remove.mutate({ campaignId, sheetId, classId: entry.id })
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

function AddClassForm({
  campaignId,
  sheetId,
  catalog,
  nextSort,
  disabled,
}: {
  campaignId: string;
  sheetId: string;
  catalog: Catalog;
  nextSort: number;
  disabled: boolean;
}) {
  const utils = api.useUtils();
  const [name, setName] = useState("");
  const [subclass, setSubclass] = useState("");
  const [level, setLevel] = useState("1");

  const create = api.character.sheet.class.create.useMutation({
    onSuccess: () => {
      setName("");
      setSubclass("");
      setLevel("1");
      void utils.character.sheet.get.invalidate({ campaignId, sheetId });
      void utils.character.list.invalidate();
    },
  });

  const parsedLevel = Number.parseInt(level, 10);
  const invalid =
    name.trim().length === 0 ||
    !Number.isInteger(parsedLevel) ||
    parsedLevel < 1 ||
    parsedLevel > MAX_CLASS_LEVEL;

  function submit() {
    if (invalid) return;
    create.mutate({
      campaignId,
      sheetId,
      name: name.trim(),
      subclass: subclass.trim() ? subclass.trim() : null,
      level: parsedLevel,
      source: "custom",
      sort: nextSort,
    });
  }

  return (
    <form
      className="mt-5 rounded-xl border border-dashed px-4 py-4"
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_5.5rem]">
        <Field>
          <FieldLabel htmlFor="new-class-name">Add a class</FieldLabel>
          <CatalogNameField
            id="new-class-name"
            value={name}
            onChange={setName}
            suggestions={catalog.names}
            maxLength={100}
            placeholder="Ranger, or your own"
            disabled={disabled || create.isPending}
            className="h-11 px-3 text-base"
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="new-class-subclass">
            Subclass for the new class
          </FieldLabel>
          <CatalogNameField
            id="new-class-subclass"
            value={subclass}
            onChange={setSubclass}
            suggestions={subclassSuggestions(catalog, name)}
            maxLength={100}
            placeholder="Optional"
            disabled={disabled || create.isPending}
            className="h-11 px-3 text-base"
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="new-class-level">Starting level</FieldLabel>
          <Input
            id="new-class-level"
            type="number"
            inputMode="numeric"
            min={1}
            max={MAX_CLASS_LEVEL}
            step={1}
            value={level}
            onChange={(event) => setLevel(event.target.value)}
            disabled={disabled || create.isPending}
            className="h-11 px-3 text-base tabular-nums"
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
          <LoadingSwap isLoading={create.isPending}>Add class</LoadingSwap>
        </Button>
        <SaveStatus
          state={saveState(create)}
          savedLabel="Class added"
          onRetry={submit}
        />
      </div>
    </form>
  );
}

export function SheetClasses({
  campaignId,
  sheetId,
  classes,
  totalLevel,
  disabled,
}: {
  campaignId: string;
  sheetId: string;
  classes: SheetClass[];
  totalLevel: number;
  disabled: boolean;
}) {
  const utils = api.useUtils();
  const catalog = useClassCatalog();
  const reorder = api.character.sheet.class.update.useMutation();

  async function move(index: number, direction: -1 | 1) {
    const current = classes[index];
    const neighbour = classes[index + direction];
    if (!current || !neighbour) return;

    // Swap the stored order; equal sort values fall back to creation order.
    await reorder.mutateAsync({
      campaignId,
      sheetId,
      classId: current.id,
      sort:
        neighbour.sort === current.sort ? index + direction : neighbour.sort,
    });
    await reorder.mutateAsync({
      campaignId,
      sheetId,
      classId: neighbour.id,
      sort: neighbour.sort === current.sort ? index : current.sort,
    });
    void utils.character.sheet.get.invalidate({ campaignId, sheetId });
  }

  const atLimit = classes.length >= MAX_SHEET_CLASSES;

  return (
    <>
      <p className="text-muted-foreground text-sm">
        Total level{" "}
        <span className="font-medium text-foreground tabular-nums">
          {totalLevel}
        </span>{" "}
        from {classes.length} class{classes.length === 1 ? "" : "es"}.
      </p>

      {classes.length > 0 ? (
        <div className="mt-4 rounded-xl border px-4 py-4">
          {classes.map((entry, index) => (
            <ClassRow
              key={entry.id}
              campaignId={campaignId}
              sheetId={sheetId}
              entry={entry}
              catalog={catalog}
              disabled={disabled}
              canMoveUp={index > 0}
              canMoveDown={index < classes.length - 1}
              isMoving={reorder.isPending}
              onMove={(direction) => void move(index, direction)}
            />
          ))}
        </div>
      ) : (
        <p className="mt-4 text-muted-foreground text-sm">
          No class recorded yet. Add the first one below.
        </p>
      )}

      {atLimit ? (
        <p className="mt-5 text-muted-foreground text-sm">
          This sheet holds up to {MAX_SHEET_CLASSES} classes. Remove one to add
          another.
        </p>
      ) : (
        <AddClassForm
          campaignId={campaignId}
          sheetId={sheetId}
          catalog={catalog}
          nextSort={classes.length}
          disabled={disabled}
        />
      )}
    </>
  );
}
