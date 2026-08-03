"use client";

import { useState } from "react";
import { IconCheck, IconCopy } from "@tabler/icons-react";
import { useRouter } from "next/navigation";

import { Button } from "@tablekeep/ui/components/button";
import { LoadingSwap } from "@tablekeep/ui/components/loading-swap";
import { toast } from "@tablekeep/ui/components/sonner";

import {
  formatDate,
  formatInviteCodeDisplay,
  inviteCodePath,
} from "@/lib/campaign-format";
import type { RouterOutputs } from "@/trpc/react";
import { api } from "@/trpc/react";

import { ConfirmActionDialog } from "./confirm-action-dialog";

type LinkCode =
  RouterOutputs["campaign"]["invites"]["list"]["linkCodes"][number];

export function InviteLinkField({
  campaignId,
  linkCode,
}: {
  campaignId: string;
  linkCode: LinkCode | undefined;
}) {
  const router = useRouter();
  const [copied, setCopied] = useState<"link" | "code" | null>(null);

  const createLink = api.campaign.invites.createLink.useMutation({
    onSuccess: () => {
      toast.success("Invitation link ready");
      router.refresh();
    },
    onError: (error) => {
      toast.error("The link was not created", { description: error.message });
    },
  });

  const revokeLink = api.campaign.invites.revoke.useMutation({
    onSuccess: () => {
      toast.success("Invitation link revoked");
      router.refresh();
    },
    onError: (error) => {
      toast.error("The link was not revoked", { description: error.message });
    },
  });

  const isPending = createLink.isPending || revokeLink.isPending;

  async function copy(value: string, kind: "link" | "code") {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(kind);
      window.setTimeout(() => setCopied(null), 2_000);
    } catch {
      toast.error("Copying failed", {
        description: "Select the code and copy it by hand.",
      });
    }
  }

  if (!linkCode) {
    return (
      <div className="space-y-3">
        <p className="text-muted-foreground text-sm">
          No active link. Create one to invite players with a code they can type
          at the table.
        </p>
        <Button
          type="button"
          variant="outline"
          disabled={isPending}
          onClick={() => createLink.mutate({ campaignId })}
        >
          <LoadingSwap isLoading={createLink.isPending}>
            Create invitation link
          </LoadingSwap>
        </Button>
      </div>
    );
  }

  const display = formatInviteCodeDisplay(linkCode.code);
  const path = inviteCodePath(linkCode.code);
  const uses =
    linkCode.maxUses === null
      ? `${linkCode.useCount} used`
      : `${linkCode.useCount} of ${linkCode.maxUses} used`;

  return (
    <div className="space-y-3">
      <div className="rounded-lg border p-3">
        <p className="text-[11px] text-muted-foreground uppercase tracking-[0.1em]">
          Invitation code
        </p>
        <p className="mt-1 break-all font-mono text-lg tracking-[0.08em]">
          {display}
        </p>
        <p
          className="mt-1 text-muted-foreground text-xs"
          suppressHydrationWarning
        >
          Joins as {linkCode.role === "dm" ? "DM" : "player"} · {uses} · expires{" "}
          {formatDate(linkCode.expiresAt)}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => copy(`${window.location.origin}${path}`, "link")}
        >
          {copied === "link" ? <IconCheck /> : <IconCopy />}
          {copied === "link" ? "Link copied" : "Copy link"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => copy(display, "code")}
        >
          {copied === "code" ? <IconCheck /> : <IconCopy />}
          {copied === "code" ? "Code copied" : "Copy code"}
        </Button>

        <ConfirmActionDialog
          trigger={
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isPending}
            >
              Regenerate
            </Button>
          }
          title="Regenerate the invitation link?"
          consequence={`The current code ${display} stops working right away, including any copy already shared in chat.`}
          confirmLabel="Regenerate link"
          cancelLabel="Keep this link"
          isPending={createLink.isPending}
          onConfirm={() =>
            createLink.mutate({ campaignId, role: linkCode.role })
          }
        />

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
          title="Revoke the invitation link?"
          consequence={`Nobody can join with ${display} after this. Players already in the campaign keep their access.`}
          confirmLabel="Revoke link"
          cancelLabel="Keep this link"
          isPending={revokeLink.isPending}
          onConfirm={() =>
            revokeLink.mutate({
              campaignId,
              kind: "link",
              role: linkCode.role,
            })
          }
        />
      </div>
    </div>
  );
}
