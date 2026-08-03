import { redirect } from "next/navigation";

import { MemberTable } from "@/components/campaigns/member-table";
import { getSession } from "@/server/better-auth/server";
import { api } from "@/trpc/server";

import { getCampaign } from "../_lib/get-campaign";

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
  const roster = await api.campaign.members.list({ campaignId: campaign.id });
  const canManage = isDm && campaign.status === "active";

  return (
    <div className="space-y-8">
      <section>
        <h2 className="font-medium text-xl tracking-[-0.03em]">Members</h2>
        <p className="mt-1 text-muted-foreground text-sm">
          {canManage
            ? "Change roles, remove players, or leave the campaign yourself."
            : "Everyone at this table. You can leave the campaign from here."}
        </p>
        <div className="mt-6">
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
    </div>
  );
}
