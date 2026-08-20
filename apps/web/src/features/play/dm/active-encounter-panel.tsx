"use client";

import type { FormEvent } from "react";
import { useEffect, useId, useState } from "react";
import { IconTrash } from "@tabler/icons-react";

import { Alert, AlertDescription } from "@tablekeep/ui/components/alert";
import { Badge } from "@tablekeep/ui/components/badge";
import { Button } from "@tablekeep/ui/components/button";
import { Field, FieldError, FieldLabel } from "@tablekeep/ui/components/field";
import { Input } from "@tablekeep/ui/components/input";
import { LoadingSwap } from "@tablekeep/ui/components/loading-swap";
import {
  NativeSelect,
  NativeSelectOption,
} from "@tablekeep/ui/components/native-select";
import { Textarea } from "@tablekeep/ui/components/textarea";

import { ConfirmActionDialog } from "@/components/campaigns/confirm-action-dialog";
import type { RouterInputs, RouterOutputs } from "@/trpc/react";

export type ActiveDmEncounter = NonNullable<
  RouterOutputs["play"]["dm"]["bootstrap"]["encounter"]
>;

type DmCombatant = ActiveDmEncounter["combatants"][number];
type DmEffect = DmCombatant["effects"][number];
type CombatantVisibility = DmCombatant["visibility"];
type EffectVisibility = DmEffect["visibility"];
type EffectTick = DmEffect["tick"];

export type AdvanceTurnValue = Omit<
  RouterInputs["play"]["dm"]["advanceTurn"],
  "campaignId"
>;
export type SetHealthValue = Omit<
  RouterInputs["play"]["dm"]["setHealth"],
  "campaignId"
>;
export type AddEffectValue = Omit<
  RouterInputs["play"]["dm"]["addEffect"],
  "campaignId"
>;
export type RemoveEffectValue = Omit<
  RouterInputs["play"]["dm"]["removeEffect"],
  "campaignId"
>;
export type CompleteEncounterValue = Omit<
  RouterInputs["play"]["dm"]["completeEncounter"],
  "campaignId"
>;

export type ActiveEncounterPanelProps = {
  encounter: ActiveDmEncounter;
  isPending: boolean;
  errorMessage?: string | null;
  onAdvanceTurn: (value: AdvanceTurnValue) => void;
  onSetHealth: (value: SetHealthValue) => void;
  onAddEffect: (value: AddEffectValue) => void;
  onRemoveEffect: (value: RemoveEffectValue) => void;
  onCompleteEncounter: (value: CompleteEncounterValue) => void;
};

const VISIBILITY_LABELS: Record<CombatantVisibility, string> = {
  players: "Visible to players",
  name_only: "Name only to players",
  dm: "Hidden from players",
};

const EFFECT_VISIBILITY_LABELS: Record<EffectVisibility, string> = {
  players: "Visible to players",
  dm: "Hidden from players",
};

const EFFECT_VISIBILITY_OPTIONS: Array<{
  value: EffectVisibility;
  label: string;
}> = [
  { value: "players", label: "Visible to players" },
  { value: "dm", label: "Hidden from players" },
];

const EFFECT_TICK_OPTIONS: Array<{ value: EffectTick; label: string }> = [
  { value: "turn_start", label: "Start of turn" },
  { value: "turn_end", label: "End of turn" },
  { value: "round_start", label: "Start of round" },
  { value: "manual", label: "Manual" },
];

const EFFECT_TICK_LABELS = Object.fromEntries(
  EFFECT_TICK_OPTIONS.map((option) => [option.value, option.label]),
) as Record<EffectTick, string>;

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

function parseRequiredInteger(
  raw: string,
  min: number,
  max: number,
): number | "invalid" {
  const trimmed = raw.trim();
  if (!/^-?\d+$/.test(trimmed)) return "invalid";
  const value = Number.parseInt(trimmed, 10);
  if (value < min || value > max) return "invalid";
  return value;
}

