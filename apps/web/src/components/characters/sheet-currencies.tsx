"use client";

import { useState } from "react";

import { Button } from "@tablekeep/ui/components/button";
import { Field, FieldLabel } from "@tablekeep/ui/components/field";
import { Input } from "@tablekeep/ui/components/input";
import { LoadingSwap } from "@tablekeep/ui/components/loading-swap";

import { ConfirmActionDialog } from "@/components/campaigns/confirm-action-dialog";
import { MAX_CURRENCY_AMOUNT, MAX_SHEET_CURRENCIES } from "@/lib/constants";
import type { RouterOutputs } from "@/trpc/react";
import { api } from "@/trpc/react";

import { SaveStatus, saveState } from "./save-status";
import { SheetRow } from "./sheet-section";

type SheetCurrency =
  RouterOutputs["character"]["sheet"]["get"]["currencies"][number];

function CurrencyRow({
  campaignId,
  sheetId,
  entry,
  disabled,
}: {
  campaignId: string;
  sheetId: string;
  entry: SheetCurrency;
  disabled: boolean;
}) {
  const utils = api.useUtils();
  const [name, setName] = useState(entry.name);
  const [amount, setAmount] = useState(String(entry.amount));
  const removed = entry.removedAt !== null;

  const invalidate = () =>
    void utils.character.sheet.get.invalidate({ campaignId, sheetId });
  const update = api.character.sheet.currency.update.useMutation({
    onSuccess: invalidate,
  });
  const remove = api.character.sheet.currency.remove.useMutation({
    onSuccess: invalidate,
  });
  const restore = api.character.sheet.currency.restore.useMutation({
    onSuccess: invalidate,
  });

  const parsedAmount = Number.parseInt(amount, 10);
  const amountInvalid =
    !Number.isInteger(parsedAmount) ||
    parsedAmount < 0 ||
    parsedAmount > MAX_CURRENCY_AMOUNT;
  const nameInvalid = name.trim().length === 0;
  const isPending = update.isPending || remove.isPending || restore.isPending;

  function save() {
    if (nameInvalid || amountInvalid) return;
    update.mutate({
      campaignId,
      sheetId,
      currencyId: entry.id,
      name: name.trim(),
      amount: parsedAmount,
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
              Removed · held {entry.amount}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Button
              type="button"
              variant="outline"
              className="min-h-10"
              disabled={disabled || restore.isPending}
              onClick={() =>
                restore.mutate({
                  campaignId,
                  sheetId,
                  currencyId: entry.id,
                })
              }
            >
              <LoadingSwap isLoading={restore.isPending}>
                Restore {entry.name}
              </LoadingSwap>
            </Button>
            <SaveStatus
              state={saveState(restore)}
              savedLabel="Restored"
              onRetry={() =>
                restore.mutate({ campaignId, sheetId, currencyId: entry.id })
              }
            />
          </div>
        </div>
      </SheetRow>
    );
  }

  return (
    <SheetRow>
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_8rem]">
        <Field>
          <FieldLabel htmlFor={`currency-name-${entry.id}`}>
            Currency
          </FieldLabel>
          <Input
            id={`currency-name-${entry.id}`}
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={40}
            autoComplete="off"
            disabled={disabled || isPending}
            aria-invalid={nameInvalid}
            className="h-11 px-3 text-base"
          />
        </Field>
        <Field>
          <FieldLabel htmlFor={`currency-amount-${entry.id}`}>
            Amount
          </FieldLabel>
          <Input
            id={`currency-amount-${entry.id}`}
            type="number"
            inputMode="numeric"
            min={0}
            max={MAX_CURRENCY_AMOUNT}
            step={1}
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            disabled={disabled || isPending}
            aria-invalid={amountInvalid}
            className="h-11 px-3 text-base tabular-nums"
          />
        </Field>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button
          type="button"
          className="min-h-10"
          disabled={disabled || isPending || nameInvalid || amountInvalid}
          onClick={save}
        >
          <LoadingSwap isLoading={update.isPending}>Save currency</LoadingSwap>
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
          consequence={`${entry.name} stops showing in the purse. The balance of ${entry.amount} is kept, so restoring it brings the same amount back.`}
          confirmLabel="Remove currency"
          cancelLabel="Keep currency"
          isPending={remove.isPending}
          onConfirm={() =>
            remove.mutate({ campaignId, sheetId, currencyId: entry.id })
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

/**
 * Currencies are freely named: gold, favours, ration tokens. Nothing here
 * assumes a coin system.
 */
export function SheetCurrencies({
  campaignId,
  sheetId,
  currencies,
  disabled,
}: {
  campaignId: string;
  sheetId: string;
  currencies: SheetCurrency[];
  disabled: boolean;
}) {
  const utils = api.useUtils();
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("0");

  const create = api.character.sheet.currency.create.useMutation({
    onSuccess: () => {
      setName("");
      setAmount("0");
      void utils.character.sheet.get.invalidate({ campaignId, sheetId });
    },
  });

  const held = currencies.filter((currency) => currency.removedAt === null);
  const removed = currencies.filter((currency) => currency.removedAt !== null);
  const parsedAmount = Number.parseInt(amount, 10);
  const invalid =
    name.trim().length === 0 ||
    !Number.isInteger(parsedAmount) ||
    parsedAmount < 0 ||
    parsedAmount > MAX_CURRENCY_AMOUNT;
  const atLimit = held.length >= MAX_SHEET_CURRENCIES;

  function submit() {
    if (invalid) return;
    create.mutate({
      campaignId,
      sheetId,
      name: name.trim(),
      amount: parsedAmount,
    });
  }

  return (
    <>
      {held.length > 0 ? (
        <div className="rounded-xl border px-4 py-4">
          {held.map((entry) => (
            <CurrencyRow
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
          No currency tracked yet. Name whatever your table trades in.
        </p>
      )}

      {atLimit ? (
        <p className="mt-5 text-muted-foreground text-sm">
          This sheet holds up to {MAX_SHEET_CURRENCIES} currencies.
        </p>
      ) : (
        <form
          className="mt-5 rounded-xl border border-dashed px-4 py-4"
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
        >
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_8rem]">
            <Field>
              <FieldLabel htmlFor="new-currency-name">
                Add a currency
              </FieldLabel>
              <Input
                id="new-currency-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={40}
                autoComplete="off"
                placeholder="Gold, favours, salt"
                disabled={disabled || create.isPending}
                className="h-11 px-3 text-base"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="new-currency-amount">
                Starting amount
              </FieldLabel>
              <Input
                id="new-currency-amount"
                type="number"
                inputMode="numeric"
                min={0}
                max={MAX_CURRENCY_AMOUNT}
                step={1}
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
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
              <LoadingSwap isLoading={create.isPending}>
                Add currency
              </LoadingSwap>
            </Button>
            <SaveStatus
              state={saveState(create)}
              savedLabel="Currency added"
              onRetry={submit}
            />
          </div>
        </form>
      )}

      {removed.length > 0 ? (
        <div className="mt-7">
          <h3 className="font-medium text-sm">Removed currencies</h3>
          <div className="mt-4 rounded-xl border px-4 py-4">
            {removed.map((entry) => (
              <CurrencyRow
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
