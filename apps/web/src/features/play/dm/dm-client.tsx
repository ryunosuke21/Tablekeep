"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";
import { IconNotebook, IconSwords, IconUsers } from "@tabler/icons-react";

import { Alert, AlertDescription } from "@tablekeep/ui/components/alert";
import { Button } from "@tablekeep/ui/components/button";
import { LoadingSwap } from "@tablekeep/ui/components/loading-swap";
import { Spinner } from "@tablekeep/ui/components/spinner";
import { Textarea } from "@tablekeep/ui/components/textarea";

import { CharacterSheet } from "@/components/characters/character-sheet";
import { SaveStatus, saveState } from "@/components/characters/save-status";
import { EmptyNote } from "@/components/characters/sheet-readouts";
import { env } from "@/env/client";
import { usePartyKitConnection } from "@/hooks/use-partykit-connection";
import type { RouterOutputs } from "@/trpc/react";
import { api } from "@/trpc/react";

import { PlayShell } from "../shared/play-shell";
import { TurnRail, type TurnRailCombatant } from "../shared/turn-rail";
import {
  ActiveEncounterPanel,
  type AddEffectValue,
  type AdvanceTurnValue,
  type CompleteEncounterValue,
  type RemoveEffectValue,
  type SetHealthValue,
} from "./active-encounter-panel";
import { EncounterSetup, type EncounterSetupValue } from "./encounter-setup";

type DmBootstrap = RouterOutputs["play"]["dm"]["bootstrap"];
type DmCampaign = DmBootstrap["campaign"];
type DmPartyMember = DmBootstrap["party"][number];
type DmEncounter = NonNullable<DmBootstrap["encounter"]>;
type DmNote = DmBootstrap["note"];

type BeginEncounterMutation = ReturnType<
  typeof api.play.dm.beginEncounter.useMutation
>;
type AdvanceTurnMutation = ReturnType<
  typeof api.play.dm.advanceTurn.useMutation
>;
type SetHealthMutation = ReturnType<typeof api.play.dm.setHealth.useMutation>;
type AddEffectMutation = ReturnType<typeof api.play.dm.addEffect.useMutation>;
type RemoveEffectMutation = ReturnType<
  typeof api.play.dm.removeEffect.useMutation
>;
type CompleteEncounterMutation = ReturnType<
  typeof api.play.dm.completeEncounter.useMutation
>;

const SECTIONS = [
  { value: "table", label: "Table", icon: <IconSwords /> },
  { value: "party", label: "Party", icon: <IconUsers /> },
  { value: "notes", label: "Notes", icon: <IconNotebook /> },
] as const;

type SectionValue = (typeof SECTIONS)[number]["value"];

function isEncounterChangedForCampaign(value: unknown, campaignId: string) {
  if (!value || typeof value !== "object") return false;
  const message = value as Record<string, unknown>;
  return (
    message.type === "encounter.changed" && message.campaignId === campaignId
  );
}

export function DmClient({ campaignId }: { campaignId: string }) {
  const bootstrap = api.play.dm.bootstrap.useQuery({ campaignId });
  const utils = api.useUtils();
  const [section, setSection] = useState<SectionValue>("table");

  const invalidateBootstrap = useCallback(() => {
    void utils.play.dm.bootstrap.invalidate({ campaignId });
  }, [utils, campaignId]);

  const beginEncounter = api.play.dm.beginEncounter.useMutation({
    onSuccess: invalidateBootstrap,
  });
  const advanceTurn = api.play.dm.advanceTurn.useMutation({
    onSuccess: invalidateBootstrap,
  });
  const setHealth = api.play.dm.setHealth.useMutation({
    onSuccess: invalidateBootstrap,
  });
  const addEffect = api.play.dm.addEffect.useMutation({
    onSuccess: invalidateBootstrap,
  });
  const removeEffect = api.play.dm.removeEffect.useMutation({
    onSuccess: invalidateBootstrap,
  });
  const completeEncounter = api.play.dm.completeEncounter.useMutation({
    onSuccess: invalidateBootstrap,
  });

  const getToken = useCallback(async () => {
    const result = await utils.client.play.realtime.token.query({
      campaignId,
    });
    return result.token;
  }, [utils.client, campaignId]);

  const { lastMessage } = usePartyKitConnection({
    getToken,
    host: env.NEXT_PUBLIC_PARTYKIT_HOST,
    room: campaignId,
  });

  useEffect(() => {
    if (!lastMessage) return;

    let parsed: unknown;
    try {
      parsed = JSON.parse(lastMessage);
    } catch {
      return;
    }

    if (isEncounterChangedForCampaign(parsed, campaignId)) {
      invalidateBootstrap();
    }
  }, [lastMessage, campaignId, invalidateBootstrap]);

  if (bootstrap.isPending) {
    return (
      <main className="flex min-h-svh items-center justify-center bg-[#0b0908] px-6 py-12 text-[#e9dfc5]">
        <p className="flex items-center gap-2 text-[#8a6a45] text-sm">
          <Spinner /> Loading the table…
        </p>
      </main>
    );
  }

  if (bootstrap.isError) {
    return (
      <main className="flex min-h-svh items-center justify-center bg-[#0b0908] px-6 py-12 text-[#e9dfc5]">
        <p className="max-w-sm text-balance text-center text-[#8a6a45] text-sm">
          This DM view could not be loaded.{" "}
          {bootstrap.error.message || "Try again in a moment."}
        </p>
      </main>
    );
  }

  const { campaign, party, note, encounter } = bootstrap.data;

  const combatants: TurnRailCombatant[] = encounter
    ? encounter.combatants.map((combatant) => ({
        id: combatant.id,
        name: combatant.name,
        initiativeTotal: combatant.initiativeTotal,
        position: combatant.position,
      }))
    : [];

  return (
    <PlayShell
      campaignName={campaign.name}
      campaignHref={`/campaigns/${campaign.slug}`}
      viewLabel="DM table"
      sections={SECTIONS}
      activeSection={section}
      onSectionChange={(value) => setSection(value as SectionValue)}
      turnRail={
        <TurnRail
          combatants={combatants}
          activePosition={encounter?.activePosition ?? null}
          round={encounter?.round ?? null}
          isEncounterActive={encounter !== null}
        />
      }
    >
      {section === "table" ? (
        <TableSection
          campaignId={campaignId}
          party={party}
          encounter={encounter}
          beginEncounter={beginEncounter}
          advanceTurn={advanceTurn}
          setHealth={setHealth}
          addEffect={addEffect}
          removeEffect={removeEffect}
          completeEncounter={completeEncounter}
        />
      ) : null}
      {section === "party" ? (
        <PartySection campaign={campaign} party={party} />
      ) : null}
      {section === "notes" ? (
        <NotesSection campaignId={campaignId} note={note} />
      ) : null}
    </PlayShell>
  );
}

