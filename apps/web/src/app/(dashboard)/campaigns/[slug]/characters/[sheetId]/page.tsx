import type { Metadata } from "next";
import { cache } from "react";
import { TRPCError } from "@trpc/server";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CharacterSheet } from "@/components/characters/character-sheet";
import { api } from "@/trpc/server";

import { getCampaign } from "../../_lib/get-campaign";

/**
 * `character.sheet.get` answers NOT_FOUND unless the caller owns the sheet or
 * runs the campaign, so a private sheet and a missing one look the same here.
 * The sibling `not-found.tsx` catches this so a sheet-level miss never reports
 * the campaign itself as unavailable.
 */
const getSheet = cache(async (campaignId: string, sheetId: string) => {
  try {
    return await api.character.sheet.get({ campaignId, sheetId });
  } catch (error) {
    if (
      error instanceof TRPCError &&
      (error.code === "NOT_FOUND" || error.code === "BAD_REQUEST")
    ) {
      notFound();
    }
    throw error;
  }
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; sheetId: string }>;
}): Promise<Metadata> {
  const { slug, sheetId } = await params;
  const { campaign } = await getCampaign(slug);
  const sheet = await getSheet(campaign.id, sheetId);
  const displayName = sheet.name?.trim() ? sheet.name : sheet.charName;

  return {
    title: `${displayName} · ${campaign.name} | Tablekeep`,
    description: `Campaign sheet for ${displayName}.`,
  };
}

export default async function CampaignSheetPage({
  params,
}: {
  params: Promise<{ slug: string; sheetId: string }>;
}) {
  const { slug, sheetId } = await params;
  const { campaign } = await getCampaign(slug);
  const sheet = await getSheet(campaign.id, sheetId);

  return (
    <div>
      <nav
        aria-label="Breadcrumb"
        className="mb-5 text-muted-foreground text-sm"
      >
        <Link
          href={`/campaigns/${slug}/characters`}
          className="hover:text-foreground"
        >
          Characters
        </Link>
        <span aria-hidden="true"> / </span>
        <span className="text-foreground">
          {sheet.name?.trim() ? sheet.name : sheet.charName}
        </span>
      </nav>

      <CharacterSheet
        campaignId={campaign.id}
        campaignSlug={slug}
        campaignName={campaign.name}
        campaignArchived={campaign.status === "archived"}
        sheetId={sheetId}
        initialSheet={sheet}
      />
    </div>
  );
}
