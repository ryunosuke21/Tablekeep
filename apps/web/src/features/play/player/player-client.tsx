"use client";

import { useCallback, useEffect, useState } from "react";
import {
  IconBackpack,
  IconNotebook,
  IconSparkles,
  IconSwords,
  IconUserCircle,
  IconUsers,
} from "@tabler/icons-react";
import Link from "next/link";

import { LoadingSwap } from "@tablekeep/ui/components/loading-swap";
import { Spinner } from "@tablekeep/ui/components/spinner";
import { Textarea } from "@tablekeep/ui/components/textarea";

import { CharacterSheet } from "@/components/characters/character-sheet";
import { SaveStatus, saveState } from "@/components/characters/save-status";
import { SheetCurrencies } from "@/components/characters/sheet-currencies";
import { SheetInventory } from "@/components/characters/sheet-inventory";
import { SheetSpells } from "@/components/characters/sheet-spells";
import { env } from "@/env/client";
import { usePartyKitConnection } from "@/hooks/use-partykit-connection";
import type { RouterOutputs } from "@/trpc/react";
import { api } from "@/trpc/react";

import { PlayShell } from "../shared/play-shell";
import {
  PlayBackButton,
  PlayEmpty,
  PlaySection,
  StatTile,
} from "../shared/play-surfaces";
import { TurnRail, type TurnRailCombatant } from "../shared/turn-rail";
import { usePlayNav } from "../shared/use-play-nav";
import { PlayerCharacterPanel } from "./player-character-panel";
import { PlayerInventoryPanel } from "./player-inventory-panel";
import { PlayerSpellbookPanel } from "./player-spellbook-panel";

type PlayerBootstrap = RouterOutputs["play"]["player"]["bootstrap"];
type PlayerCampaign = PlayerBootstrap["campaign"];
type PlayerSheet = NonNullable<PlayerBootstrap["sheet"]>;
type PlayerEncounter = NonNullable<PlayerBootstrap["encounter"]>;
type PlayerPartyMember = PlayerBootstrap["party"][number];
type PlayerNote = PlayerBootstrap["note"];

const SECTIONS = [
  { value: "character", label: "Character", icon: <IconUserCircle /> },
  { value: "turn", label: "Turn", icon: <IconSwords /> },
  { value: "spells", label: "Spells", icon: <IconSparkles /> },
  { value: "inventory", label: "Inventory", icon: <IconBackpack /> },
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

export function PlayerClient({ campaignId }: { campaignId: string }) {
  const bootstrap = api.play.player.bootstrap.useQuery({ campaignId });
  const utils = api.useUtils();
  const bootstrapSheetId = bootstrap.data?.sheet?.id ?? null;
  // Existing sheet editors (SheetSpells, SheetInventory, ...) invalidate
  // character.sheet.get, not the play bootstrap, so this query is what keeps
  // every player sheet section current after an edit. The sheetId is inert
  // while disabled, before an active sheet id is known.
  const characterSheet = api.character.sheet.get.useQuery(
    { campaignId, sheetId: bootstrapSheetId ?? campaignId },
    {
      enabled: bootstrapSheetId !== null,
      initialData: bootstrap.data?.sheet ?? undefined,
    },
  );
  const { section, view, setSection, setView } = usePlayNav<SectionValue>({
    sections: SECTION_VALUES,
    defaultSection: "character",
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
      void utils.play.player.bootstrap.invalidate({ campaignId });
    }
  }, [lastMessage, campaignId, utils]);

  if (bootstrap.isPending) {
    return <PlayLoading message="Loading the table…" />;
  }

  if (bootstrap.isError) {
    return (
      <PlayLoading
        message={`This player view could not be loaded. ${
          bootstrap.error.message || "Try again in a moment."
        }`}
      />
    );
  }

  const {
    campaign,
    sheet: bootstrapSheet,
    party,
    note,
    encounter,
  } = bootstrap.data;
  const sheet = characterSheet.data
    ? {
        ...characterSheet.data,
        resources: bootstrapSheet?.resources ?? [],
      }
    : bootstrapSheet;

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
      viewLabel="Player table"
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
      {section === "character" ? (
        <CharacterSection
          campaign={campaign}
          sheet={sheet}
          encounter={encounter}
          fullSheetOpen={view === "sheet"}
          onOpenFullSheet={() => setView("sheet")}
          onCloseFullSheet={() => setView(null)}
        />
      ) : null}
      {section === "turn" ? (
        <TurnSection sheet={sheet} encounter={encounter} />
      ) : null}
      {section === "spells" ? (
        <SpellsSection
          campaignId={campaignId}
          campaignSlug={campaign.slug}
          sheet={sheet}
          managerOpen={view === "manage"}
          onOpenManager={() => setView("manage")}
          onCloseManager={() => setView(null)}
        />
      ) : null}
      {section === "inventory" ? (
        <InventorySection
          campaignId={campaignId}
          campaignSlug={campaign.slug}
          sheet={sheet}
          managerOpen={view === "manage"}
          onOpenManager={() => setView("manage")}
          onCloseManager={() => setView(null)}
        />
      ) : null}
      {section === "party" ? (
        <PartySection party={party} sheet={sheet} />
      ) : null}
      {section === "notes" ? (
        <NotesSection campaignId={campaignId} note={note} />
      ) : null}
    </PlayShell>
  );
}

