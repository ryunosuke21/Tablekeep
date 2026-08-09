"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@tablekeep/ui/components/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@tablekeep/ui/components/field";
import { Input } from "@tablekeep/ui/components/input";
import { LoadingSwap } from "@tablekeep/ui/components/loading-swap";
import { Textarea } from "@tablekeep/ui/components/textarea";

import { MAX_CHARACTER_HP } from "@/lib/constants";
import { api } from "@/trpc/react";

import { SaveStatus, saveState } from "./save-status";
import { ReadField, ReadProse } from "./sheet-readouts";

const detailsSchema = z.object({
  name: z.string().trim().max(80, "Use 80 characters or fewer."),
  ancestry: z.string().trim().max(80, "Use 80 characters or fewer."),
  alignment: z.string().trim().max(80, "Use 80 characters or fewer."),
  appearance: z.string().trim().max(2_000, "Use 2000 characters or fewer."),
  maxHp: z
    .string()
    .trim()
    .regex(/^\d+$/, "Enter a whole number.")
    .transform(Number)
    .refine((value) => value >= 1, "Max HP is at least 1.")
    .refine(
      (value) => value <= MAX_CHARACTER_HP,
      "That is higher than this sheet allows.",
    ),
  notes: z.string().trim().max(5_000, "Use 5000 characters or fewer."),
});

type DetailsValues = z.input<typeof detailsSchema>;
type ParsedDetails = z.output<typeof detailsSchema>;

/**
 * Campaign-owned identity and the one hit-point number M3 records. There is no
 * current HP anywhere: that is table talk, not bookkeeping.
 */
