import { IconShieldHalfFilled } from "@tabler/icons-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Button } from "@tablekeep/ui/components/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@tablekeep/ui/components/empty";

import { AttachCharacterForm } from "@/components/characters/attach-character-form";
import { CampaignSheetList } from "@/components/characters/campaign-sheet-list";
import { getSession } from "@/server/better-auth/server";
import { api } from "@/trpc/server";

import { getCampaign } from "../_lib/get-campaign";

export default async function CampaignCharactersPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [{ campaign, role, members }, session] = await Promise.all([
    getCampaign(slug),
    getSession(),
  ]);

  if (!session?.user) {
    redirect("/sign-in");
  }

  const isDm = role === "dm";
  // Players receive only their own sheets from this procedure; DMs receive all.
  const sheets = await api.character.sheet.list({ campaignId: campaign.id });
  const ownerNames = Object.fromEntries(
    members.map((member) => [member.userId, member.name]),
  );
  const canAttach = campaign.status === "active";
  const ownSheet = sheets.find((sheet) => sheet.ownerId === session.user.id);
  const ownedCharacters =
    canAttach && !ownSheet
      ? (await api.character.list({ status: "active" })).items.map(
          (character) => ({ id: character.id, name: character.name }),
        )
      : [];

  if (isDm) {
    return (
      <div className="space-y-8">
        <section>
          <h2 className="font-medium text-xl tracking-[-0.03em]">Characters</h2>
          <p className="mt-1 max-w-2xl text-muted-foreground text-sm">
            Every active sheet at this table. Open one to co-manage it with its
            player.
          </p>

          <div className="mt-6">
            {sheets.length === 0 ? (
              <Empty className="min-h-64 border bg-muted/15 px-6 py-12">
                <EmptyHeader>
                  <EmptyMedia variant="icon" className="size-11 rounded-full">
                    <IconShieldHalfFilled className="size-5" />
                  </EmptyMedia>
                  <EmptyTitle>No sheets yet</EmptyTitle>
                  <EmptyDescription>
                    Players attach their own characters. Invite the table, and
                    their sheets appear here.
                  </EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <Button asChild variant="outline">
                    <Link href={`/campaigns/${slug}/invites`}>
                      Invite players
                    </Link>
                  </Button>
                </EmptyContent>
              </Empty>
            ) : (
              <CampaignSheetList
                sheets={sheets}
                campaignSlug={slug}
                ownerNames={ownerNames}
              />
            )}
          </div>
        </section>

        {canAttach && !ownSheet ? (
          <section className="border-t pt-7">
            <h3 className="font-medium text-lg tracking-[-0.03em]">
              Play a character here too
            </h3>
            <p className="mt-1 max-w-2xl text-muted-foreground text-sm">
              Running the table does not stop you from bringing a character.
            </p>
            <div className="mt-5">
              <AttachCharacterForm
                campaignId={campaign.id}
                campaignSlug={slug}
                characters={ownedCharacters}
              />
            </div>
          </section>
        ) : null}
      </div>
    );
  }

  return (
    <section>
      <h2 className="font-medium text-xl tracking-[-0.03em]">Your character</h2>
      <p className="mt-1 max-w-2xl text-muted-foreground text-sm">
        Your sheet for this campaign. Other players' sheets stay private to them
        and the DMs.
      </p>

      <div className="mt-6">
        {sheets.length > 0 ? (
          <CampaignSheetList sheets={sheets} campaignSlug={slug} />
        ) : canAttach ? (
          <AttachCharacterForm
            campaignId={campaign.id}
            campaignSlug={slug}
            characters={ownedCharacters}
          />
        ) : (
          <Empty className="min-h-64 border bg-muted/15 px-6 py-12">
            <EmptyHeader>
              <EmptyMedia variant="icon" className="size-11 rounded-full">
                <IconShieldHalfFilled className="size-5" />
              </EmptyMedia>
              <EmptyTitle>This campaign is archived</EmptyTitle>
              <EmptyDescription>
                Archived campaigns stay readable, but no new sheet can start
                here. Ask your DM to restore it first.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </div>
    </section>
  );
}
