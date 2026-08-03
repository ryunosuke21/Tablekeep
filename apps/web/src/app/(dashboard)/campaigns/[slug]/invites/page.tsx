import { notFound } from "next/navigation";

import { InvitePanel } from "@/components/campaigns/invite-panel";
import { PendingInviteList } from "@/components/campaigns/pending-invite-list";
import { api } from "@/trpc/server";

import { getCampaign } from "../_lib/get-campaign";

export default async function CampaignInvitesPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { campaign, role } = await getCampaign(slug);
  if (role !== "dm") notFound();
  const invites = await api.campaign.invites.list({ campaignId: campaign.id });
  const canManage = campaign.status === "active";

  return (
    <section>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-medium text-xl tracking-[-0.03em]">
            Pending invites
          </h2>
          <p className="mt-1 text-muted-foreground text-sm">
            Only campaign DMs can see and manage invitations.
          </p>
        </div>
        {canManage ? (
          <InvitePanel campaignId={campaign.id} invites={invites} />
        ) : null}
      </div>
      <div className="mt-6">
        <PendingInviteList campaignId={campaign.id} invites={invites} />
      </div>
    </section>
  );
}