function SectionShell({
  headingId,
  heading,
  children,
}: {
  headingId: string;
  heading: string;
  children: ReactNode;
}) {
  return (
    <section
      aria-labelledby={headingId}
      className="flex flex-col gap-4 border border-[#6b4a24]/70 bg-[#120d0a] p-4 text-[#e9dfc5] sm:p-6"
    >
      <h2 id={headingId} className="font-display text-2xl text-[#f2e5c8]">
        {heading}
      </h2>
      {children}
    </section>
  );
}

function TableSection({
  campaignId,
  party,
  encounter,
  beginEncounter,
  advanceTurn,
  setHealth,
  addEffect,
  removeEffect,
  completeEncounter,
}: {
  campaignId: string;
  party: readonly DmPartyMember[];
  encounter: DmEncounter | null;
  beginEncounter: BeginEncounterMutation;
  advanceTurn: AdvanceTurnMutation;
  setHealth: SetHealthMutation;
  addEffect: AddEffectMutation;
  removeEffect: RemoveEffectMutation;
  completeEncounter: CompleteEncounterMutation;
}) {
  if (!encounter) {
    return (
      <SectionShell headingId="table-heading" heading="Table">
        <EncounterSetup
          party={party.map((member) => ({
            sheetId: member.sheetId,
            name: member.name,
          }))}
          isPending={beginEncounter.isPending}
          errorMessage={beginEncounter.error?.message ?? null}
          onBegin={(value: EncounterSetupValue) =>
            beginEncounter.mutate({ campaignId, ...value })
          }
        />
      </SectionShell>
    );
  }

  const isPending =
    advanceTurn.isPending ||
    setHealth.isPending ||
    addEffect.isPending ||
    removeEffect.isPending ||
    completeEncounter.isPending;
  const errorMessage =
    advanceTurn.error?.message ??
    setHealth.error?.message ??
    addEffect.error?.message ??
    removeEffect.error?.message ??
    completeEncounter.error?.message ??
    null;

  return (
    <SectionShell headingId="table-heading" heading="Table">
      <ActiveEncounterPanel
        encounter={encounter}
        isPending={isPending}
        errorMessage={errorMessage}
        onAdvanceTurn={(value: AdvanceTurnValue) =>
          advanceTurn.mutate({ campaignId, ...value })
        }
        onSetHealth={(value: SetHealthValue) =>
          setHealth.mutate({ campaignId, ...value })
        }
        onAddEffect={(value: AddEffectValue) =>
          addEffect.mutate({ campaignId, ...value })
        }
        onRemoveEffect={(value: RemoveEffectValue) =>
          removeEffect.mutate({ campaignId, ...value })
        }
        onCompleteEncounter={(value: CompleteEncounterValue) =>
          completeEncounter.mutate({ campaignId, ...value })
        }
      />
    </SectionShell>
  );
}

