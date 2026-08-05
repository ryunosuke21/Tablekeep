"use client";

import { IconFlag3, IconUsersGroup } from "@tabler/icons-react";
import Link from "next/link";

import { Button } from "@tablekeep/ui/components/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@tablekeep/ui/components/empty";

import {
  CharacterCard,
  type CharacterListItem,
} from "@/components/characters/character-card";

import { CampaignCard, type CampaignListItem } from "./campaign-card";
import { ExpandableCardCollection } from "./expandable-card-collection";

type DashboardOverviewProps = {
  campaigns: CampaignListItem[];
  characters: CharacterListItem[];
};

export function DashboardOverview({
  campaigns,
  characters,
}: DashboardOverviewProps) {
  return (
    <main className="relative mx-auto flex w-full max-w-[92rem] flex-1 flex-col px-4 py-8 sm:px-6 sm:py-10 lg:px-10">
      <div className="mb-10 max-w-2xl">
        <p className="text-[10px] text-tk-ember uppercase tracking-[0.18em]">
          Session desk
        </p>
        <h1 className="mt-3 font-semibold text-3xl tracking-[-0.04em] sm:text-4xl">
          Your table, at a glance.
        </h1>
        <p className="mt-3 max-w-xl text-muted-foreground leading-relaxed">
          Pick up the campaigns you run and the characters you play without
          digging through notes.
        </p>
      </div>

      <div className="flex flex-col gap-12 pb-12">
        <ExpandableCardCollection
          title="Campaigns"
          description="Worlds you run and tables you have joined."
          items={campaigns}
          getKey={(campaign) => campaign.id}
          renderItem={(campaign) => <CampaignCard campaign={campaign} />}
          emptyState={
            <Empty className="border">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <IconFlag3 />
                </EmptyMedia>
                <EmptyTitle>No campaigns yet</EmptyTitle>
                <EmptyDescription>
                  Start a campaign you will run, or join one with the code your
                  DM shared.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button asChild>
                  <Link href="/campaigns/new">Create a campaign</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/join">Join with a code</Link>
                </Button>
              </EmptyContent>
            </Empty>
          }
        />

        <div>
          <ExpandableCardCollection
            title="Characters"
            description="The people you bring to each adventure."
            items={characters}
            getKey={(character) => character.id}
            renderItem={(character) => <CharacterCard character={character} />}
            emptyState={
              <Empty className="border">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <IconUsersGroup />
                  </EmptyMedia>
                  <EmptyTitle>No characters yet</EmptyTitle>
                  <EmptyDescription>
                    Name a character first, then attach them to any campaign you
                    have joined.
                  </EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <Button asChild>
                    <Link href="/characters/new">Create a character</Link>
                  </Button>
                </EmptyContent>
              </Empty>
            }
          />

          {characters.length > 0 ? (
            <div className="mt-5 flex flex-wrap gap-2">
              <Button asChild>
                <Link href="/characters/new">Create a character</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/characters">Manage characters</Link>
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}
