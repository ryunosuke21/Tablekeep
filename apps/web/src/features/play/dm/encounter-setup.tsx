"use client";

import type { FormEvent } from "react";
import { useId, useRef, useState } from "react";
import { IconPlus, IconX } from "@tabler/icons-react";

import { Alert, AlertDescription } from "@tablekeep/ui/components/alert";
import { Button } from "@tablekeep/ui/components/button";
import { Checkbox } from "@tablekeep/ui/components/checkbox";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@tablekeep/ui/components/field";
import { Input } from "@tablekeep/ui/components/input";
import { LoadingSwap } from "@tablekeep/ui/components/loading-swap";
import {
  NativeSelect,
  NativeSelectOption,
} from "@tablekeep/ui/components/native-select";
import {
  RadioGroup,
  RadioGroupItem,
} from "@tablekeep/ui/components/radio-group";
import { cn } from "@tablekeep/ui/lib/utils";

import type { RouterInputs } from "@/trpc/react";

export type EncounterSetupPartyMember = {
  sheetId: string;
  name: string;
};

export type EncounterSetupValue = Omit<
  RouterInputs["play"]["dm"]["beginEncounter"],
  "campaignId"
>;

type CombatantInput = EncounterSetupValue["combatants"][number];
type CombatantVisibility = CombatantInput["visibility"];
type InitiativeMode = EncounterSetupValue["initiativeMode"];

type PartyRow = {
  sheetId: string;
  name: string;
  included: boolean;
  initiativeModifier: string;
  initiativeTotal: string;
};

type CustomRow = {
  id: string;
  name: string;
  initiativeModifier: string;
  initiativeTotal: string;
  maxHp: string;
  currentHp: string;
  visibility: CombatantVisibility;
};

type FieldErrors = Record<string, string>;

const VISIBILITY_OPTIONS: Array<{ value: CombatantVisibility; label: string }> =
  [
    { value: "players", label: "Visible to players" },
    { value: "name_only", label: "Name only to players" },
    { value: "dm", label: "Hidden from players" },
  ];

const INITIATIVE_MODES: Array<{
  value: InitiativeMode;
  label: string;
}> = [
  { value: "auto", label: "Automatic initiative" },
  { value: "manual", label: "Manual initiative" },
];

function partyRowsFromParty(
  party: readonly EncounterSetupPartyMember[],
): PartyRow[] {
  return party.map((member) => ({
    sheetId: member.sheetId,
    name: member.name,
    included: true,
    initiativeModifier: "0",
    initiativeTotal: "",
  }));
}

function parseRequiredInteger(
  raw: string,
  min: number,
  max: number,
): number | null {
  const trimmed = raw.trim();
  if (!/^-?\d+$/.test(trimmed)) return null;
  const value = Number.parseInt(trimmed, 10);
  if (value < min || value > max) return null;
  return value;
}

function parseOptionalInteger(
  raw: string,
  min: number,
  max: number,
): number | null | "invalid" {
  const trimmed = raw.trim();
  if (trimmed === "") return null;
  if (!/^-?\d+$/.test(trimmed)) return "invalid";
  const value = Number.parseInt(trimmed, 10);
  if (value < min || value > max) return "invalid";
  return value;
}