function PlayLoading({ message }: { message: string }) {
  return (
    <main className="flex min-h-svh items-center justify-center bg-[#0b0b0d] px-6 py-12 text-[#f4f2ec]">
      <p className="flex max-w-sm items-center gap-2 text-balance text-center font-sans text-[#9b968c] text-sm">
        <Spinner /> {message}
      </p>
    </main>
  );
}

function NoActiveCharacter({ campaignSlug }: { campaignSlug: string }) {
  return (
    <div className="flex flex-col gap-3">
      <PlayEmpty>
        No active character is attached to this campaign yet.
      </PlayEmpty>
      <Link
        href={`/campaigns/${campaignSlug}/characters`}
        className="inline-flex min-h-11 w-fit items-center rounded-sm border border-white/15 bg-white/5 px-4 font-sans text-[#f4f2ec] text-xs uppercase tracking-[0.14em] transition-colors hover:border-[#e0b061]/60 hover:bg-white/10"
      >
        Go to characters
      </Link>
    </div>
  );
}

function CharacterSection({
  campaign,
  sheet,
  encounter,
  fullSheetOpen,
  onOpenFullSheet,
  onCloseFullSheet,
}: {
  campaign: PlayerCampaign;
  sheet: PlayerSheet | null;
  encounter: PlayerEncounter | null;
  fullSheetOpen: boolean;
  onOpenFullSheet: () => void;
  onCloseFullSheet: () => void;
}) {
  if (!sheet) {
    return (
      <PlaySection headingId="character-heading" heading="Character">
        <NoActiveCharacter campaignSlug={campaign.slug} />
      </PlaySection>
    );
  }

  if (!fullSheetOpen) {
    const ownCombatant = encounter?.combatants.find(
      (combatant) => combatant.sheetId === sheet.id,
    );

    return (
      <PlayerCharacterPanel
        sheet={sheet}
        currentHp={ownCombatant?.currentHp}
        tempHp={ownCombatant?.tempHp}
        encounterEffects={ownCombatant?.effects}
        onOpenFullSheet={onOpenFullSheet}
      />
    );
  }

  return (
    <div className="grid gap-5">
      <PlayBackButton onClick={onCloseFullSheet}>
        Back to overview
      </PlayBackButton>
      <CharacterSheet
        campaignId={campaign.id}
        campaignSlug={campaign.slug}
        campaignName={campaign.name}
        // The play route only reaches here for an active campaign; see
        // apps/web/src/app/play/[campaignId]/play-access-state.tsx.
        campaignArchived={false}
        sheetId={sheet.id}
        initialSheet={sheet}
        canEdit
      />
    </div>
  );
}

