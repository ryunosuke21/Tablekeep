"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { Button } from "@tablekeep/ui/components/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@tablekeep/ui/components/tabs";

import type { RouterOutputs } from "@/trpc/react";
import { api } from "@/trpc/react";

import { SheetBackgrounds } from "./sheet-backgrounds";
import { SheetBackstoryForm } from "./sheet-backstory-form";
import { SheetClasses } from "./sheet-classes";
import { SheetConditions } from "./sheet-conditions";
import { SheetCurrencies } from "./sheet-currencies";
import { SheetDetailsForm } from "./sheet-details-form";
import { SheetFeats } from "./sheet-feats";
import { SheetFolioHeader } from "./sheet-folio-header";
import { SheetHistory } from "./sheet-history";
import { SheetInventory } from "./sheet-inventory";
import { SheetLifecycle } from "./sheet-lifecycle";
import { SheetNpcs } from "./sheet-npcs";
import { ReadProse } from "./sheet-readouts";
import { SheetSection } from "./sheet-section";
import { SheetSpells } from "./sheet-spells";
import { SheetStats } from "./sheet-stats";

export type CharacterSheetDetail = RouterOutputs["character"]["sheet"]["get"];

const TABS = [
  { value: "overview", label: "Overview" },
  { value: "lore", label: "Lore" },
  { value: "inventory", label: "Inventory" },
  { value: "spellbook", label: "Spellbook" },
  { value: "changes", label: "Changes" },
] as const;

type TabValue = (typeof TABS)[number]["value"];

function isTabValue(value: string | null): value is TabValue {
  return TABS.some((tab) => tab.value === value);
}

/**
 * A character read as a profile: one plate of identity, then tabs for the
 * parts of the sheet somebody actually came to look at.
 *
 * Editing here is the DM's, even for the player who owns the character. That
 * is a deliberate choice about what this page is for, not an authorization
 * boundary — the router still decides who may write, and it still accepts the
 * owner, for the player-facing editor that comes later.
 */