export function ActiveEncounterPanel({
  encounter,
  isPending,
  errorMessage,
  onAdvanceTurn,
  onSetHealth,
  onAddEffect,
  onRemoveEffect,
  onCompleteEncounter,
}: ActiveEncounterPanelProps) {
  const combatants = [...encounter.combatants].sort(
    (a, b) => a.position - b.position,
  );
  function advance(direction: "previous" | "next") {
    if (isPending) return;
    onAdvanceTurn({ expectedRevision: encounter.revision, direction });
  }

  return (
    <section
      aria-label={`${encounter.name} encounter`}
      className="flex flex-col gap-5"
    >
      {errorMessage ? (
        <Alert variant="destructive">
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      ) : null}

      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl text-[#f2e5c8]">
            {encounter.name}
          </h2>
          <p className="mt-1 font-mono text-[#9b7444] text-xs uppercase tracking-widest">
            Round {encounter.round}
          </p>
        </div>

        <ConfirmActionDialog
          trigger={
            <Button
              type="button"
              variant="destructive"
              className="min-h-11"
              disabled={isPending}
            >
              Complete encounter
            </Button>
          }
          title={`Complete ${encounter.name}?`}
          consequence="This removes the encounter from the active table for everyone."
          confirmLabel="Complete encounter"
          onConfirm={() =>
            onCompleteEncounter({ expectedRevision: encounter.revision })
          }
          isPending={isPending}
        />
      </header>

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          className="min-h-11 min-w-11 rounded-none border-[#8d6635] bg-[#0b0807] text-[#e9dfc5] hover:bg-[#24170f] hover:text-[#fff3d6]"
          disabled={isPending}
          onClick={() => advance("previous")}
        >
          Previous turn
        </Button>
        <Button
          type="button"
          className="min-h-11 min-w-11 rounded-none border border-[#8d6635] bg-[#6d342e] text-[#fff3d6] hover:bg-[#834139]"
          disabled={isPending}
          onClick={() => advance("next")}
        >
          Next turn
        </Button>
      </div>

      <ul className="flex flex-col gap-3">
        {combatants.map((combatant) => (
          <CombatantCard
            key={combatant.id}
            combatant={combatant}
            isCurrentTurn={combatant.position === encounter.activePosition}
            isPending={isPending}
            expectedRevision={encounter.revision}
            onSetHealth={onSetHealth}
            onAddEffect={onAddEffect}
            onRemoveEffect={onRemoveEffect}
          />
        ))}
      </ul>
    </section>
  );
}

function CombatantCard({
  combatant,
  isCurrentTurn,
  isPending,
  expectedRevision,
  onSetHealth,
  onAddEffect,
  onRemoveEffect,
}: {
  combatant: DmCombatant;
  isCurrentTurn: boolean;
  isPending: boolean;
  expectedRevision: number;
  onSetHealth: (value: SetHealthValue) => void;
  onAddEffect: (value: AddEffectValue) => void;
  onRemoveEffect: (value: RemoveEffectValue) => void;
}) {
  const baseId = useId();
  const [currentHp, setCurrentHp] = useState(
    combatant.currentHp === null ? "" : String(combatant.currentHp),
  );
  const [tempHp, setTempHp] = useState(String(combatant.tempHp));
  const [hpErrors, setHpErrors] = useState<{
    currentHp?: string;
    tempHp?: string;
  }>({});

  useEffect(() => {
    setCurrentHp(
      combatant.currentHp === null ? "" : String(combatant.currentHp),
    );
    setTempHp(String(combatant.tempHp));
  }, [combatant.currentHp, combatant.tempHp]);

  function saveHealth() {
    if (isPending) return;

    const currentHpResult = parseOptionalInteger(
      currentHp,
      -1_000_000,
      1_000_000,
    );
    const tempHpResult = parseRequiredInteger(tempHp, 0, 1_000_000);

    const errors: { currentHp?: string; tempHp?: string } = {};
    if (currentHpResult === "invalid") {
      errors.currentHp =
        "Enter a whole number from -1,000,000 to 1,000,000, or leave it blank.";
    }
    if (tempHpResult === "invalid") {
      errors.tempHp = "Enter a whole number from 0 to 1,000,000.";
    }
    if (Object.keys(errors).length > 0) {
      setHpErrors(errors);
      return;
    }

    setHpErrors({});
    onSetHealth({
      expectedRevision,
      combatantId: combatant.id,
      currentHp: currentHpResult === "invalid" ? null : currentHpResult,
      tempHp: tempHpResult === "invalid" ? 0 : tempHpResult,
    });
  }

  const currentHpId = `${baseId}-current-hp`;
  const tempHpId = `${baseId}-temp-hp`;

  return (
    <li
      data-state={isCurrentTurn ? "current-turn" : undefined}
      className="flex flex-col gap-3 border border-[#6b4a24]/60 bg-[#0c0907] px-3 py-3 data-[state=current-turn]:border-cyan-500/80 data-[state=current-turn]:shadow-[inset_3px_0_0_rgba(34,211,238,0.55)]"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate font-display text-[#f2e5c8] text-base">
            {combatant.name}
          </span>
          <Badge variant="outline">
            {VISIBILITY_LABELS[combatant.visibility]}
          </Badge>
          {isCurrentTurn ? (
            <Badge variant="secondary">Current turn</Badge>
          ) : null}
        </div>
        <span className="font-mono text-[#9f8562] text-xs tabular-nums">
          {combatant.initiativeTotal !== null
            ? `Init ${combatant.initiativeTotal}`
            : "Init pending"}
        </span>
      </div>

      <div className="flex flex-wrap items-end gap-2">
        <Field className="w-28" data-invalid={Boolean(hpErrors.currentHp)}>
          <FieldLabel htmlFor={currentHpId}>Current HP</FieldLabel>
          <Input
            id={currentHpId}
            type="number"
            inputMode="numeric"
            step={1}
            value={currentHp}
            aria-label={`Current HP for ${combatant.name}`}
            onChange={(event) => {
              setCurrentHp(event.target.value);
            }}
            disabled={isPending}
            aria-invalid={Boolean(hpErrors.currentHp)}
            className="h-11 px-2 text-base tabular-nums"
          />
          {hpErrors.currentHp ? (
            <FieldError>{hpErrors.currentHp}</FieldError>
          ) : null}
        </Field>

        <Field className="w-24" data-invalid={Boolean(hpErrors.tempHp)}>
          <FieldLabel htmlFor={tempHpId}>Temp HP</FieldLabel>
          <Input
            id={tempHpId}
            type="number"
            inputMode="numeric"
            min={0}
            step={1}
            value={tempHp}
            aria-label={`Temporary HP for ${combatant.name}`}
            onChange={(event) => {
              setTempHp(event.target.value);
            }}
            disabled={isPending}
            aria-invalid={Boolean(hpErrors.tempHp)}
            className="h-11 px-2 text-base tabular-nums"
          />
          {hpErrors.tempHp ? <FieldError>{hpErrors.tempHp}</FieldError> : null}
        </Field>

        <p className="min-h-11 self-end pb-3 text-muted-foreground text-xs tabular-nums">
          {combatant.maxHp === null ? "No maximum" : `of ${combatant.maxHp}`}
        </p>

        <Button
          type="button"
          variant="outline"
          className="min-h-11"
          disabled={isPending}
          aria-label={`Save health for ${combatant.name}`}
          onClick={saveHealth}
        >
          <LoadingSwap isLoading={isPending}>Save health</LoadingSwap>
        </Button>
      </div>

      <EffectsList
        combatant={combatant}
        isPending={isPending}
        expectedRevision={expectedRevision}
        onRemoveEffect={onRemoveEffect}
      />

      <AddEffectForm
        combatant={combatant}
        isPending={isPending}
        expectedRevision={expectedRevision}
        onAddEffect={onAddEffect}
      />
    </li>
  );
}

function EffectsList({
  combatant,
  isPending,
  expectedRevision,
  onRemoveEffect,
}: {
  combatant: DmCombatant;
  isPending: boolean;
  expectedRevision: number;
  onRemoveEffect: (value: RemoveEffectValue) => void;
}) {
  if (combatant.effects.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        No effects on {combatant.name}.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-1.5">
      {combatant.effects.map((effect) => (
        <li
          key={effect.id}
          className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-muted/20 px-2.5 py-1.5"
        >
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="font-medium text-foreground text-sm">
                {effect.name}
              </span>
              <Badge variant="outline">
                {EFFECT_VISIBILITY_LABELS[effect.visibility]}
              </Badge>
              {effect.remainingTurns !== null ? (
                <span className="text-muted-foreground text-xs">
                  {effect.remainingTurns} turns left
                </span>
              ) : null}
              <span className="text-muted-foreground text-xs">
                {EFFECT_TICK_LABELS[effect.tick]}
              </span>
            </div>
            {effect.description ? (
              <p className="text-muted-foreground text-xs">
                {effect.description}
              </p>
            ) : null}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-11 shrink-0 text-destructive hover:text-destructive"
            disabled={isPending}
            aria-label={`Remove ${effect.name} from ${combatant.name}`}
            onClick={() =>
              onRemoveEffect({ expectedRevision, effectId: effect.id })
            }
          >
            <IconTrash aria-hidden="true" />
          </Button>
        </li>
      ))}
    </ul>
  );
}

function AddEffectForm({
  combatant,
  isPending,
  expectedRevision,
  onAddEffect,
}: {
  combatant: DmCombatant;
  isPending: boolean;
  expectedRevision: number;
  onAddEffect: (value: AddEffectValue) => void;
}) {
  const baseId = useId();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [remainingTurns, setRemainingTurns] = useState("");
  const [tick, setTick] = useState<EffectTick>("manual");
  const [visibility, setVisibility] = useState<EffectVisibility>("players");
  const [errors, setErrors] = useState<{
    name?: string;
    description?: string;
    remainingTurns?: string;
  }>({});

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isPending) return;

    const trimmedName = name.trim();
    const trimmedDescription = description.trim();
    const remainingTurnsResult = parseOptionalInteger(
      remainingTurns,
      0,
      100_000,
    );

    const nextErrors: typeof errors = {};
    if (trimmedName.length === 0) {
      nextErrors.name = "Enter an effect name.";
    } else if (trimmedName.length > 120) {
      nextErrors.name = "Use 120 characters or fewer.";
    }
    if (trimmedDescription.length > 2000) {
      nextErrors.description = "Use 2,000 characters or fewer.";
    }
    if (remainingTurnsResult === "invalid") {
      nextErrors.remainingTurns =
        "Enter a whole number from 0 to 100,000, or leave it blank.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    onAddEffect({
      expectedRevision,
      combatantId: combatant.id,
      name: trimmedName,
      description: trimmedDescription.length === 0 ? null : trimmedDescription,
      remainingTurns:
        remainingTurnsResult === "invalid" ? null : remainingTurnsResult,
      tick,
      visibility,
    });

    setName("");
    setDescription("");
    setRemainingTurns("");
    setTick("manual");
    setVisibility("players");
  }

  const nameId = `${baseId}-effect-name`;
  const descriptionId = `${baseId}-effect-description`;
  const remainingTurnsId = `${baseId}-effect-remaining-turns`;
  const tickId = `${baseId}-effect-tick`;
  const visibilityId = `${baseId}-effect-visibility`;

  return (
    <form
      noValidate
      onSubmit={handleSubmit}
      aria-label={`Add effect form for ${combatant.name}`}
      className="flex flex-col gap-2 rounded-lg border border-muted-foreground/40 border-dashed bg-muted/10 px-2.5 py-2.5"
    >
      <div className="flex flex-wrap items-end gap-2">
        <Field className="min-w-32 flex-1" data-invalid={Boolean(errors.name)}>
          <FieldLabel htmlFor={nameId}>Effect name</FieldLabel>
          <Input
            id={nameId}
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={120}
            autoComplete="off"
            placeholder="Poisoned"
            aria-label={`Effect name for ${combatant.name}`}
            disabled={isPending}
            aria-invalid={Boolean(errors.name)}
            className="h-11 px-3 text-base"
          />
          {errors.name ? <FieldError>{errors.name}</FieldError> : null}
        </Field>

        <Field className="w-24" data-invalid={Boolean(errors.remainingTurns)}>
          <FieldLabel
            htmlFor={remainingTurnsId}
            className="text-[10px] text-muted-foreground uppercase tracking-wide"
          >
            Turns left
          </FieldLabel>
          <Input
            id={remainingTurnsId}
            type="number"
            inputMode="numeric"
            min={0}
            step={1}
            value={remainingTurns}
            onChange={(event) => setRemainingTurns(event.target.value)}
            aria-label={`Remaining turns for ${combatant.name} effect`}
            disabled={isPending}
            aria-invalid={Boolean(errors.remainingTurns)}
            className="h-11 px-2 text-base tabular-nums"
          />
          {errors.remainingTurns ? (
            <FieldError>{errors.remainingTurns}</FieldError>
          ) : null}
        </Field>

        <Field className="min-w-32">
          <FieldLabel
            htmlFor={tickId}
            className="text-[10px] text-muted-foreground uppercase tracking-wide"
          >
            Tick
          </FieldLabel>
          <NativeSelect
            id={tickId}
            value={tick}
            aria-label={`Tick for ${combatant.name} effect`}
            onChange={(event) => setTick(event.target.value as EffectTick)}
            disabled={isPending}
            className="w-full"
          >
            {EFFECT_TICK_OPTIONS.map((option) => (
              <NativeSelectOption key={option.value} value={option.value}>
                {option.label}
              </NativeSelectOption>
            ))}
          </NativeSelect>
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
            value={visibility}
            aria-label={`Visibility for ${combatant.name} effect`}
            onChange={(event) =>
              setVisibility(event.target.value as EffectVisibility)
            }
            disabled={isPending}
            className="w-full"
          >
            {EFFECT_VISIBILITY_OPTIONS.map((option) => (
              <NativeSelectOption key={option.value} value={option.value}>
                {option.label}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Field>
      </div>

      <Field data-invalid={Boolean(errors.description)}>
        <FieldLabel htmlFor={descriptionId}>Description (optional)</FieldLabel>
        <Textarea
          id={descriptionId}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          maxLength={2000}
          rows={2}
          aria-label={`Effect description for ${combatant.name}`}
          disabled={isPending}
          aria-invalid={Boolean(errors.description)}
        />
        {errors.description ? (
          <FieldError>{errors.description}</FieldError>
        ) : null}
      </Field>

      <Button
        type="submit"
        variant="outline"
        className="min-h-11 w-fit"
        disabled={isPending}
        aria-label={`Add effect to ${combatant.name}`}
      >
        <LoadingSwap isLoading={isPending}>Add effect</LoadingSwap>
      </Button>
    </form>
  );
}