function TurnSection({
  sheet,
  encounter,
}: {
  sheet: PlayerSheet | null;
  encounter: PlayerEncounter | null;
}) {
  if (!encounter) {
    return (
      <PlaySection headingId="turn-heading" heading="Turn">
        <PlayEmpty>
          No encounter is active right now. When the DM starts one, the turn
          order and your HP will show up here.
        </PlayEmpty>
      </PlaySection>
    );
  }

  const activeCombatant = encounter.combatants.find(
    (combatant) => combatant.position === encounter.activePosition,
  );
  const own = sheet
    ? encounter.combatants.find((combatant) => combatant.sheetId === sheet.id)
    : undefined;

  return (
    <PlaySection headingId="turn-heading" heading="Turn">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <StatTile label="Round" value={encounter.round ?? "—"} />
        <StatTile
          label="Current turn"
          value={activeCombatant ? activeCombatant.name : "—"}
        />
        {own && own.currentHp !== null && own.maxHp !== null ? (
          <StatTile
            label="Your HP"
            value={`${own.currentHp} / ${own.maxHp}`}
            hint={own.tempHp ? `+${own.tempHp} temp` : undefined}
          />
        ) : null}
      </div>

      {own ? (
        <div className="mt-5">
          <h3 className="font-sans text-[#8a857b] text-[10px] uppercase tracking-[0.2em]">
            {own.name} · effects
          </h3>
          {own.effects.length > 0 ? (
            <ul className="mt-3 grid list-none gap-2">
              {own.effects.map((effect) => (
                <li
                  key={effect.id}
                  className="border border-white/10 bg-[#0e0e10] px-3 py-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-sans text-[#e5e1d8] text-sm">
                      {effect.name}
                    </span>
                    {effect.remainingTurns !== null ? (
                      <span className="shrink-0 font-mono text-[#8a857b] text-xs">
                        {effect.remainingTurns} turns left
                      </span>
                    ) : null}
                  </div>
                  {effect.description ? (
                    <p className="mt-1 font-sans text-[#8a857b] text-xs">
                      {effect.description}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 font-sans text-[#8a857b] text-sm">
              No effects are on you right now.
            </p>
          )}
        </div>
      ) : null}
    </PlaySection>
  );
}

function SpellsSection({
  campaignId,
  campaignSlug,
  sheet,
  managerOpen,
  onOpenManager,
  onCloseManager,
}: {
  campaignId: string;
  campaignSlug: string;
  sheet: PlayerSheet | null;
  managerOpen: boolean;
  onOpenManager: () => void;
  onCloseManager: () => void;
}) {
  if (!sheet) {
    return (
      <PlaySection headingId="spells-heading" heading="Spells">
        <NoActiveCharacter campaignSlug={campaignSlug} />
      </PlaySection>
    );
  }

  if (!managerOpen) {
    return (
      <PlayerSpellbookPanel
        spells={sheet.spells}
        onManageSpells={onOpenManager}
      />
    );
  }

  return (
    <PlaySection headingId="spells-heading" heading="Spellbook">
      <div className="flex flex-col gap-5">
        <PlayBackButton onClick={onCloseManager}>
          Back to spellbook
        </PlayBackButton>
        <SheetSpells
          campaignId={campaignId}
          sheetId={sheet.id}
          spells={sheet.spells}
          disabled={false}
          canEdit
        />
      </div>
    </PlaySection>
  );
}

function InventorySection({
  campaignId,
  campaignSlug,
  sheet,
  managerOpen,
  onOpenManager,
  onCloseManager,
}: {
  campaignId: string;
  campaignSlug: string;
  sheet: PlayerSheet | null;
  managerOpen: boolean;
  onOpenManager: () => void;
  onCloseManager: () => void;
}) {
  if (!sheet) {
    return (
      <PlaySection headingId="inventory-heading" heading="Inventory">
        <NoActiveCharacter campaignSlug={campaignSlug} />
      </PlaySection>
    );
  }

  if (!managerOpen) {
    return (
      <PlayerInventoryPanel
        items={sheet.items}
        currencies={sheet.currencies}
        onManageInventory={onOpenManager}
      />
    );
  }

  return (
    <PlaySection headingId="inventory-heading" heading="Inventory">
      <div className="flex flex-col gap-7">
        <PlayBackButton onClick={onCloseManager}>
          Back to inventory
        </PlayBackButton>
        <SheetInventory
          campaignId={campaignId}
          sheetId={sheet.id}
          items={sheet.items}
          disabled={false}
          canEdit
        />
        <SheetCurrencies
          campaignId={campaignId}
          sheetId={sheet.id}
          currencies={sheet.currencies}
          disabled={false}
          canEdit
        />
      </div>
    </PlaySection>
  );
}

function PartySection({
  party,
  sheet,
}: {
  party: readonly PlayerPartyMember[];
  sheet: PlayerSheet | null;
}) {
  if (party.length === 0) {
    return (
      <PlaySection headingId="party-heading" heading="Party">
        <PlayEmpty>
          No one else has an active character in this campaign yet.
        </PlayEmpty>
      </PlaySection>
    );
  }

  return (
    <PlaySection headingId="party-heading" heading="Party">
      <ul className="grid list-none gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {party.map((member) => (
          <li
            key={member.sheetId}
            className="flex min-w-0 items-center gap-3 border border-white/10 bg-[#0e0e10] p-3"
          >
            <div className="flex size-11 shrink-0 items-center justify-center border border-white/15 bg-[#131316] font-display text-[#e0b061] text-sm">
              {member.name
                .split(/\s+/)
                .filter(Boolean)
                .slice(0, 2)
                .map((word) => word[0])
                .join("")
                .toUpperCase() || "?"}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate font-sans text-[#f4f2ec] text-sm">
                  {member.name}
                </p>
                {member.sheetId === sheet?.id ? (
                  <span className="shrink-0 border border-[#e0b061]/40 px-1.5 py-0.5 font-sans text-[#e0b061] text-[9px] uppercase tracking-wider">
                    You
                  </span>
                ) : null}
              </div>
              <p className="mt-0.5 truncate font-sans text-[#9b968c] text-xs">
                {member.classes.length > 0
                  ? member.classes
                      .map((entry) => `${entry.name} ${entry.level}`)
                      .join(" / ")
                  : `Level ${member.totalLevel}`}
              </p>
              {member.ancestry ? (
                <p className="truncate font-sans text-[#6f6a61] text-xs">
                  {member.ancestry}
                </p>
              ) : null}
            </div>
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
  note: PlayerNote;
}) {
  const utils = api.useUtils();
  const { content, setContent, save, update } = useNoteEditor(
    campaignId,
    note,
    () => void utils.play.player.bootstrap.invalidate({ campaignId }),
  );

  return (
    <PlaySection
      headingId="notes-heading"
      heading="Notes"
      eyebrow="Private to you · the DM cannot see this"
    >
      <div className="flex flex-col gap-4">
        <Textarea
          aria-label="Private campaign note"
          rows={10}
          maxLength={100_000}
          value={content}
          onChange={(event) => setContent(event.target.value)}
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

/** Shared note-editor wiring for player and DM notes. */
function useNoteEditor(
  campaignId: string,
  note: PlayerNote,
  onSaved: () => void,
) {
  const [content, setContentState] = useState(note.content);
  const [dirty, setDirty] = useState(false);

  // Follow a refreshed bootstrap unless this editor is mid-edit.
  useEffect(() => {
    if (dirty) return;
    setContentState(note.content);
  }, [note.content, dirty]);

  const update = api.play.note.update.useMutation({
    onSuccess: (saved) => {
      setDirty(false);
      setContentState(saved.content);
      onSaved();
    },
  });

  const setContent = (value: string) => {
    setContentState(value);
    setDirty(true);
  };

  const save = () => update.mutate({ campaignId, content });

  return { content, setContent, save, update };
}
