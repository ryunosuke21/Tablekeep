import type { Metadata } from "next";
import { cache } from "react";
import { TRPCError } from "@trpc/server";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@tablekeep/ui/components/button";

import { AttachCampaignForm } from "@/components/characters/attach-campaign-form";
import { CharacterIdentityForm } from "@/components/characters/character-identity-form";
import { DeleteCharacterDialog } from "@/components/characters/delete-character-dialog";
import { SheetRow, SheetSection } from "@/components/characters/sheet-section";
import { api } from "@/trpc/server";

/**
 * `character.get` is owner-scoped, so a character that belongs to someone else
 * and one that does not exist both answer NOT_FOUND here.
 */
const getCharacter = cache(async (slug: string) => {
  try {
    return await api.character.get({ slug });
  } catch (error) {
    if (error instanceof TRPCError && error.code === "NOT_FOUND") {
      notFound();
    }
    throw error;
  }
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const character = await getCharacter(slug);

  return {
    title: `${character.name} | Tablekeep`,
    description: character.bio ?? "A character in Tablekeep.",
  };
}

export default async function CharacterDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const character = await getCharacter(slug);

  // `character.list` carries the caller-visible sheet summaries for each owned
  // character; `character.get` returns identity only.
  const [owned, campaigns] = await Promise.all([
    api.character.list({ status: "active" }),
    api.campaign.list({ status: "active" }),
  ]);
  const sheets =
    owned.items.find((item) => item.id === character.id)?.sheets ?? [];
  const attachedCampaignIds = new Set(sheets.map((sheet) => sheet.campaignId));
  const attachable = campaigns.items
    .filter((campaign) => !attachedCampaignIds.has(campaign.id))
    .map((campaign) => ({
      id: campaign.id,
      name: campaign.name,
      slug: campaign.slug,
    }));

  return (
    <main className="relative mx-auto flex w-full max-w-4xl flex-1 flex-col px-4 py-8 sm:px-6 sm:py-10">
      <nav aria-label="Breadcrumb" className="text-muted-foreground text-sm">
        <Link href="/characters" className="hover:text-foreground">
          Characters
        </Link>
        <span aria-hidden="true"> / </span>
        <span className="text-foreground">{character.name}</span>
      </nav>

      <header className="mt-5">
        <p className="text-[10px] text-tk-ember uppercase tracking-[0.18em]">
          Character identity
        </p>
        <h1 className="mt-3 font-semibold text-3xl tracking-[-0.04em]">
          {character.name}
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Name and bio follow this character everywhere. Ancestry, classes, hit
          points, and gear live on each campaign's sheet.
        </p>
      </header>

      <div className="mt-9 flex flex-col gap-9">
        <section>
          <h2 className="font-medium text-lg tracking-[-0.03em]">Identity</h2>
          <div className="mt-5 rounded-2xl border bg-background p-5 sm:p-6">
            <CharacterIdentityForm
              charId={character.id}
              name={character.name}
              bio={character.bio}
            />
          </div>
        </section>

        <SheetSection
          title="Campaigns"
          count={`${sheets.length}`}
          description="Where this character is in play. Open a sheet to change anything mechanical."
        >
          {sheets.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              {character.name} is not on any table yet. Start a sheet below.
            </p>
          ) : (
            <div className="rounded-xl border px-5 py-4">
              {sheets.map((sheet) => (
                <SheetRow key={sheet.id}>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-sm">
                        {sheet.campaignName}
                      </p>
                      <p className="mt-0.5 text-muted-foreground text-xs">
                        {sheet.name?.trim() ? `Plays as ${sheet.name} · ` : ""}
                        {sheet.ancestry?.trim() ? `${sheet.ancestry} · ` : ""}
                        Level {sheet.totalLevel} · {sheet.maxHp} max HP
                      </p>
                    </div>
                    <Button asChild variant="outline" className="min-h-10">
                      <Link
                        href={`/campaigns/${sheet.campaignSlug}/characters/${sheet.id}`}
                      >
                        Open sheet
                      </Link>
                    </Button>
                  </div>
                </SheetRow>
              ))}
            </div>
          )}
        </SheetSection>

        <SheetSection
          title="Join a campaign"
          description="Only campaigns you have joined can hold a sheet for this character."
        >
          <AttachCampaignForm
            charId={character.id}
            characterName={character.name}
            campaigns={attachable}
          />
        </SheetSection>

        <SheetSection
          title="Delete this character"
          description="Deleting retires every campaign sheet. You can restore the character later."
          className="pb-12"
        >
          <DeleteCharacterDialog
            charId={character.id}
            name={character.name}
            activeSheetCount={sheets.length}
          />
        </SheetSection>
      </div>
    </main>
  );
}
