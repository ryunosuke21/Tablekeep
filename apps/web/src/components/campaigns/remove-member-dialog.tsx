"use client";

import { useRouter } from "next/navigation";

import { Button } from "@tablekeep/ui/components/button";
import { toast } from "@tablekeep/ui/components/sonner";

import { api } from "@/trpc/react";

import { ConfirmActionDialog } from "./confirm-action-dialog";

export function RemoveMemberDialog({
  campaignId,
  memberId,
  memberName,
  campaignName,
}: {
  campaignId: string;
  memberId: string;
  memberName: string;
  campaignName: string;
}) {
  const router = useRouter();
  const removeMember = api.campaign.members.remove.useMutation({
    onSuccess: () => {
      toast.success(`${memberName} was removed`);
      router.refresh();
    },
    onError: (error) => {
      toast.error("That player was not removed", {
        description: error.message,
      });
    },
  });

  return (
    <ConfirmActionDialog
      trigger={
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={removeMember.isPending}
        >
          Remove
        </Button>
      }
      title={`Remove ${memberName}?`}
      consequence={`${memberName} loses access to ${campaignName} right away. The campaign keeps its history, and you can invite them again later.`}
      confirmLabel="Remove player"
      cancelLabel="Keep them in"
      isPending={removeMember.isPending}
      onConfirm={() => removeMember.mutate({ campaignId, memberId })}
    />
  );
}