export function CharacterSheet({
  campaignId,
  campaignSlug,
  campaignName,
  campaignArchived,
  sheetId,
  initialSheet,
  canEdit,
}: {
  campaignId: string;
  campaignSlug: string;
  campaignName: string;
  campaignArchived: boolean;
  sheetId: string;
  initialSheet: CharacterSheetDetail;
  canEdit: boolean;
}) {
  const { data: sheet } = api.character.sheet.get.useQuery(
    { campaignId, sheetId },
    { initialData: initialSheet, staleTime: 10_000 },
  );

  const [tab, setTab] = useState<TabValue>("overview");

  // Read the opening tab from the URL once mounted, so a shared link lands
  // where it was shared from without making this a server-rendered param.
  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("tab");
    if (isTabValue(requested)) setTab(requested);
  }, []);

  function selectTab(next: string) {
    if (!isTabValue(next)) return;
    setTab(next);
    const url = new URL(window.location.href);
    if (next === "overview") url.searchParams.delete("tab");
    else url.searchParams.set("tab", next);
    window.history.replaceState(null, "", url);
  }

  const retired = sheet.retiredAt !== null;
  const disabled = retired || campaignArchived;
  const displayName = sheet.name?.trim() ? sheet.name.trim() : sheet.charName;
  const classSummary =
    sheet.classes.length > 0
      ? sheet.classes.map((entry) => `${entry.name} ${entry.level}`).join(" / ")
      : null;

  return (
    <div className="flex flex-col gap-7">
      <SheetFolioHeader
        displayName={displayName}
        characterName={sheet.charName}
        campaignName={campaignName}
        campaignSlug={campaignSlug}
        totalLevel={sheet.totalLevel}
        maxHp={sheet.maxHp}
        ancestry={sheet.ancestry}
        alignment={sheet.alignment}
        classSummary={classSummary}
        retired={retired}
        actions={
          <>
            <Button asChild variant="ghost" className="min-h-11">
              <Link href={`/characters/${sheet.charSlug}`}>
                Character identity
              </Link>
            </Button>
            {canEdit ? (
              <SheetLifecycle
                campaignId={campaignId}
                sheetId={sheetId}
                displayName={displayName}
                retired={retired}
                campaignArchived={campaignArchived}
              />
            ) : null}
          </>
        }
      />

      {retired && !campaignArchived ? (
        <p
          role="status"
          className="rounded-xl border border-dashed px-4 py-3 text-muted-foreground text-sm"
        >
          This sheet is retired, so it cannot be edited. Return it to play to
          make changes.
        </p>
      ) : null}

      {!canEdit ? (
        <p className="text-muted-foreground text-sm">
          This is a read-only view. Changes to this sheet are made by the
          campaign's DM.
        </p>
      ) : null}

      <Tabs value={tab} onValueChange={selectTab}>
        <TabsList variant="line" className="w-full overflow-x-auto">
          {TABS.map((entry) => (
            <TabsTrigger key={entry.value} value={entry.value}>
              {entry.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview" className="flex flex-col gap-9 pt-4">
          <SheetSection
            title="Stats"
            description="Ability scores, named the way your table names them."
          >
            <SheetStats
              campaignId={campaignId}
              sheetId={sheetId}
              stats={sheet.stats}
              disabled={disabled}
              canEdit={canEdit}
            />
          </SheetSection>

          <SheetSection
            title="Classes"
            description="One row per class. Levels add up to the total on the plate."
          >
            <SheetClasses
              campaignId={campaignId}
              sheetId={sheetId}
              classes={sheet.classes}
              totalLevel={sheet.totalLevel}
              disabled={disabled}
              canEdit={canEdit}
            />
          </SheetSection>

          <SheetSection
            title="Backgrounds"
            count={`${sheet.backgrounds.length}`}
            description="Where they came from, and what that still gets them."
          >
            <SheetBackgrounds
              campaignId={campaignId}
              sheetId={sheetId}
              backgrounds={sheet.backgrounds}
              disabled={disabled}
              canEdit={canEdit}
            />
          </SheetSection>

          <SheetSection
            title="Feats"
            count={`${sheet.feats.length}`}
            description="What they can do that most cannot."
          >
            <SheetFeats
              campaignId={campaignId}
              sheetId={sheetId}
              feats={sheet.feats}
              disabled={disabled}
              canEdit={canEdit}
            />
          </SheetSection>

          <SheetSection
            title="Conditions"
            count={`${sheet.conditions.length}`}
            description="What is affecting them right now."
          >
            <SheetConditions
              campaignId={campaignId}
              sheetId={sheetId}
              conditions={sheet.conditions}
              disabled={disabled}
              canEdit={canEdit}
            />
          </SheetSection>

          <SheetSection
            title="Description"
            description="Appearance, alignment, and what this campaign calls them."
            className="pb-4"
          >
            <SheetDetailsForm
              campaignId={campaignId}
              sheetId={sheetId}
              name={sheet.name}
              ancestry={sheet.ancestry}
              alignment={sheet.alignment}
              appearance={sheet.appearance}
              maxHp={sheet.maxHp}
              notes={sheet.notes}
              disabled={disabled}
              canEdit={canEdit}
            />
          </SheetSection>
        </TabsContent>

        <TabsContent value="lore" className="flex flex-col gap-9 pt-4">
          <SheetSection
            title="Backstory"
            description="What happened before this campaign started."
          >
            <SheetBackstoryForm
              campaignId={campaignId}
              sheetId={sheetId}
              backstory={sheet.backstory}
              disabled={disabled}
              canEdit={canEdit}
            />
          </SheetSection>

          <SheetSection
            title="Character bio"
            description="Carried from the character's identity, the same at every table."
          >
            <ReadProse
              value={sheet.charBio}
              empty="This character has no bio yet."
            />
          </SheetSection>

          <SheetSection
            title="Connections"
            count={`${sheet.npcs.length}`}
            description="The people this character knows, and what stands between them."
            className="pb-4"
          >
            <SheetNpcs
              campaignId={campaignId}
              sheetId={sheetId}
              npcs={sheet.npcs}
              disabled={disabled}
              canEdit={canEdit}
            />
          </SheetSection>
        </TabsContent>

        <TabsContent value="inventory" className="flex flex-col gap-9 pt-4">
          <SheetSection
            title="Carried"
            description="Gear, quantities, and what is currently equipped."
          >
            <SheetInventory
              campaignId={campaignId}
              sheetId={sheetId}
              items={sheet.items}
              disabled={disabled}
              canEdit={canEdit}
            />
          </SheetSection>

          <SheetSection
            title="Purse"
            description="Any number of currencies, named however your table names them."
            className="pb-4"
          >
            <SheetCurrencies
              campaignId={campaignId}
              sheetId={sheetId}
              currencies={sheet.currencies}
              disabled={disabled}
              canEdit={canEdit}
            />
          </SheetSection>
        </TabsContent>

        <TabsContent value="spellbook" className="pt-4">
          <SheetSection
            title="Spellbook"
            description="Everything they have learned, and what is prepared today."
            className="border-t-0 pt-0 pb-4"
          >
            <SheetSpells
              campaignId={campaignId}
              sheetId={sheetId}
              spells={sheet.spells}
              disabled={disabled}
              canEdit={canEdit}
            />
          </SheetSection>
        </TabsContent>

        <TabsContent value="changes" className="pt-4">
          <SheetSection
            title="Changes"
            description="Who changed what on this sheet, and when."
            className="border-t-0 pt-0 pb-4"
          >
            <SheetHistory campaignId={campaignId} sheetId={sheetId} />
          </SheetSection>
        </TabsContent>
      </Tabs>
    </div>
  );
}
