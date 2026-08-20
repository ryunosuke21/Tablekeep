"use client";

import type { ReactNode } from "react";
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

import { Button } from "@tablekeep/ui/components/button";
import { LoadingSwap } from "@tablekeep/ui/components/loading-swap";
import { Spinner } from "@tablekeep/ui/components/spinner";
import { Textarea } from "@tablekeep/ui/components/textarea";

import { CharacterSheet } from "@/components/characters/character-sheet";
import { SaveStatus, saveState } from "@/components/characters/save-status";
import { SheetCurrencies } from "@/components/characters/sheet-currencies";
import { SheetInventory } from "@/components/characters/sheet-inventory";
import {
  EmptyNote,
  ReadEntry,
  ReadField,
  ReadList,
  ReadStat,
} from "@/components/characters/sheet-readouts";
import { SheetSpells } from "@/components/characters/sheet-spells";
import { env } from "@/env/client";
import { usePartyKitConnection } from "@/hooks/use-partykit-connection";
import type { RouterOutputs } from "@/trpc/react";
import { api } from "@/trpc/react";

import { PlayShell } from "../shared/play-shell";
import { TurnRail, type TurnRailCombatant } from "../shared/turn-rail";
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
  const [section, setSection] = useState<SectionValue>("character");

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
    return (
      <main className="flex min-h-svh items-center justify-center bg-background px-6 py-12">
        <p className="flex items-center gap-2 text-muted-foreground text-sm">
          <Spinner /> Loading the table…
        </p>
      </main>
    );
  }

  if (bootstrap.isError) {
    return (
      <main className="flex min-h-svh items-center justify-center bg-background px-6 py-12">
        <p className="max-w-sm text-balance text-center text-muted-foreground text-sm">
          This player view could not be loaded.{" "}
          {bootstrap.error.message || "Try again in a moment."}
        </p>
      </main>
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
        />
      ) : null}
      {section === "inventory" ? (
        <InventorySection
          campaignId={campaignId}
          campaignSlug={campaign.slug}
          sheet={sheet}
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

function NoActiveCharacter({ campaignSlug }: { campaignSlug: string }) {
  return (
    <div className="flex flex-col gap-3">
      <EmptyNote>
        No active character is attached to this campaign yet.
      </EmptyNote>
      <Button asChild className="min-h-11 w-fit">
        <Link href={`/campaigns/${campaignSlug}/characters`}>
          Go to characters
        </Link>
      </Button>
    </div>
  );
}

function CharacterSection({
  campaign,
  sheet,
  encounter,
}: {
  campaign: PlayerCampaign;
  sheet: PlayerSheet | null;
  encounter: PlayerEncounter | null;
}) {
  const [showFullSheet, setShowFullSheet] = useState(false);

  if (!sheet) {
    return (
      <SectionShell headingId="character-heading" heading="Character">
        <NoActiveCharacter campaignSlug={campaign.slug} />
      </SectionShell>
    );
  }

  if (!showFullSheet) {
    const ownCombatant = encounter?.combatants.find(
      (combatant) => combatant.sheetId === sheet.id,
    );

    return (
      <PlayerCharacterPanel
        sheet={sheet}
        currentHp={ownCombatant?.currentHp}
        tempHp={ownCombatant?.tempHp}
        encounterEffects={ownCombatant?.effects}
        onOpenFullSheet={() => setShowFullSheet(true)}
      />
    );
  }

  return (
    <div className="grid gap-5">
      <Button
        type="button"
        variant="outline"
        className="min-h-11 w-fit rounded-none border-[#8d6635] bg-[#0b0807] text-[#e9dfc5] hover:bg-[#24170f] hover:text-[#fff3d6]"
        onClick={() => setShowFullSheet(false)}
      >
        Back to overview
      </Button>
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
      <SectionShell headingId="turn-heading" heading="Turn">
        <EmptyNote>
          No encounter is active right now. When the DM starts one, the turn
          order and your HP will show up here.
        </EmptyNote>
      </SectionShell>
    );
  }

  const activeCombatant = encounter.combatants.find(
    (combatant) => combatant.position === encounter.activePosition,
  );
  const own = sheet
    ? encounter.combatants.find((combatant) => combatant.sheetId === sheet.id)
    : undefined;

  return (
    <SectionShell headingId="turn-heading" heading="Turn">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <ReadStat label="Round" value={encounter.round ?? "Not set"} />
        <ReadStat
          label="Current turn"
          value={activeCombatant ? activeCombatant.name : "Not set"}
        />
      </div>

      {own ? (
        <div className="flex flex-col gap-3">
          <h3 className="text-[10px] text-muted-foreground uppercase tracking-[0.14em]">
            {own.name}
          </h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <ReadField
              label="HP"
              value={
                own.currentHp !== null && own.maxHp !== null
                  ? `${own.currentHp} / ${own.maxHp}${
                      own.tempHp ? ` (+${own.tempHp} temp)` : ""
                    }`
                  : null
              }
            />
          </div>
          {own.effects.length > 0 ? (
            <ReadList>
              {own.effects.map((effect) => (
                <ReadEntry
                  key={effect.id}
                  name={effect.name}
                  notes={effect.description}
                  meta={
                    effect.remainingTurns !== null
                      ? `${effect.remainingTurns} turns left`
                      : undefined
                  }
                />
              ))}
            </ReadList>
          ) : (
            <EmptyNote>No effects are on you right now.</EmptyNote>
          )}
        </div>
      ) : null}
    </SectionShell>
  );
}

function SpellsSection({
  campaignId,
  campaignSlug,
  sheet,
}: {
  campaignId: string;
  campaignSlug: string;
  sheet: PlayerSheet | null;
}) {
  const [showManager, setShowManager] = useState(false);

  if (!sheet) {
    return (
      <SectionShell headingId="spells-heading" heading="Spells">
        <NoActiveCharacter campaignSlug={campaignSlug} />
      </SectionShell>
    );
  }

  if (!showManager) {
    return (
      <PlayerSpellbookPanel
        spells={sheet.spells}
        onManageSpells={() => setShowManager(true)}
      />
    );
  }

  return (
    <SectionShell headingId="spells-heading" heading="Spells">
      <Button
        type="button"
        variant="outline"
        className="min-h-11 w-fit rounded-none border-[#8d6635] bg-[#0b0807] text-[#e9dfc5] hover:bg-[#24170f] hover:text-[#fff3d6]"
        onClick={() => setShowManager(false)}
      >
        Back to spellbook
      </Button>
      <SheetSpells
        campaignId={campaignId}
        sheetId={sheet.id}
        spells={sheet.spells}
        disabled={false}
        canEdit
      />
    </SectionShell>
  );
}

function InventorySection({
  campaignId,
  campaignSlug,
  sheet,
}: {
  campaignId: string;
  campaignSlug: string;
  sheet: PlayerSheet | null;
}) {
  const [showManager, setShowManager] = useState(false);

  if (!sheet) {
    return (
      <SectionShell headingId="inventory-heading" heading="Inventory">
        <NoActiveCharacter campaignSlug={campaignSlug} />
      </SectionShell>
    );
  }

  if (!showManager) {
    return (
      <PlayerInventoryPanel
        items={sheet.items}
        currencies={sheet.currencies}
        onManageInventory={() => setShowManager(true)}
      />
    );
  }

  return (
    <SectionShell headingId="inventory-heading" heading="Inventory">
      <Button
        type="button"
        variant="outline"
        className="min-h-11 w-fit rounded-none border-[#8d6635] bg-[#0b0807] text-[#e9dfc5] hover:bg-[#24170f] hover:text-[#fff3d6]"
        onClick={() => setShowManager(false)}
      >
        Back to inventory
      </Button>
      <div className="flex flex-col gap-7">
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
    </SectionShell>
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
      <SectionShell headingId="party-heading" heading="Party">
        <EmptyNote>
          No one else has an active character in this campaign yet.
        </EmptyNote>
      </SectionShell>
    );
  }

  return (
    <SectionShell headingId="party-heading" heading="Party">
      <ul className="grid list-none gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {party.map((member) => (
          <li
            key={member.sheetId}
            className="flex min-w-0 items-center gap-3 border border-[#6b4a24]/60 bg-[#0c0907] p-3"
          >
            <div className="flex size-12 shrink-0 items-center justify-center rounded-full border border-[#8d6635] bg-[#25140f] font-display text-[#e9dfc5] text-sm">
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
                <p className="truncate font-display text-[#f2e5c8]">
                  {member.name}
                </p>
                {member.sheetId === sheet?.id ? (
                  <span className="shrink-0 border border-cyan-700/70 px-1.5 py-0.5 font-sans text-[9px] text-cyan-200 uppercase tracking-wider">
                    You
                  </span>
                ) : null}
              </div>
              <p className="mt-1 truncate font-sans text-[#b99c70] text-xs">
                {member.classes.length > 0
                  ? member.classes
                      .map((entry) => `${entry.name} ${entry.level}`)
                      .join(" / ")
                  : `Level ${member.totalLevel}`}
              </p>
              {member.ancestry ? (
                <p className="mt-0.5 truncate text-[#8f7656] text-xs">
                  {member.ancestry}
                </p>
              ) : null}
            </div>
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
  note: PlayerNote;
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
      void utils.play.player.bootstrap.invalidate({ campaignId });
    },
  });

  function save() {
    update.mutate({ campaignId, content });
  }

  return (
    <SectionShell headingId="notes-heading" heading="Notes">
      <p className="text-[#9f8562] text-sm">
        Private to you. The DM cannot see this.
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
