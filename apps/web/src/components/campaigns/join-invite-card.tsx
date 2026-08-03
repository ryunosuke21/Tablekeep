"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Badge } from "@tablekeep/ui/components/badge";
import { Button } from "@tablekeep/ui/components/button";
import { LoadingSwap } from "@tablekeep/ui/components/loading-swap";
import { toast } from "@tablekeep/ui/components/sonner";

import { formatDate, roleLabel } from "@/lib/campaign-format";
import type { RouterOutputs } from "@/trpc/react";
import { api } from "@/trpc/react";

type InvitePreview = RouterOutputs["campaign"]["invites"]["preview"];

export function JoinInviteCard({
  preview,
  reference,
}: {
  preview: InvitePreview;
  reference: { code: string } | { invitationId: string };
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const accept = api.campaign.invites.accept.useMutation({
    onSuccess: (result) => {
      toast.success(
        result.status === "already_member"
          ? "You are already in this campaign"
          : `You joined ${preview.campaignName}`,
      );
      router.push(`/campaigns/${result.slug}`);
      router.refresh();
    },
    onError: (mutationError) => setError(mutationError.message),
  });

  return (
    <div className="rounded-xl border p-5 sm:p-6">
      <p className="text-[11px] text-muted-foreground uppercase tracking-[0.12em]">
        Campaign invitation
      </p>
      <h1 className="mt-2 break-words font-semibold text-2xl tracking-[-0.03em]">
        {preview.campaignName}
      </h1>

      <dl className="mt-5 divide-y border-y">
        {preview.inviterName ? (
          <div className="flex items-baseline justify-between gap-4 py-2">
            <dt className="text-muted-foreground text-sm">Invited by</dt>
            <dd className="text-sm">{preview.inviterName}</dd>
          </div>
        ) : null}
        <div className="flex items-baseline justify-between gap-4 py-2">
          <dt className="text-muted-foreground text-sm">You join as</dt>
          <dd>
            <Badge variant="outline">{roleLabel(preview.role)}</Badge>
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-4 py-2">
          <dt className="text-muted-foreground text-sm">Expires</dt>
          <dd className="text-sm tabular-nums" suppressHydrationWarning>
            {formatDate(preview.expiresAt)}
          </dd>
        </div>
      </dl>

      {preview.alreadyMember ? (
        <>
          <p className="mt-5 text-muted-foreground text-sm">
            You are already in this campaign, so there is nothing to accept.
          </p>
          <Button asChild className="mt-4">
            <Link href={`/campaigns/${preview.campaignSlug}`}>
              Open campaign
            </Link>
          </Button>
        </>
      ) : (
        <>
          <p className="mt-5 text-muted-foreground text-sm">
            Accepting adds you to this campaign and shows your name to everyone
            in it.
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button
              type="button"
              disabled={accept.isPending}
              onClick={() => {
                setError(null);
                accept.mutate(reference);
              }}
            >
              <LoadingSwap isLoading={accept.isPending}>
                Accept invitation
              </LoadingSwap>
            </Button>
            <Button asChild variant="ghost" disabled={accept.isPending}>
              <Link href="/campaigns">Not now</Link>
            </Button>
          </div>
        </>
      )}

      <div aria-live="polite" className="min-h-5 pt-3 text-sm">
        {error ? <p className="text-destructive">{error}</p> : null}
      </div>
    </div>
  );
}
