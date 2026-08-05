"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@tablekeep/ui/components/button";
import { Field, FieldLabel } from "@tablekeep/ui/components/field";
import { LoadingSwap } from "@tablekeep/ui/components/loading-swap";
import { NativeSelectOption } from "@tablekeep/ui/components/native-select";
import { toast } from "@tablekeep/ui/components/sonner";

import { api } from "@/trpc/react";

import { SaveStatus, saveState } from "./save-status";

export type AttachableCampaign = { id: string; name: string; slug: string };

/**
 * Starts a campaign sheet for a character the caller owns. Only active
 * campaigns the caller has joined are offered; the server re-checks membership,
 * ownership, and the one-active-sheet-per-campaign rule.
 */
export function AttachCampaignForm({
  charId,
  characterName,
  campaigns,
}: {
  charId: string;
  characterName: string;
  campaigns: AttachableCampaign[];
}) {
  const router = useRouter();
  const [campaignId, setCampaignId] = useState(campaigns[0]?.id ?? "");

  const createSheet = api.character.sheet.create.useMutation({
    onSuccess: (sheet) => {
      const campaign = campaigns.find((item) => item.id === sheet.campaignId);
      toast.success(`${characterName} joined ${campaign?.name ?? "the table"}`);
      router.refresh();
      if (campaign) {
        router.push(`/campaigns/${campaign.slug}/characters/${sheet.id}`);
      }
    },
  });

  if (campaigns.length === 0) {
    return (
      <div className="rounded-xl border border-dashed px-5 py-6">
        <p className="font-medium text-sm">No campaign left to join</p>
        <p className="mt-1 text-muted-foreground text-sm">
          {characterName} already has a sheet in every active campaign you
          belong to. Join another table to play them elsewhere.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button asChild variant="outline" className="min-h-10">
            <Link href="/join">Enter a code</Link>
          </Button>
          <Button asChild variant="outline" className="min-h-10">
            <Link href="/campaigns/new">Create a campaign</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form
      className="rounded-xl border px-5 py-5"
      onSubmit={(event) => {
        event.preventDefault();
        if (!campaignId) return;
        createSheet.mutate({ campaignId, charId });
      }}
    >
      <Field>
        <FieldLabel htmlFor="attach-campaign">Campaign</FieldLabel>
        <select
          id="attach-campaign"
          className="h-11 w-full min-w-0 rounded-lg border border-input bg-transparent px-3 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 dark:bg-input/30"
          value={campaignId}
          disabled={createSheet.isPending}
          onChange={(event) => setCampaignId(event.target.value)}
        >
          {campaigns.map((campaign) => (
            <NativeSelectOption key={campaign.id} value={campaign.id}>
              {campaign.name}
            </NativeSelectOption>
          ))}
        </select>
      </Field>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button
          type="submit"
          className="min-h-11"
          disabled={createSheet.isPending || !campaignId}
        >
          <LoadingSwap isLoading={createSheet.isPending}>
            Start a sheet
          </LoadingSwap>
        </Button>
        <SaveStatus
          state={saveState(createSheet)}
          savedLabel="Sheet created"
          onRetry={() =>
            campaignId ? createSheet.mutate({ campaignId, charId }) : undefined
          }
        />
      </div>
    </form>
  );
}
