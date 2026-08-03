import { notFound } from "next/navigation";

import { ArchiveCampaignDialog } from "@/components/campaigns/archive-campaign-dialog";
import { CampaignForm } from "@/components/campaigns/campaign-form";
import { LeaveCampaignDialog } from "@/components/campaigns/leave-campaign-dialog";
import { ScheduleForm } from "@/components/campaigns/schedule-form";

import { getCampaign } from "../_lib/get-campaign";

function SettingsSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border p-4 sm:p-5">
      <h2 className="font-medium text-lg tracking-[-0.02em]">{title}</h2>
      <p className="mt-1 text-muted-foreground text-sm">{description}</p>
      <div className="mt-5">{children}</div>
    </section>
  );
}

export default async function CampaignSettingsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { campaign, members, role, schedule } = await getCampaign(slug);

  // Settings is DM-only. The server also refuses every DM mutation for players.
  if (role !== "dm") {
    notFound();
  }

  const isArchived = campaign.status === "archived";
  const dmCount = members.filter((member) => member.role === "dm").length;

  return (
    <div className="space-y-6">
      {isArchived ? (
        <p className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm">
          This campaign is archived. Restore it below before changing details,
          the schedule, or membership.
        </p>
      ) : null}

      <SettingsSection
        title="Details"
        description="What everyone in the campaign sees on the card and the overview."
      >
        {isArchived ? (
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="text-muted-foreground">Name</dt>
              <dd>{campaign.name}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Description</dt>
              <dd>{campaign.description ?? "None"}</dd>
            </div>
          </dl>
        ) : (
          <CampaignForm
            mode="edit"
            campaignId={campaign.id}
            defaultValues={{
              name: campaign.name,
              description: campaign.description ?? "",
              colors: campaign.colors,
            }}
          />
        )}
      </SettingsSection>

      <SettingsSection
        title="Campaign address"
        description="The link stays the same when you rename the campaign, so shared links keep working."
      >
        <p className="break-all font-mono text-sm">
          /campaigns/{campaign.slug}
        </p>
      </SettingsSection>

      <SettingsSection
        title="Session cadence"
        description="Sessions come from this rule. Cancel or move single weeks from the overview ledger."
      >
        {isArchived ? (
          <p className="text-muted-foreground text-sm">
            Restore the campaign to change its cadence.
          </p>
        ) : (
          <ScheduleForm campaignId={campaign.id} schedule={schedule} />
        )}
      </SettingsSection>

      <SettingsSection
        title="Archive"
        description="Archiving keeps every record and stops all changes. Nothing is deleted."
      >
        <ArchiveCampaignDialog
          campaignId={campaign.id}
          campaignName={campaign.name}
          status={campaign.status}
        />
      </SettingsSection>

      <SettingsSection
        title="Your membership"
        description="Leaving removes your own access. It does not delete the campaign."
      >
        <LeaveCampaignDialog
          campaignId={campaign.id}
          campaignName={campaign.name}
          isOnlyDm={dmCount === 1}
        />
      </SettingsSection>
    </div>
  );
}
