"use client";

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@tablekeep/ui/components/empty";
import { IconFlag3, IconUsersGroup } from "@tabler/icons-react";

import type {
  CampaignSummary,
  CharacterSummary,
} from "@/server/api/mocks/dashboard";
import { CampaignCard } from "./campaign-card";
import { CharacterCard } from "./character-card";
import { ExpandableCardCollection } from "./expandable-card-collection";

type DashboardOverviewProps = {
  campaigns: CampaignSummary[];
  characters: CharacterSummary[];
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
                  Campaigns you create or join will appear here.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          }
        />

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
                  Your character sheets will be ready here when you make one.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          }
        />
      </div>
    </main>
  );
}
