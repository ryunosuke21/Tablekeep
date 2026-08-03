"use client";

import { useRouter } from "next/navigation";

import { Button } from "@tablekeep/ui/components/button";
import { LoadingSwap } from "@tablekeep/ui/components/loading-swap";
import { toast } from "@tablekeep/ui/components/sonner";

import { api } from "@/trpc/react";

import { ConfirmActionDialog } from "./confirm-action-dialog";

export function ArchiveCampaignDialog({
  campaignId,
  campaignName,
  status,
}: {
  campaignId: string;
  campaignName: string;
  status: "active" | "archived";
}) {
  const router = useRouter();
  const archive = api.campaign.archive.useMutation({
    onSuccess: () => {
      toast.success(`${campaignName} is archived`);
      router.refresh();
    },
    onError: (error) => {
      toast.error("The campaign was not archived", {
        description: error.message,
      });
    },
  });
  const restore = api.campaign.restore.useMutation({
    onSuccess: () => {
      toast.success(`${campaignName} is active again`);
      router.refresh();
    },
    onError: (error) => {
      toast.error("The campaign was not restored", {
        description: error.message,
      });
    },
  });

  if (status === "archived") {
    return (
      <Button
        type="button"
        variant="outline"
        disabled={restore.isPending}
        onClick={() => restore.mutate({ campaignId })}
      >
        <LoadingSwap isLoading={restore.isPending}>
          Restore campaign
        </LoadingSwap>
      </Button>
    );
  }

  return (
    <ConfirmActionDialog
      trigger={
        <Button
          type="button"
          variant="destructive"
          disabled={archive.isPending}
        >
          Archive campaign
        </Button>
      }
      title={`Archive ${campaignName}?`}
      consequence="Everyone keeps read access, but nobody can change the campaign, and every pending invitation is revoked. You can restore it from this page."
      confirmLabel="Archive campaign"
      cancelLabel="Keep it active"
      isPending={archive.isPending}
      onConfirm={() => archive.mutate({ campaignId })}
    />
  );
}
