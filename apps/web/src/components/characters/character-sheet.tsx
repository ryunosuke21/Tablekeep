"use client";

import Link from "next/link";

import { Button } from "@tablekeep/ui/components/button";

import type { RouterOutputs } from "@/trpc/react";
import { api } from "@/trpc/react";

import { SheetBackgrounds } from "./sheet-backgrounds";
import { SheetClasses } from "./sheet-classes";
import { SheetConditions } from "./sheet-conditions";
import { SheetCurrencies } from "./sheet-currencies";
import { SheetDetailsForm } from "./sheet-details-form";
import { SheetFolioHeader } from "./sheet-folio-header";
import { SheetInventory } from "./sheet-inventory";
import { SheetLifecycle } from "./sheet-lifecycle";
import { SheetSection } from "./sheet-section";

export type CharacterSheetDetail = RouterOutputs["character"]["sheet"]["get"];

/**
 * The whole sheet reads from one query so every nested editor invalidates a
 * single cache entry and the folio header stays in step with the sections. The
 * player who owns the sheet and the campaign's DMs share the same controls; the
 * router is the authority on who may actually write.
 */
export function CharacterSheet({
  campaignId,
  campaignSlug,
  campaignName,
  campaignArchived,
  sheetId,
  initialSheet,
}: {
  campaignId: string;
  campaignSlug: string;
  campaignName: string;
  campaignArchived: boolean;
  sheetId: string;
  initialSheet: CharacterSheetDetail;
}) {
  const { data: sheet } = api.character.sheet.get.useQuery(
    { campaignId, sheetId },
    { initialData: initialSheet, staleTime: 10_000 },
  );

  const retired = sheet.retiredAt !== null;
  const disabled = retired || campaignArchived;
  const displayName = sheet.name?.trim() ? sheet.name.trim() : sheet.charName;

  return (
    <div className="flex flex-col gap-9">
      <SheetFolioHeader
        displayName={displayName}
        characterName={sheet.charName}
        campaignName={campaignName}
        campaignSlug={campaignSlug}
        totalLevel={sheet.totalLevel}
        maxHp={sheet.maxHp}
        ancestry={sheet.ancestry}
        retired={retired}
        actions={
          <>
            <Button asChild variant="ghost" className="min-h-11">
              <Link href={`/characters/${sheet.charSlug}`}>
                Character identity
              </Link>
            </Button>
            <SheetLifecycle
              campaignId={campaignId}
              sheetId={sheetId}
              displayName={displayName}
              retired={retired}
              campaignArchived={campaignArchived}
            />
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

      <SheetSection
        title="Sheet details"
        description="What this campaign knows about them, and how much punishment they can take."
      >
        <SheetDetailsForm
          campaignId={campaignId}
          sheetId={sheetId}
          name={sheet.name}
          ancestry={sheet.ancestry}
          maxHp={sheet.maxHp}
          notes={sheet.notes}
          disabled={disabled}
        />
      </SheetSection>

      <SheetSection
        title="Classes"
        description="One row per class. Levels add up to the total on the folio."
      >
        <SheetClasses
          campaignId={campaignId}
          sheetId={sheetId}
          classes={sheet.classes}
          totalLevel={sheet.totalLevel}
          disabled={disabled}
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
        />
      </SheetSection>

      <SheetSection
        title="Inventory"
        description="Gear, quantities, and what is currently equipped."
      >
        <SheetInventory
          campaignId={campaignId}
          sheetId={sheetId}
          items={sheet.items}
          disabled={disabled}
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
        />
      </SheetSection>
    </div>
  );
}
