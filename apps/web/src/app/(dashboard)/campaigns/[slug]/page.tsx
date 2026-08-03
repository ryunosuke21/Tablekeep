import { IconCalendarEvent, IconUsers } from "@tabler/icons-react";
import Link from "next/link";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@tablekeep/ui/components/avatar";
import { Badge } from "@tablekeep/ui/components/badge";
import { Button } from "@tablekeep/ui/components/button";

import { ScheduleSummary } from "@/components/campaigns/schedule-summary";
import {
  formatSessionDay,
  formatSessionTime,
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

function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-2xl border bg-background p-5 sm:p-6 ${className}`}
    >
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
  const { campaign, members, role, schedule } = await getCampaign(slug);
  const isDm = role === "dm";
  const nextSession = schedule.occurrences.find(
    (occurrence) => occurrence.state !== "cancelled" && occurrence.startsAt,
  );

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(19rem,.75fr)]">
      <div className="space-y-6">
        <Card>
          <div className="flex items-start gap-3">
            <div className="grid size-10 shrink-0 place-items-center rounded-full bg-muted">
              <IconCalendarEvent className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-muted-foreground text-xs uppercase tracking-[0.12em]">
                Next session
              </p>
              <p className="mt-2 font-semibold text-2xl tracking-[-0.03em] sm:text-3xl">
                {nextSession?.startsAt
                  ? formatSessionDay(nextSession.startsAt, schedule.timeZone)
                  : "Nothing scheduled"}
              </p>
              <p className="mt-1 text-muted-foreground">
                {nextSession?.startsAt
                  ? `Starts at ${formatSessionTime(nextSession.startsAt, schedule.timeZone)}`
                  : isDm
                    ? "Choose when your table plays in Settings."
                    : "Your DM has not added a session yet."}
              </p>
            </div>
            {isDm && campaign.status === "active" ? (
              <Button asChild variant="outline" size="sm">
                <Link href={`/campaigns/${slug}/settings`}>Edit schedule</Link>
              </Button>
            ) : null}
          </div>
          {schedule.recurrence ? (
            <div className="mt-6 border-t pt-5">
              <ScheduleSummary schedule={schedule} />
            </div>
          ) : null}
        </Card>

        <Card>
          <h2 className="font-medium text-lg tracking-[-0.02em]">
            About this campaign
          </h2>
          <p className="mt-3 max-w-3xl text-muted-foreground text-sm leading-7">
            {campaign.description ??
              (isDm
                ? "Add a short description in Settings so everyone knows what this campaign is about."
                : "No description has been added yet.")}
          </p>
        </Card>
      </div>

      <Card>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <IconUsers className="size-4 text-muted-foreground" />
            <h2 className="font-medium">Members</h2>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link href={`/campaigns/${slug}/members`}>See all</Link>
          </Button>
        </div>
        <ul className="mt-5 space-y-4">
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
      </Card>
    </div>
  );
}
