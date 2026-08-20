"use client";

import { useCallback, useEffect, useState } from "react";
import { IconNotebook, IconSwords, IconUsers } from "@tabler/icons-react";

import { Alert, AlertDescription } from "@tablekeep/ui/components/alert";
import { LoadingSwap } from "@tablekeep/ui/components/loading-swap";
import { Spinner } from "@tablekeep/ui/components/spinner";
import { Textarea } from "@tablekeep/ui/components/textarea";

import { CharacterSheet } from "@/components/characters/character-sheet";
import { SaveStatus, saveState } from "@/components/characters/save-status";
import { env } from "@/env/client";
import { usePartyKitConnection } from "@/hooks/use-partykit-connection";
import type { RouterOutputs } from "@/trpc/react";
import { api } from "@/trpc/react";

import { PlayShell } from "../shared/play-shell";
import {
  PlayBackButton,
  PlayEmpty,
  PlaySection,
} from "../shared/play-surfaces";
import { TurnRail, type TurnRailCombatant } from "../shared/turn-rail";
import { usePlayNav } from "../shared/use-play-nav";
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
const SECTION_VALUES = SECTIONS.map((entry) => entry.value);

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
  const { section, member, setSection, setMember } = usePlayNav<SectionValue>({
    sections: SECTION_VALUES,
    defaultSection: "table",
  });

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
    return <DmLoading message="Loading the table…" />;
  }

  if (bootstrap.isError) {
    return (
      <DmLoading
        message={`This DM view could not be loaded. ${
          bootstrap.error.message || "Try again in a moment."
        }`}
      />
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
      backgroundImage={campaign.bannerImage}
      logo={campaign.logo}
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
        <PartySection
          campaign={campaign}
          party={party}
          selectedSheetId={member}
          onSelectMember={setMember}
        />
      ) : null}
      {section === "notes" ? (
        <NotesSection campaignId={campaignId} note={note} />
      ) : null}
    </PlayShell>
  );
}

function DmLoading({ message }: { message: string }) {
  return (
    <main className="flex min-h-svh items-center justify-center bg-[#0b0b0d] px-6 py-12 text-[#f4f2ec]">
      <p className="flex max-w-sm items-center gap-2 text-balance text-center font-sans text-[#9b968c] text-sm">
        <Spinner /> {message}
      </p>
    </main>
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
      <PlaySection headingId="table-heading" heading="Table">
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
      </PlaySection>
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
    <PlaySection headingId="table-heading" heading="Table">
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
    </PlaySection>
  );
}

function PartySection({
  campaign,
  party,
  selectedSheetId,
  onSelectMember,
}: {
  campaign: DmCampaign;
  party: readonly DmPartyMember[];
  selectedSheetId: string | null;
  onSelectMember: (sheetId: string | null) => void;
}) {
  const selected =
    party.find((member) => member.sheetId === selectedSheetId) ?? null;

  const sheetQuery = api.character.sheet.get.useQuery(
    { campaignId: campaign.id, sheetId: selectedSheetId ?? campaign.id },
    { enabled: selectedSheetId !== null },
  );

  if (selectedSheetId && selected) {
    return (
      <PlaySection headingId="party-heading" heading={selected.name}>
        <div className="flex flex-col gap-5">
          <PlayBackButton onClick={() => onSelectMember(null)}>
            Back to party
          </PlayBackButton>

          {sheetQuery.isPending ? (
            <p className="flex items-center gap-2 font-sans text-[#9b968c] text-sm">
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
        </div>
      </PlaySection>
    );
  }

  if (party.length === 0) {
    return (
      <PlaySection headingId="party-heading" heading="Party">
        <PlayEmpty>
          No one has an active character in this campaign yet.
        </PlayEmpty>
      </PlaySection>
    );
  }

  return (
    <PlaySection headingId="party-heading" heading="Party">
      <ul className="grid list-none gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {party.map((member) => (
          <li key={member.sheetId}>
            <button
              type="button"
              onClick={() => onSelectMember(member.sheetId)}
              className="flex min-h-16 w-full items-center gap-3 border border-white/10 bg-[#0e0e10] p-3 text-left outline-none transition-colors hover:border-[#e0b061]/50 focus-visible:ring-2 focus-visible:ring-[#e0b061]/60 motion-reduce:transition-none"
            >
              <span className="flex size-10 shrink-0 items-center justify-center border border-white/15 bg-[#131316] font-display text-[#e0b061] text-xs">
                {member.name
                  .split(/\s+/)
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((word) => word[0])
                  .join("")
                  .toUpperCase() || "?"}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-sans text-[#f4f2ec] text-sm">
                  {member.name}
                </span>
                <span className="mt-0.5 block truncate font-sans text-[#9b968c] text-xs">
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
    </PlaySection>
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
    <PlaySection
      headingId="notes-heading"
      heading="Notes"
      eyebrow="Private to you · players cannot see this"
    >
      <div className="flex flex-col gap-4">
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
          className="min-h-64 rounded-sm border-white/10 bg-[#0e0e10] text-[#f4f2ec] placeholder:text-[#6f6a61] focus-visible:border-[#e0b061]/60 focus-visible:ring-[#e0b061]/30"
        />
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={update.isPending}
            onClick={save}
            className="inline-flex min-h-11 items-center justify-center rounded-sm bg-[#e0b061] px-5 font-sans text-[#0b0b0d] text-xs uppercase tracking-[0.14em] transition-colors hover:bg-[#eec27a] disabled:opacity-60"
          >
            <LoadingSwap isLoading={update.isPending}>Save notes</LoadingSwap>
          </button>
          <SaveStatus
            state={saveState(update)}
            onRetry={save}
            savedLabel="Notes saved"
          />
        </div>
      </div>
    </PlaySection>
  );
}
