"use client";

import { useRouter } from "next/navigation";

import { Badge } from "@tablekeep/ui/components/badge";
import { Button } from "@tablekeep/ui/components/button";
import { LoadingSwap } from "@tablekeep/ui/components/loading-swap";
import { toast } from "@tablekeep/ui/components/sonner";

import { CAMPAIGN_ROLE_LABELS, formatDate } from "@/lib/campaign-format";
import type { RouterOutputs } from "@/trpc/react";
import { api } from "@/trpc/react";

import { ConfirmActionDialog } from "./confirm-action-dialog";

type EmailInvitation =
  RouterOutputs["campaign"]["invites"]["list"]["emailInvitations"][number];

function PendingInvite({
  campaignId,
  invitation,
}: {
  campaignId: string;
  invitation: EmailInvitation;
}) {
  const router = useRouter();
  const resend = api.campaign.invites.resend.useMutation({
    onSuccess: () => {
      toast.success(`Invitation resent to ${invitation.email}`);
      router.refresh();
    },
    onError: (error) => {
      toast.error("The invitation was not resent", {
        description: error.message,
      });
    },
  });
  const revoke = api.campaign.invites.revoke.useMutation({
    onSuccess: () => {
      toast.success(`Invitation for ${invitation.email} revoked`);
      router.refresh();
    },
    onError: (error) => {
      toast.error("The invitation was not revoked", {
        description: error.message,
      });
    },
  });

  const isPending = resend.isPending || revoke.isPending;

  return (
    <li className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="flex flex-wrap items-center gap-2 text-sm">
          <span className="truncate font-medium">{invitation.email}</span>
          <Badge variant="outline">
            {CAMPAIGN_ROLE_LABELS[invitation.role]}
          </Badge>
        </p>
        <p
          className="mt-0.5 text-muted-foreground text-xs"
          suppressHydrationWarning
        >
          Sent {formatDate(invitation.createdAt)} · expires{" "}
          {formatDate(invitation.expiresAt)} · delivery unconfirmed
        </p>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isPending}
          onClick={() =>
            resend.mutate({ campaignId, invitationId: invitation.id })
          }
        >
          <LoadingSwap isLoading={resend.isPending}>Resend</LoadingSwap>
        </Button>
        <ConfirmActionDialog
          trigger={
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={isPending}
            >
              Revoke
            </Button>
          }
          title={`Revoke the invitation for ${invitation.email}?`}
          consequence="The link in that email stops working. You can invite the same address again later."
          confirmLabel="Revoke invitation"
          cancelLabel="Keep it"
          isPending={revoke.isPending}
          onConfirm={() =>
            revoke.mutate({
              campaignId,
              kind: "email",
              invitationId: invitation.id,
            })
          }
        />
      </div>
    </li>
  );
}

export function PendingInviteList({
  campaignId,
  invitations,
}: {
  campaignId: string;
  invitations: EmailInvitation[];
}) {
  if (invitations.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        No pending email invitations.
      </p>
    );
  }

  return (
    <ul className="divide-y border-y">
      {invitations.map((invitation) => (
        <PendingInvite
          key={invitation.id}
          campaignId={campaignId}
          invitation={invitation}
        />
      ))}
    </ul>
  );
}