export function SheetDetailsForm({
  campaignId,
  sheetId,
  name,
  ancestry,
  alignment,
  appearance,
  maxHp,
  notes,
  disabled,
  canEdit,
}: {
  campaignId: string;
  sheetId: string;
  name: string | null;
  ancestry: string | null;
  alignment: string | null;
  appearance: string | null;
  maxHp: number;
  notes: string | null;
  disabled: boolean;
  canEdit: boolean;
}) {
  const utils = api.useUtils();
  const current = {
    name: name ?? "",
    ancestry: ancestry ?? "",
    alignment: alignment ?? "",
    appearance: appearance ?? "",
    maxHp: String(maxHp),
    notes: notes ?? "",
  };
  const form = useForm<DetailsValues, unknown, ParsedDetails>({
    resolver: zodResolver(detailsSchema),
    defaultValues: current,
    mode: "onSubmit",
  });

  // Follow a co-manager's saved change unless this editor is mid-edit.
  useEffect(() => {
    if (form.formState.isDirty || form.formState.isSubmitting) return;
    form.reset({
      name: name ?? "",
      ancestry: ancestry ?? "",
      alignment: alignment ?? "",
      appearance: appearance ?? "",
      maxHp: String(maxHp),
      notes: notes ?? "",
    });
  }, [name, ancestry, alignment, appearance, maxHp, notes, form]);

  const updateSheet = api.character.sheet.update.useMutation({
    onSuccess: (sheet) => {
      form.reset({
        name: sheet.name ?? "",
        ancestry: sheet.ancestry ?? "",
        alignment: sheet.alignment ?? "",
        appearance: sheet.appearance ?? "",
        maxHp: String(sheet.maxHp),
        notes: sheet.notes ?? "",
      });
      void utils.character.sheet.get.invalidate({ campaignId, sheetId });
      void utils.character.list.invalidate();
    },
  });

  function submit(values: ParsedDetails) {
    updateSheet.mutate({
      campaignId,
      sheetId,
      name: values.name ? values.name : null,
      ancestry: values.ancestry ? values.ancestry : null,
      alignment: values.alignment ? values.alignment : null,
      appearance: values.appearance ? values.appearance : null,
      maxHp: values.maxHp,
      notes: values.notes ? values.notes : null,
    });
  }

  const isPending = updateSheet.isPending;

  if (!canEdit) {
    return (
      <div className="flex flex-col gap-6">
        <dl className="grid gap-5 sm:grid-cols-3">
          <ReadField label="Name at this table" value={name} />
          <ReadField label="Ancestry" value={ancestry} />
          <ReadField label="Alignment" value={alignment} />
        </dl>
        <div>
          <h3 className="mb-2 text-[10px] text-muted-foreground uppercase tracking-[0.14em]">
            Appearance
          </h3>
          <ReadProse
            value={appearance}
            empty="No description of how they look has been recorded."
          />
        </div>
        <div>
          <h3 className="mb-2 text-[10px] text-muted-foreground uppercase tracking-[0.14em]">
            Notes
          </h3>
          <ReadProse
            value={notes}
            empty="No campaign notes on this character."
          />
        </div>
      </div>
    );
  }

  return (
    <form noValidate onSubmit={form.handleSubmit(submit)}>
      <FieldGroup className="gap-6">
        <div className="grid gap-6 sm:grid-cols-2">
          <Controller
            control={form.control}
            name="name"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="sheet-alias">
                  Name at this table
                </FieldLabel>
                <Input
                  {...field}
                  id="sheet-alias"
                  className="h-11 px-3 text-base"
                  maxLength={80}
                  autoComplete="off"
                  placeholder="Leave empty to use the character name"
                  disabled={disabled || isPending}
                  aria-invalid={fieldState.invalid}
                />
                <FieldDescription>
                  An alias, false name, or title this campaign knows them by.
                </FieldDescription>
                {fieldState.error ? (
                  <FieldError errors={[fieldState.error]} />
                ) : null}
              </Field>
            )}
          />

          <Controller
            control={form.control}
            name="ancestry"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="sheet-ancestry">Ancestry</FieldLabel>
                <Input
                  {...field}
                  id="sheet-ancestry"
                  className="h-11 px-3 text-base"
                  maxLength={80}
                  autoComplete="off"
                  placeholder="Tiefling, hill dwarf, whatever your table uses"
                  disabled={disabled || isPending}
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.error ? (
                  <FieldError errors={[fieldState.error]} />
                ) : null}
              </Field>
            )}
          />

          <Controller
            control={form.control}
            name="alignment"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="sheet-alignment">Alignment</FieldLabel>
                <Input
                  {...field}
                  id="sheet-alignment"
                  className="h-11 px-3 text-base"
                  maxLength={80}
                  autoComplete="off"
                  placeholder="However your table words it"
                  disabled={disabled || isPending}
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.error ? (
                  <FieldError errors={[fieldState.error]} />
                ) : null}
              </Field>
            )}
          />

          <Controller
            control={form.control}
            name="maxHp"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="sheet-max-hp">Max HP</FieldLabel>
                <Input
                  {...field}
                  value={field.value ?? ""}
                  id="sheet-max-hp"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={MAX_CHARACTER_HP}
                  step={1}
                  className="h-11 px-3 text-base tabular-nums"
                  disabled={disabled || isPending}
                  aria-invalid={fieldState.invalid}
                />
                <FieldDescription>
                  Maximum only. Track current hit points at the table.
                </FieldDescription>
                {fieldState.error ? (
                  <FieldError errors={[fieldState.error]} />
                ) : null}
              </Field>
            )}
          />
        </div>

        <Controller
          control={form.control}
          name="appearance"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="sheet-appearance">Appearance</FieldLabel>
              <Textarea
                {...field}
                id="sheet-appearance"
                rows={4}
                maxLength={2000}
                placeholder="What the party sees when they look at them."
                disabled={disabled || isPending}
                aria-invalid={fieldState.invalid}
              />
              {fieldState.error ? (
                <FieldError errors={[fieldState.error]} />
              ) : null}
            </Field>
          )}
        />

        <Controller
          control={form.control}
          name="notes"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="sheet-notes">Notes</FieldLabel>
              <Textarea
                {...field}
                id="sheet-notes"
                rows={6}
                maxLength={5000}
                placeholder="Promises made, debts owed, and what the party still does not know."
                disabled={disabled || isPending}
                aria-invalid={fieldState.invalid}
              />
              <FieldDescription>
                Visible to you and this campaign's DMs.
              </FieldDescription>
              {fieldState.error ? (
                <FieldError errors={[fieldState.error]} />
              ) : null}
            </Field>
          )}
        />

        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="submit"
            className="min-h-11"
            disabled={disabled || isPending}
          >
            <LoadingSwap isLoading={isPending}>Save sheet details</LoadingSwap>
          </Button>
          <SaveStatus
            state={saveState(updateSheet)}
            onRetry={() => form.handleSubmit(submit)()}
          />
        </div>
      </FieldGroup>
    </form>
  );
}
