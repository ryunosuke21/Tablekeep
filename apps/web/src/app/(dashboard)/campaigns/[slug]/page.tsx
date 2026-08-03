import Link from "next/link";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@tablekeep/ui/components/avatar";
import { Badge } from "@tablekeep/ui/components/badge";
import { Button } from "@tablekeep/ui/components/button";

import { OccurrenceList } from "@/components/campaigns/occurrence-list";
import { ScheduleSummary } from "@/components/campaigns/schedule-summary";
import {
  formatSessionDay,
  formatSessionRange,
  roleLabel,
} from "@/lib/campaign-format";

import { getCampaign } from "./_lib/get-campaign";

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-[11px] text-muted-foreground uppercase tracking-[0.12em]">
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export default async function CampaignOverviewPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { campaign, members, role, schedule, ...dmOnly } =
    await getCampaign(slug);
  const isDm = role === "dm";
  const pendingInviteCount =
    "pendingInviteCount" in dmOnly ? dmOnly.pendingInviteCount : undefined;
  const timeZone = schedule.timeZone;
  const nextSession = schedule.occurrences.find(
    (occurrence) => occurrence.state !== "cancelled" && occurrence.startsAt,
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
      <div className="space-y-6">
        <Section
          title="Session ledger"
          action={
            isDm && campaign.status === "active" ? (
              <Button asChild variant="ghost" size="sm">
                <Link href={`/campaigns/${slug}/settings`}>Edit cadence</Link>
              </Button>
            ) : null
          }
        >
          <div className="rounded-lg bg-muted/40 p-3">
            <p className="text-[11px] text-muted-foreground uppercase tracking-[0.1em]">
              Next session
            </p>
            <p className="mt-1 font-medium text-lg tracking-[-0.02em]">
              {nextSession?.startsAt
                ? formatSessionDay(nextSession.startsAt, timeZone)
                : "Not scheduled"}
            </p>
            {nextSession?.startsAt ? (
              <p className="text-muted-foreground text-sm tabular-nums">
                {formatSessionRange(
                  nextSession.startsAt,
                  nextSession.endsAt,
                  timeZone,
                )}
                {timeZone ? ` · ${timeZone}` : ""}
              </p>
            ) : (
              <p className="text-muted-foreground text-sm">
                {isDm
                  ? "Set a cadence in Settings, or add a single session below."
                  : "Your DM has not scheduled the next session yet."}
              </p>
            )}
          </div>

          <div className="mt-5">
            <h3 className="mb-2 text-[11px] text-muted-foreground uppercase tracking-[0.1em]">
              Cadence
            </h3>
            <ScheduleSummary schedule={schedule} />
          </div>

          <div className="mt-5">
            <h3 className="mb-2 text-[11px] text-muted-foreground uppercase tracking-[0.1em]">
              Upcoming and exceptions
            </h3>
            <OccurrenceList
              campaignId={campaign.id}
              schedule={schedule}
              canManage={isDm && campaign.status === "active"}
            />
          </div>
        </Section>
      </div>

      <div className="space-y-6">
        <Section title="About">
          {campaign.description ? (
            <p className="text-sm leading-relaxed">{campaign.description}</p>
          ) : (
            <p className="text-muted-foreground text-sm">
              No description yet.
              {isDm ? " Add one in Settings so the card reads clearly." : ""}
            </p>
          )}
        </Section>

        <Section
          title="Table"
          action={
            <Button asChild variant="ghost" size="sm">
              <Link href={`/campaigns/${slug}/members`}>Manage</Link>
            </Button>
          }
        >
          <ul className="space-y-2">
            {members.slice(0, 6).map((member) => (
              <li key={member.id} className="flex items-center gap-3">
                <Avatar size="sm">
                  {member.image ? (
                    <AvatarImage src={member.image} alt="" />
                  ) : null}
                  <AvatarFallback>{initials(member.name)}</AvatarFallback>
                </Avatar>
                <span className="min-w-0 flex-1 truncate text-sm">
                  {member.name}
                </span>
                <Badge variant={member.role === "dm" ? "default" : "outline"}>
                  {roleLabel(member.role)}
                </Badge>
              </li>
            ))}
          </ul>
          {members.length > 6 ? (
            <p className="mt-3 text-muted-foreground text-sm">
              and {members.length - 6} more
            </p>
          ) : null}
        </Section>

        {isDm ? (
          <Section title="DM actions">
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href={`/campaigns/${slug}/members`}>Invite players</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href={`/campaigns/${slug}/settings`}>
                  Campaign settings
                </Link>
              </Button>
            </div>
            {pendingInviteCount !== undefined && pendingInviteCount > 0 ? (
              <p className="mt-3 text-muted-foreground text-sm">
                {pendingInviteCount} pending{" "}
                {pendingInviteCount === 1 ? "invitation" : "invitations"}.
              </p>
            ) : null}
          </Section>
        ) : null}
      </div>
    </div>
  );
}
