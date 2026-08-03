import type { Metadata } from "next";
import { IconFlag3 } from "@tabler/icons-react";
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
import { cn } from "@tablekeep/ui/lib/utils";

import { CampaignCard } from "@/components/dashboard/campaign-card";
import { api } from "@/trpc/server";

export const metadata: Metadata = {
  title: "Campaigns | Tablekeep",
  description: "The campaigns you run and the tables you have joined.",
};

type CampaignFilter = "active" | "archived";

const filters: Array<{ value: CampaignFilter; label: string }> = [
  { value: "active", label: "Active" },
  { value: "archived", label: "Archived" },
];

export default async function CampaignsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const filter: CampaignFilter = status === "archived" ? "archived" : "active";
  const campaigns = await api.campaign.list({ status: filter });

  return (
    <main className="relative mx-auto flex w-full max-w-[92rem] flex-1 flex-col px-4 py-8 sm:px-6 sm:py-10 lg:px-10">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] text-tk-ember uppercase tracking-[0.18em]">
            Campaign folio
          </p>
          <h1 className="mt-3 font-semibold text-3xl tracking-[-0.04em]">
            Campaigns
          </h1>
          <p className="mt-2 max-w-xl text-muted-foreground">
            Everything you run or play in, with the next session on each card.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href="/campaigns/new">New campaign</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/join">Enter a code</Link>
          </Button>
        </div>
      </header>

      <nav aria-label="Campaign status" className="mt-8 flex gap-2">
        {filters.map((option) => (
          <Link
            key={option.value}
            href={
              option.value === "active"
                ? "/campaigns"
                : `/campaigns?status=${option.value}`
            }
            aria-current={filter === option.value ? "true" : undefined}
            className={cn(
              "rounded-full border px-3 py-1 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2",
              filter === option.value
                ? "border-foreground/30 bg-muted font-medium"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {option.label}
          </Link>
        ))}
      </nav>

      <div className="mt-6 pb-12">
        {campaigns.items.length === 0 ? (
          <Empty className="border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <IconFlag3 />
              </EmptyMedia>
              <EmptyTitle>
                {filter === "archived"
                  ? "No archived campaigns"
                  : "No campaigns yet"}
              </EmptyTitle>
              <EmptyDescription>
                {filter === "archived"
                  ? "Campaigns you archive stay readable and show up here."
                  : "Create the campaign you will run, or join one with the code your DM shared."}
              </EmptyDescription>
            </EmptyHeader>
            {filter === "archived" ? null : (
              <EmptyContent>
                <Button asChild>
                  <Link href="/campaigns/new">Create a campaign</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/join">Join with a code</Link>
                </Button>
              </EmptyContent>
            )}
          </Empty>
        ) : (
          <ul className="grid items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {campaigns.items.map((campaign) => (
              <li key={campaign.id}>
                <CampaignCard campaign={campaign} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