function PartySection({
  campaign,
  party,
}: {
  campaign: DmCampaign;
  party: readonly DmPartyMember[];
}) {
  const [selectedSheetId, setSelectedSheetId] = useState<string | null>(null);
  const selected =
    party.find((member) => member.sheetId === selectedSheetId) ?? null;

  const sheetQuery = api.character.sheet.get.useQuery(
    { campaignId: campaign.id, sheetId: selectedSheetId ?? campaign.id },
    { enabled: selectedSheetId !== null },
  );

  if (selectedSheetId && selected) {
    return (
      <SectionShell headingId="party-heading" heading="Party">
        <Button
          type="button"
          variant="outline"
          className="min-h-11 w-fit rounded-none border-[#8d6635] bg-[#0b0807] text-[#e9dfc5] hover:bg-[#24170f] hover:text-[#fff3d6]"
          onClick={() => setSelectedSheetId(null)}
        >
          Back to party
        </Button>

        {sheetQuery.isPending ? (
          <p className="flex items-center gap-2 text-muted-foreground text-sm">
            <Spinner /> Loading {selected.name}…
          </p>
        ) : null}

        {sheetQuery.isError ? (
          <Alert variant="destructive">
            <AlertDescription>
              {selected.name}'s sheet could not be loaded.{" "}
              {sheetQuery.error.message || "Try again in a moment."}
            </AlertDescription>
          </Alert>
        ) : null}

        {sheetQuery.data ? (
          <CharacterSheet
            campaignId={campaign.id}
            campaignSlug={campaign.slug}
            campaignName={campaign.name}
            campaignArchived={false}
            sheetId={selectedSheetId}
            initialSheet={sheetQuery.data}
            canEdit
          />
        ) : null}
      </SectionShell>
    );
  }

  if (party.length === 0) {
    return (
      <SectionShell headingId="party-heading" heading="Party">
        <EmptyNote>
          No one has an active character in this campaign yet.
        </EmptyNote>
      </SectionShell>
    );
  }

  return (
    <SectionShell headingId="party-heading" heading="Party">
      <ul className="grid list-none gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {party.map((member) => (
          <li key={member.sheetId}>
            <button
              type="button"
              onClick={() => setSelectedSheetId(member.sheetId)}
              className="flex min-h-16 w-full items-center gap-3 border border-[#6b4a24]/60 bg-[#0c0907] p-3 text-left outline-none transition-colors hover:border-[#8d6635] focus-visible:ring-2 focus-visible:ring-cyan-300/60 motion-reduce:transition-none"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-[#8d6635] bg-[#25140f] font-display text-[#e9dfc5] text-xs">
                {member.name
                  .split(/\s+/)
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((word) => word[0])
                  .join("")
                  .toUpperCase() || "?"}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-display text-[#f2e5c8] text-sm">
                  {member.name}
                </span>
                <span className="mt-1 block truncate text-[#9f8562] text-xs">
                  {member.classes.length > 0
                    ? member.classes
                        .map((entry) => `${entry.name} ${entry.level}`)
                        .join(" / ")
                    : `Level ${member.totalLevel}`}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </SectionShell>
  );
}

function NotesSection({
  campaignId,
  note,
}: {
  campaignId: string;
  note: DmNote;
}) {
  const utils = api.useUtils();
  const [content, setContent] = useState(note.content);
  const [dirty, setDirty] = useState(false);

  // Follow a refreshed bootstrap unless this editor is mid-edit.
  useEffect(() => {
    if (dirty) return;
    setContent(note.content);
  }, [note.content, dirty]);

  const update = api.play.note.update.useMutation({
    onSuccess: (saved) => {
      setDirty(false);
      setContent(saved.content);
      void utils.play.dm.bootstrap.invalidate({ campaignId });
    },
  });

  function save() {
    update.mutate({ campaignId, content });
  }

  return (
    <SectionShell headingId="notes-heading" heading="Notes">
      <p className="text-[#9f8562] text-sm">
        Private to you. Players cannot see this.
      </p>
      <Textarea
        aria-label="Private campaign note"
        rows={10}
        maxLength={100_000}
        value={content}
        onChange={(event) => {
          setContent(event.target.value);
          setDirty(true);
        }}
        placeholder="Whatever is worth remembering next session."
        disabled={update.isPending}
        className="min-h-64 rounded-none border-[#6b4a24] bg-[#0c0907] text-[#e9dfc5] placeholder:text-[#5f4a30] focus-visible:border-cyan-300/60 focus-visible:ring-cyan-300/40"
      />
      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          className="min-h-11 rounded-none border border-[#8d6635] bg-[#6d342e] text-[#fff3d6] hover:bg-[#834139]"
          disabled={update.isPending}
          onClick={save}
        >
          <LoadingSwap isLoading={update.isPending}>Save notes</LoadingSwap>
        </Button>
        <SaveStatus
          state={saveState(update)}
          onRetry={save}
          savedLabel="Notes saved"
        />
      </div>
    </SectionShell>
  );
}
