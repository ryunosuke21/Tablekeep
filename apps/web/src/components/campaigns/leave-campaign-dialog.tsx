"use client";

import { useRouter } from "next/navigation";

import { Button } from "@tablekeep/ui/components/button";
import { toast } from "@tablekeep/ui/components/sonner";

import { api } from "@/trpc/react";

import { ConfirmActionDialog } from "./confirm-action-dialog";

export function LeaveCampaignDialog({
  campaignId,
  campaignName,
  isOnlyDm,
  variant = "outline",
}: {
  campaignId: string;
  campaignName: string;
  isOnlyDm: boolean;
  variant?: "outline" | "ghost";
}) {
  const router = useRouter();
  const leave = api.campaign.members.leave.useMutation({
    onSuccess: () => {
      toast.success(`You left ${campaignName}`);
      router.push("/campaigns");
      router.refresh();
    },
    onError: (error) => {
      toast.error("You are still in this campaign", {
        description: error.message,
      });
    },
  });

  if (isOnlyDm) {
    return (
      <div className="space-y-2">
        <Button type="button" variant={variant} disabled>
          Leave campaign
        </Button>
        <p className="text-muted-foreground text-sm">
          You are the only DM. Promote another member to DM first, or archive
          the campaign.
        </p>
      </div>
    );
  }

  return (
    <ConfirmActionDialog
      trigger={
        <Button type="button" variant={variant} disabled={leave.isPending}>
          Leave campaign
        </Button>
      }
      title={`Leave ${campaignName}?`}
      consequence="You lose access to this campaign immediately. Someone with the DM role has to invite you back."
      confirmLabel="Leave campaign"
      cancelLabel="Stay"
      isPending={leave.isPending}
      onConfirm={() => leave.mutate({ campaignId })}
    />
  );
}
