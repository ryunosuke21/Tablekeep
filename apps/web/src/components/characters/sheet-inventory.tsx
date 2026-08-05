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
import { MAX_ITEM_QTY, MAX_SHEET_ITEMS } from "@/lib/constants";
import type { RouterOutputs } from "@/trpc/react";
import { api } from "@/trpc/react";

import { SaveStatus, saveState } from "./save-status";
import { SheetRow } from "./sheet-section";

type SheetItem = RouterOutputs["character"]["sheet"]["get"]["items"][number];

function ItemRow({
  campaignId,
  sheetId,
  entry,
  disabled,
}: {
  campaignId: string;
  sheetId: string;
  entry: SheetItem;
  disabled: boolean;
}) {
  const utils = api.useUtils();
  const [name, setName] = useState(entry.name);
  const [qty, setQty] = useState(String(entry.qty));
  const [notes, setNotes] = useState(entry.notes ?? "");
  const removed = entry.removedAt !== null;

  const invalidate = () =>
    void utils.character.sheet.get.invalidate({ campaignId, sheetId });
  const update = api.character.sheet.item.update.useMutation({
    onSuccess: invalidate,
  });
  const remove = api.character.sheet.item.remove.useMutation({
    onSuccess: invalidate,
  });
  const restore = api.character.sheet.item.restore.useMutation({
    onSuccess: invalidate,
  });

  const parsedQty = Number.parseInt(qty, 10);
  const qtyInvalid =
    !Number.isInteger(parsedQty) || parsedQty < 0 || parsedQty > MAX_ITEM_QTY;
  const nameInvalid = name.trim().length === 0;
  const isPending = update.isPending || remove.isPending || restore.isPending;

  function save() {
    if (nameInvalid || qtyInvalid) return;
    update.mutate({
      campaignId,
      sheetId,
      itemId: entry.id,
      name: name.trim(),
      qty: parsedQty,
      notes: notes.trim() ? notes.trim() : null,
    });
  }

  if (removed) {
    return (
      <SheetRow muted>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate font-medium text-sm line-through">
              {entry.name}
            </p>
            <p className="mt-0.5 text-muted-foreground text-xs tabular-nums">
              Removed · was ×{entry.qty}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Button
              type="button"
              variant="outline"
              className="min-h-10"
              disabled={disabled || restore.isPending}
              onClick={() =>
                restore.mutate({ campaignId, sheetId, itemId: entry.id })
              }
            >
              <LoadingSwap isLoading={restore.isPending}>
                Put {entry.name} back
              </LoadingSwap>
            </Button>
            <SaveStatus
              state={saveState(restore)}
              savedLabel="Back in the pack"
              onRetry={() =>
                restore.mutate({ campaignId, sheetId, itemId: entry.id })
              }
            />
          </div>
        </div>
      </SheetRow>
    );
  }

  return (
    <SheetRow>
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_6rem]">
        <Field>
          <FieldLabel htmlFor={`item-name-${entry.id}`}>Item</FieldLabel>
          <Input
            id={`item-name-${entry.id}`}
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={120}
            autoComplete="off"
            disabled={disabled || isPending}
            aria-invalid={nameInvalid}
            className="h-11 px-3 text-base"
          />
        </Field>
        <Field>
          <FieldLabel htmlFor={`item-qty-${entry.id}`}>Quantity</FieldLabel>
          <Input
            id={`item-qty-${entry.id}`}
            type="number"
            inputMode="numeric"
            min={0}
            max={MAX_ITEM_QTY}
            step={1}
            value={qty}
            onChange={(event) => setQty(event.target.value)}
            disabled={disabled || isPending}
            aria-invalid={qtyInvalid}
            className="h-11 px-3 text-base tabular-nums"
          />
        </Field>
      </div>

      <Field className="mt-3">
        <FieldLabel htmlFor={`item-notes-${entry.id}`}>Notes</FieldLabel>
        <Textarea
          id={`item-notes-${entry.id}`}
          rows={2}
          maxLength={2000}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Charges left, attunement, who it belonged to."
          disabled={disabled || isPending}
        />
      </Field>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <span className="flex items-center gap-2">
          <Checkbox
            id={`item-equipped-${entry.id}`}
            checked={entry.equipped}
            disabled={disabled || isPending}
            onCheckedChange={(checked) =>
              update.mutate({
                campaignId,
                sheetId,
                itemId: entry.id,
                equipped: checked === true,
              })
            }
          />
          <Label htmlFor={`item-equipped-${entry.id}`} className="text-sm">
            Equipped
          </Label>
        </span>

        <Button
          type="button"
          className="min-h-10"
          disabled={disabled || isPending || nameInvalid || qtyInvalid}
          onClick={save}
        >
          <LoadingSwap isLoading={update.isPending}>Save item</LoadingSwap>
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
          consequence={`${entry.name} leaves the inventory but stays listed under removed gear, so you can put it back if it turns up.`}
          confirmLabel="Remove item"
          cancelLabel="Keep item"
          isPending={remove.isPending}
          onConfirm={() =>
            remove.mutate({ campaignId, sheetId, itemId: entry.id })
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

export function SheetInventory({
  campaignId,
  sheetId,
  items,
  disabled,
}: {
  campaignId: string;
  sheetId: string;
  items: SheetItem[];
  disabled: boolean;
}) {
  const utils = api.useUtils();
  const [name, setName] = useState("");
  const [qty, setQty] = useState("1");
  const [equipped, setEquipped] = useState(false);

  const create = api.character.sheet.item.create.useMutation({
    onSuccess: () => {
      setName("");
      setQty("1");
      setEquipped(false);
      void utils.character.sheet.get.invalidate({ campaignId, sheetId });
    },
  });

  const carried = items.filter((item) => item.removedAt === null);
  const removed = items.filter((item) => item.removedAt !== null);
  const parsedQty = Number.parseInt(qty, 10);
  const invalid =
    name.trim().length === 0 ||
    !Number.isInteger(parsedQty) ||
    parsedQty < 0 ||
    parsedQty > MAX_ITEM_QTY;
  const atLimit = carried.length >= MAX_SHEET_ITEMS;

  function submit() {
    if (invalid) return;
    create.mutate({
      campaignId,
      sheetId,
      name: name.trim(),
      qty: parsedQty,
      equipped,
    });
  }

  return (
    <>
      {carried.length > 0 ? (
        <div className="rounded-xl border px-4 py-4">
          {carried.map((entry) => (
            <ItemRow
              key={entry.id}
              campaignId={campaignId}
              sheetId={sheetId}
              entry={entry}
              disabled={disabled}
            />
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground text-sm">
          Nothing carried yet. Add the gear that matters in play.
        </p>
      )}

      {atLimit ? (
        <p className="mt-5 text-muted-foreground text-sm">
          This sheet holds up to {MAX_SHEET_ITEMS} carried items.
        </p>
      ) : (
        <form
          className="mt-5 rounded-xl border border-dashed px-4 py-4"
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
        >
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_6rem]">
            <Field>
              <FieldLabel htmlFor="new-item-name">Add an item</FieldLabel>
              <Input
                id="new-item-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={120}
                autoComplete="off"
                placeholder="Rope, 50 ft."
                disabled={disabled || create.isPending}
                className="h-11 px-3 text-base"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="new-item-qty">Quantity to add</FieldLabel>
              <Input
                id="new-item-qty"
                type="number"
                inputMode="numeric"
                min={0}
                max={MAX_ITEM_QTY}
                step={1}
                value={qty}
                onChange={(event) => setQty(event.target.value)}
                disabled={disabled || create.isPending}
                className="h-11 px-3 text-base tabular-nums"
              />
            </Field>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-2">
              <Checkbox
                id="new-item-equipped"
                checked={equipped}
                disabled={disabled || create.isPending}
                onCheckedChange={(checked) => setEquipped(checked === true)}
              />
              <Label htmlFor="new-item-equipped" className="text-sm">
                Equipped on arrival
              </Label>
            </span>
            <Button
              type="submit"
              variant="outline"
              className="min-h-10"
              disabled={disabled || create.isPending || invalid}
            >
              <LoadingSwap isLoading={create.isPending}>Add item</LoadingSwap>
            </Button>
            <SaveStatus
              state={saveState(create)}
              savedLabel="Item added"
              onRetry={submit}
            />
          </div>
        </form>
      )}

      {removed.length > 0 ? (
        <div className="mt-7">
          <h3 className="font-medium text-sm">Removed gear</h3>
          <p className="mt-1 text-muted-foreground text-sm">
            Kept in case it comes back into play.
          </p>
          <div className="mt-4 rounded-xl border px-4 py-4">
            {removed.map((entry) => (
              <ItemRow
                key={entry.id}
                campaignId={campaignId}
                sheetId={sheetId}
                entry={entry}
                disabled={disabled}
              />
            ))}
          </div>
        </div>
      ) : null}
    </>
  );
}
