import { redirect } from "next/navigation";

import { InvitePanel } from "@/components/campaigns/invite-panel";
import { MemberTable } from "@/components/campaigns/member-table";
import { formatDate, roleLabel } from "@/lib/campaign-format";
import { getSession } from "@/server/better-auth/server";
import { api } from "@/trpc/server";

import { getCampaign } from "../_lib/get-campaign";

const historyLabels = {
  joined: "joined",
  left: "left",
  removed: "was removed",
  role_changed: "changed role",
} as const;

export default async function CampaignMembersPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [{ campaign, role }, session] = await Promise.all([
    getCampaign(slug),
    getSession(),
  ]);

  if (!session?.user) {
    redirect("/sign-in");
  }

  const isDm = role === "dm";
  // Both calls are authorized server-side; the invite list is DM-only.
  const [roster, invites] = await Promise.all([
    api.campaign.members.list({ campaignId: campaign.id }),
    isDm ? api.campaign.invites.list({ campaignId: campaign.id }) : null,
  ]);
  const canManage = isDm && campaign.status === "active";
  const nameByUserId = new Map(
    roster.members.map((member) => [member.userId, member.name]),
  );

  return (
    <div className="space-y-8">
      <section>
        <h2 className="font-medium text-lg tracking-[-0.02em]">Roster</h2>
        <p className="mt-1 text-muted-foreground text-sm">
          {canManage
            ? "Change roles, remove players, or leave the campaign yourself."
            : "Everyone at this table. You can leave the campaign from here."}
        </p>
        <div className="mt-4 overflow-x-auto rounded-xl border">
          <MemberTable
            campaignId={campaign.id}
            campaignName={campaign.name}
            members={roster.members}
            viewerUserId={session.user.id}
            viewerRole={role}
            canManage={canManage}
          />
        </div>
        {isDm && !canManage ? (
          <p className="mt-3 text-muted-foreground text-sm">
            This campaign is archived, so membership cannot change. Restore it
            in Settings first.
          </p>
        ) : null}
      </section>

      {invites && canManage ? (
        <section>
          <h2 className="font-medium text-lg tracking-[-0.02em]">
            Invitations
          </h2>
          <p className="mt-1 text-muted-foreground text-sm">
            Only you and other DMs can see these.
          </p>
          <div className="mt-4">
            <InvitePanel campaignId={campaign.id} invites={invites} />
          </div>
        </section>
      ) : null}

      {isDm && roster.history && roster.history.length > 0 ? (
        <section>
          <h2 className="font-medium text-lg tracking-[-0.02em]">
            Membership changes
          </h2>
          <p className="mt-1 text-muted-foreground text-sm">
            Kept so the campaign record survives a removal. DM-only.
          </p>
          <ul className="mt-4 divide-y border-y">
            {roster.history.map((event) => (
              <li
                key={event.id}
                className="flex flex-wrap items-baseline justify-between gap-2 py-2 text-sm"
              >
                <span>
                  {(event.userId ? nameByUserId.get(event.userId) : null) ??
                    "A former member"}{" "}
                  <span className="text-muted-foreground">
                    {historyLabels[event.action]} as {roleLabel(event.role)}
                  </span>
                </span>
                <span className="text-muted-foreground text-xs tabular-nums">
                  {formatDate(event.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
