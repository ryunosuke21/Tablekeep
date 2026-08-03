"use client";

import { useRouter } from "next/navigation";

import {
  NativeSelect,
  NativeSelectOption,
} from "@tablekeep/ui/components/native-select";
import { toast } from "@tablekeep/ui/components/sonner";

import { api } from "@/trpc/react";

/**
 * DM-only role control. The server re-checks the DM permission and refuses to
 * leave a campaign without a DM, so a rejected change surfaces as an error.
 */
export function MemberRoleSelect({
  campaignId,
  memberId,
  memberName,
  role,
}: {
  campaignId: string;
  memberId: string;
  memberName: string;
  role: "dm" | "player";
}) {
  const router = useRouter();
  const updateRole = api.campaign.members.updateRole.useMutation({
    onSuccess: (updated) => {
      toast.success(
        updated.role === "dm"
          ? `${memberName} is now a DM`
          : `${memberName} is now a player`,
      );
      router.refresh();
    },
    onError: (error) => {
      toast.error("The role did not change", { description: error.message });
      router.refresh();
    },
  });

  return (
    <NativeSelect
      size="sm"
      aria-label={`Role for ${memberName}`}
      value={role}
      disabled={updateRole.isPending}
      onChange={(event) =>
        updateRole.mutate({
          campaignId,
          memberId,
          role: event.target.value as "dm" | "player",
        })
      }
    >
      <NativeSelectOption value="dm">DM</NativeSelectOption>
      <NativeSelectOption value="player">Player</NativeSelectOption>
    </NativeSelect>
  );
}
