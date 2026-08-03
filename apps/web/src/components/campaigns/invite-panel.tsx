import type { RouterOutputs } from "@/trpc/react";

import { EmailInviteForm } from "./email-invite-form";
import { InviteLinkField } from "./invite-link-field";
import { PendingInviteList } from "./pending-invite-list";

type Invites = RouterOutputs["campaign"]["invites"]["list"];

/**
 * DM-only invitation controls. This panel is only rendered for a DM, and the
 * data it shows comes from a DM-only procedure — the server is the boundary.
 */
export function InvitePanel({
  campaignId,
  invites,
}: {
  campaignId: string;
  invites: Invites;
}) {
  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <div>
          <h3 className="font-medium text-sm">Share a link or code</h3>
          <p className="text-muted-foreground text-sm">
            Anyone with the code can join until it expires or you revoke it.
          </p>
        </div>
        <InviteLinkField
          campaignId={campaignId}
          linkCode={invites.linkCodes[0]}
        />
      </section>

      <section className="space-y-3">
        <div>
          <h3 className="font-medium text-sm">Invite by email</h3>
          <p className="text-muted-foreground text-sm">
            Sends one invitation that only the invited address can accept.
          </p>
        </div>
        <EmailInviteForm campaignId={campaignId} />
      </section>

      <section className="space-y-3">
        <h3 className="font-medium text-sm">Pending invitations</h3>
        <PendingInviteList
          campaignId={campaignId}
          invitations={invites.emailInvitations}
        />
      </section>
    </div>
  );
}
