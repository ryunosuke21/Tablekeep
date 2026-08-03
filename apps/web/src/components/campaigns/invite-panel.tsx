"use client";

import { IconUserPlus } from "@tabler/icons-react";

import { Button } from "@tablekeep/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@tablekeep/ui/components/dialog";

import type { RouterOutputs } from "@/trpc/react";

import { EmailInviteForm } from "./email-invite-form";
import { InviteLinkField } from "./invite-link-field";

type Invites = RouterOutputs["campaign"]["invites"]["list"];

export function InvitePanel({
  campaignId,
  invites,
}: {
  campaignId: string;
  invites: Invites;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>
          <IconUserPlus />
          Invite people
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Invite people</DialogTitle>
          <DialogDescription>
            Send a private email invitation or share one table-wide link.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-2 space-y-7">
          <section className="space-y-3 rounded-xl border p-4">
            <div>
              <h3 className="font-medium">Email invitation</h3>
              <p className="mt-1 text-muted-foreground text-sm">
                Only the invited address can accept it.
              </p>
            </div>
            <EmailInviteForm campaignId={campaignId} />
          </section>
          <section className="space-y-3 rounded-xl border p-4">
            <div>
              <h3 className="font-medium">Shareable link</h3>
              <p className="mt-1 text-muted-foreground text-sm">
                Anyone with this code can join while it is active.
              </p>
            </div>
            <InviteLinkField
              campaignId={campaignId}
              linkCode={invites.linkCodes[0]}
            />
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