function validate({
  name,
  initiativeMode,
  partyRows,
  customRows,
}: {
  name: string;
  initiativeMode: InitiativeMode;
  partyRows: PartyRow[];
  customRows: CustomRow[];
}):
  | { ok: true; value: EncounterSetupValue }
  | { ok: false; errors: FieldErrors } {
  const errors: FieldErrors = {};
  const trimmedName = name.trim();
  if (trimmedName.length === 0) {
    errors.name = "Enter an encounter name.";
  } else if (trimmedName.length > 120) {
    errors.name = "Use 120 characters or fewer.";
  }

  const includedParty = partyRows.filter((row) => row.included);
  if (includedParty.length + customRows.length === 0) {
    errors.roster =
      "Include at least one party member or add a custom combatant.";
  }

  const combatants: CombatantInput[] = [];

  for (const row of includedParty) {
    const modifier = parseRequiredInteger(row.initiativeModifier, -1000, 1000);
    if (modifier === null) {
      errors[`party-${row.sheetId}-modifier`] =
        "Enter a whole number from -1000 to 1000.";
    }

    let total: number | null = null;
    if (initiativeMode === "manual") {
      const parsedTotal = parseRequiredInteger(
        row.initiativeTotal,
        -2000,
        2000,
      );
      if (parsedTotal === null) {
        errors[`party-${row.sheetId}-total`] =
          "Enter a whole number from -2000 to 2000.";
      } else {
        total = parsedTotal;
      }
    }

    if (modifier !== null && (initiativeMode === "auto" || total !== null)) {
      combatants.push({
        sheetId: row.sheetId,
        name: row.name,
        initiativeModifier: modifier,
        initiativeTotal: total,
        currentHp: null,
        maxHp: null,
        visibility: "players",
      });
    }
  }

  for (const row of customRows) {
    const trimmedRowName = row.name.trim();
    if (trimmedRowName.length === 0) {
      errors[`custom-${row.id}-name`] = "Enter a name.";
    } else if (trimmedRowName.length > 120) {
      errors[`custom-${row.id}-name`] = "Use 120 characters or fewer.";
    }

    const modifier = parseRequiredInteger(row.initiativeModifier, -1000, 1000);
    if (modifier === null) {
      errors[`custom-${row.id}-modifier`] =
        "Enter a whole number from -1000 to 1000.";
    }

    let total: number | null = null;
    if (initiativeMode === "manual") {
      const parsedTotal = parseRequiredInteger(
        row.initiativeTotal,
        -2000,
        2000,
      );
      if (parsedTotal === null) {
        errors[`custom-${row.id}-total`] =
          "Enter a whole number from -2000 to 2000.";
      } else {
        total = parsedTotal;
      }
    }

    const maxHpResult = parseOptionalInteger(row.maxHp, 1, 1_000_000);
    if (maxHpResult === "invalid") {
      errors[`custom-${row.id}-maxHp`] =
        "Enter a whole number from 1 to 1,000,000, or leave it blank.";
    }
    const maxHp = maxHpResult === "invalid" ? null : maxHpResult;

    const currentHpRaw =
      row.currentHp.trim() === "" && maxHp !== null
        ? String(maxHp)
        : row.currentHp;
    const currentHpResult = parseOptionalInteger(
      currentHpRaw,
      -1_000_000,
      1_000_000,
    );
    if (currentHpResult === "invalid") {
      errors[`custom-${row.id}-currentHp`] =
        "Enter a whole number, or leave it blank.";
    }
    const currentHp = currentHpResult === "invalid" ? null : currentHpResult;

    if (
      maxHp !== null &&
      currentHp !== null &&
      currentHp > maxHp &&
      !errors[`custom-${row.id}-currentHp`]
    ) {
      errors[`custom-${row.id}-currentHp`] =
        "Current HP cannot exceed maximum HP.";
    }

    const rowValid =
      trimmedRowName.length > 0 &&
      trimmedRowName.length <= 120 &&
      modifier !== null &&
      (initiativeMode === "auto" || total !== null) &&
      maxHpResult !== "invalid" &&
      currentHpResult !== "invalid" &&
      !(maxHp !== null && currentHp !== null && currentHp > maxHp);

    if (rowValid && modifier !== null) {
      combatants.push({
        sheetId: null,
        name: trimmedRowName,
        initiativeModifier: modifier,
        initiativeTotal: total,
        currentHp,
        maxHp,
        visibility: row.visibility,
      });
    }
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  return { ok: true, value: { name: trimmedName, initiativeMode, combatants } };
}

export function EncounterSetup({
  party,
  isPending,
  errorMessage,
  onBegin,
}: {
  party: readonly EncounterSetupPartyMember[];
  isPending: boolean;
  errorMessage?: string | null;
  onBegin: (value: EncounterSetupValue) => void;
}) {
  const baseId = useId();
  const nextCustomId = useRef(0);
  const [name, setName] = useState("Encounter");
  const [initiativeMode, setInitiativeMode] = useState<InitiativeMode>("auto");
  const [partyRows, setPartyRows] = useState<PartyRow[]>(() =>
    partyRowsFromParty(party),
  );
  const [customRows, setCustomRows] = useState<CustomRow[]>([]);
  const [errors, setErrors] = useState<FieldErrors>({});

  const isManual = initiativeMode === "manual";

  function updatePartyRow(sheetId: string, patch: Partial<PartyRow>) {
    setPartyRows((rows) =>
      rows.map((row) => (row.sheetId === sheetId ? { ...row, ...patch } : row)),
    );
  }

  function updateCustomRow(id: string, patch: Partial<CustomRow>) {
    setCustomRows((rows) =>
      rows.map((row) => (row.id === id ? { ...row, ...patch } : row)),
    );
  }

  function addCustomRow() {
    const id = `custom-${nextCustomId.current++}`;
    setCustomRows((rows) => [
      ...rows,
      {
        id,
        name: "",
        initiativeModifier: "0",
        initiativeTotal: "",
        maxHp: "",
        currentHp: "",
        visibility: "players",
      },
    ]);
  }

  function removeCustomRow(id: string) {
    setCustomRows((rows) => rows.filter((row) => row.id !== id));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isPending) return;

    const result = validate({ name, initiativeMode, partyRows, customRows });
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }

    setErrors({});
    onBegin(result.value);
  }

  return (
    <form
      noValidate
      onSubmit={handleSubmit}
      aria-label="Begin encounter"
      className="flex flex-col gap-6"
    >
      {errorMessage ? (
        <Alert variant="destructive">
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      ) : null}

      <FieldGroup className="gap-6">
        <Field data-invalid={Boolean(errors.name)}>
          <FieldLabel htmlFor={`${baseId}-name`}>Encounter name</FieldLabel>
          <Input
            id={`${baseId}-name`}
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={120}
            autoComplete="off"
            disabled={isPending}
            aria-invalid={Boolean(errors.name)}
            className="h-11 px-3 text-base"
          />
          {errors.name ? <FieldError>{errors.name}</FieldError> : null}
        </Field>

        <FieldSet>
          <FieldLegend variant="label">Initiative</FieldLegend>
          <RadioGroup
            value={initiativeMode}
            onValueChange={(value) =>
              setInitiativeMode(value as InitiativeMode)
            }
            disabled={isPending}
            aria-label="Initiative mode"
            className="grid gap-2 sm:grid-cols-2"
          >
            {INITIATIVE_MODES.map((mode) => {
              const inputId = `${baseId}-mode-${mode.value}`;
              const checked = initiativeMode === mode.value;
              return (
                <label
                  key={mode.value}
                  htmlFor={inputId}
                  className={cn(
                    "flex min-h-11 cursor-pointer select-none items-center gap-2 border px-3 py-2 text-sm transition-colors has-disabled:cursor-not-allowed has-disabled:opacity-60 motion-reduce:transition-none",
                    checked
                      ? "border-cyan-600/80 bg-[#0d2426] text-cyan-100"
                      : "border-[#6b4a24]/70 bg-[#0c0907] text-[#b99c70] hover:border-[#8d6635]",
                  )}
                >
                  <RadioGroupItem id={inputId} value={mode.value} />
                  {mode.label}
                </label>
              );
            })}
          </RadioGroup>
          <FieldDescription>
            Automatic initiative rolls each total from the modifiers below when
            the encounter begins; manual initiative uses the totals you type in
            now.
          </FieldDescription>
        </FieldSet>

        <FieldSet>
          <FieldLegend variant="label">Party</FieldLegend>
          {partyRows.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No party members have an active character in this campaign yet.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {partyRows.map((row) => (
                <PartyMemberRow
                  key={row.sheetId}
                  row={row}
                  baseId={baseId}
                  isManual={isManual}
                  isPending={isPending}
                  errors={errors}
                  onChange={(patch) => updatePartyRow(row.sheetId, patch)}
                />
              ))}
            </ul>
          )}
        </FieldSet>

        <FieldSet>
          <FieldLegend variant="label">Custom combatants</FieldLegend>
          {customRows.length > 0 ? (
            <ul className="flex flex-col gap-3">
              {customRows.map((row) => (
                <CustomCombatantRow
                  key={row.id}
                  row={row}
                  baseId={baseId}
                  isManual={isManual}
                  isPending={isPending}
                  errors={errors}
                  onChange={(patch) => updateCustomRow(row.id, patch)}
                  onRemove={() => removeCustomRow(row.id)}
                />
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground text-sm">
              No custom combatants yet. Add one for anything without a character
              sheet.
            </p>
          )}
          <Button
            type="button"
            variant="outline"
            className="min-h-11 w-fit rounded-none border-[#8d6635] bg-[#0b0807] text-[#e9dfc5] hover:bg-[#24170f] hover:text-[#fff3d6]"
            disabled={isPending}
            onClick={addCustomRow}
          >
            <IconPlus aria-hidden="true" />
            Add custom combatant
          </Button>
        </FieldSet>

        {errors.roster ? <FieldError>{errors.roster}</FieldError> : null}

        <Button
          type="submit"
          className="min-h-11 w-fit rounded-none border border-[#8d6635] bg-[#6d342e] text-[#fff3d6] hover:bg-[#834139]"
          disabled={isPending}
          aria-label="Begin encounter"
        >
          <LoadingSwap isLoading={isPending}>Begin encounter</LoadingSwap>
        </Button>
      </FieldGroup>
    </form>
  );
}

function PartyMemberRow({
  row,
  baseId,
  isManual,
  isPending,
  errors,
  onChange,
}: {
  row: PartyRow;
  baseId: string;
  isManual: boolean;
  isPending: boolean;
  errors: FieldErrors;
  onChange: (patch: Partial<PartyRow>) => void;
}) {
  const modifierError = errors[`party-${row.sheetId}-modifier`];
  const totalError = errors[`party-${row.sheetId}-total`];
  const checkboxId = `${baseId}-party-${row.sheetId}-included`;
  const modifierId = `${baseId}-party-${row.sheetId}-modifier`;
  const totalId = `${baseId}-party-${row.sheetId}-total`;

  return (
    <li className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border border-border px-3 py-2">
      <label
        htmlFor={checkboxId}
        className="flex min-h-11 min-w-0 flex-1 basis-40 cursor-pointer items-center gap-2"
      >
        <Checkbox
          id={checkboxId}
          aria-label={`Include ${row.name}`}
          checked={row.included}
          onCheckedChange={(checked) =>
            onChange({ included: checked === true })
          }
          disabled={isPending}
        />
        <span
          className="min-w-0 truncate font-medium text-foreground text-sm"
          title={row.name}
        >
          {row.name}
        </span>
      </label>

      <div className="flex items-end gap-2">
        <Field className="w-20" data-invalid={Boolean(modifierError)}>
          <FieldLabel
            htmlFor={modifierId}
            className="text-[10px] text-muted-foreground uppercase tracking-wide"
          >
            Mod
          </FieldLabel>
          <Input
            id={modifierId}
            type="number"
            inputMode="numeric"
            step={1}
            value={row.initiativeModifier}
            onChange={(event) =>
              onChange({ initiativeModifier: event.target.value })
            }
            disabled={isPending || !row.included}
            aria-invalid={Boolean(modifierError)}
            className="h-11 px-2 text-base tabular-nums"
          />
          {modifierError ? <FieldError>{modifierError}</FieldError> : null}
        </Field>

        {isManual ? (
          <Field className="w-20" data-invalid={Boolean(totalError)}>
            <FieldLabel
              htmlFor={totalId}
              className="text-[10px] text-muted-foreground uppercase tracking-wide"
            >
              Total
            </FieldLabel>
            <Input
              id={totalId}
              type="number"
              inputMode="numeric"
              step={1}
              required
              value={row.initiativeTotal}
              onChange={(event) =>
                onChange({ initiativeTotal: event.target.value })
              }
              disabled={isPending || !row.included}
              aria-invalid={Boolean(totalError)}
              className="h-11 px-2 text-base tabular-nums"
            />
            {totalError ? <FieldError>{totalError}</FieldError> : null}
          </Field>
        ) : null}
      </div>
    </li>
  );
}

function CustomCombatantRow({
  row,
  baseId,
  isManual,
  isPending,
  errors,
  onChange,
  onRemove,
}: {
  row: CustomRow;
  baseId: string;
  isManual: boolean;
  isPending: boolean;
  errors: FieldErrors;
  onChange: (patch: Partial<CustomRow>) => void;
  onRemove: () => void;
}) {
  const nameError = errors[`custom-${row.id}-name`];
  const modifierError = errors[`custom-${row.id}-modifier`];
  const totalError = errors[`custom-${row.id}-total`];
  const maxHpError = errors[`custom-${row.id}-maxHp`];
  const currentHpError = errors[`custom-${row.id}-currentHp`];

  const nameId = `${baseId}-custom-${row.id}-name`;
  const modifierId = `${baseId}-custom-${row.id}-modifier`;
  const totalId = `${baseId}-custom-${row.id}-total`;
  const maxHpId = `${baseId}-custom-${row.id}-maxHp`;
  const currentHpId = `${baseId}-custom-${row.id}-currentHp`;
  const visibilityId = `${baseId}-custom-${row.id}-visibility`;

  return (
    <li className="flex flex-col gap-3 rounded-lg border border-muted-foreground/40 border-dashed bg-muted/20 px-3 py-3">
      <div className="flex flex-wrap items-end gap-2">
        <Field className="min-w-40 flex-1" data-invalid={Boolean(nameError)}>
          <FieldLabel htmlFor={nameId}>Name</FieldLabel>
          <Input
            id={nameId}
            value={row.name}
            onChange={(event) => onChange({ name: event.target.value })}
            maxLength={120}
            autoComplete="off"
            placeholder="Goblin scout"
            disabled={isPending}
            aria-invalid={Boolean(nameError)}
            className="h-11 px-3 text-base"
          />
          {nameError ? <FieldError>{nameError}</FieldError> : null}
        </Field>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-11 shrink-0 text-destructive hover:text-destructive"
          aria-label={`Remove ${row.name.trim() || "custom combatant"}`}
          disabled={isPending}
          onClick={onRemove}
        >
          <IconX aria-hidden="true" />
        </Button>
      </div>

      <div className="flex flex-wrap items-end gap-2">
        <Field className="w-20" data-invalid={Boolean(modifierError)}>
          <FieldLabel
            htmlFor={modifierId}
            className="text-[10px] text-muted-foreground uppercase tracking-wide"
          >
            Mod
          </FieldLabel>
          <Input
            id={modifierId}
            type="number"
            inputMode="numeric"
            step={1}
            value={row.initiativeModifier}
            onChange={(event) =>
              onChange({ initiativeModifier: event.target.value })
            }
            disabled={isPending}
            aria-invalid={Boolean(modifierError)}
            className="h-11 px-2 text-base tabular-nums"
          />
          {modifierError ? <FieldError>{modifierError}</FieldError> : null}
        </Field>

        {isManual ? (
          <Field className="w-20" data-invalid={Boolean(totalError)}>
            <FieldLabel
              htmlFor={totalId}
              className="text-[10px] text-muted-foreground uppercase tracking-wide"
            >
              Total
            </FieldLabel>
            <Input
              id={totalId}
              type="number"
              inputMode="numeric"
              step={1}
              required
              value={row.initiativeTotal}
              onChange={(event) =>
                onChange({ initiativeTotal: event.target.value })
              }
              disabled={isPending}
              aria-invalid={Boolean(totalError)}
              className="h-11 px-2 text-base tabular-nums"
            />
            {totalError ? <FieldError>{totalError}</FieldError> : null}
          </Field>
        ) : null}

        <Field className="w-20" data-invalid={Boolean(maxHpError)}>
          <FieldLabel
            htmlFor={maxHpId}
            className="text-[10px] text-muted-foreground uppercase tracking-wide"
          >
            Max HP
          </FieldLabel>
          <Input
            id={maxHpId}
            type="number"
            inputMode="numeric"
            min={1}
            step={1}
            value={row.maxHp}
            onChange={(event) => onChange({ maxHp: event.target.value })}
            disabled={isPending}
            aria-invalid={Boolean(maxHpError)}
            className="h-11 px-2 text-base tabular-nums"
          />
          {maxHpError ? <FieldError>{maxHpError}</FieldError> : null}
        </Field>

        <Field className="w-20" data-invalid={Boolean(currentHpError)}>
          <FieldLabel
            htmlFor={currentHpId}
            className="text-[10px] text-muted-foreground uppercase tracking-wide"
          >
            Cur HP
          </FieldLabel>
          <Input
            id={currentHpId}
            type="number"
            inputMode="numeric"
            step={1}
            value={row.currentHp}
            onChange={(event) => onChange({ currentHp: event.target.value })}
            placeholder={row.maxHp || undefined}
            disabled={isPending}
            aria-invalid={Boolean(currentHpError)}
            className="h-11 px-2 text-base tabular-nums"
          />
          {currentHpError ? <FieldError>{currentHpError}</FieldError> : null}
        </Field>

        <Field className="min-w-36">
          <FieldLabel
            htmlFor={visibilityId}
            className="text-[10px] text-muted-foreground uppercase tracking-wide"
          >
            Visibility
          </FieldLabel>
          <NativeSelect
            id={visibilityId}
            value={row.visibility}
            onChange={(event) =>
              onChange({
                visibility: event.target.value as CombatantVisibility,
              })
            }
            disabled={isPending}
            className="w-full"
          >
            {VISIBILITY_OPTIONS.map((option) => (
              <NativeSelectOption key={option.value} value={option.value}>
                {option.label}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Field>
      </div>
    </li>
  );
}
