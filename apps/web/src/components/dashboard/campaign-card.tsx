import { IconArrowUpRight, IconClock } from "@tabler/icons-react";
import Link from "next/link";

import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
} from "@tablekeep/ui/components/avatar";
import { Card, CardContent } from "@tablekeep/ui/components/card";

import type { RouterOutputs } from "@/trpc/react";

export type CampaignListItem =
  RouterOutputs["campaign"]["list"]["items"][number];

// Exhaustive over the campaign_colors enum: a new value fails type-checking
// here instead of rendering an unstyled card.
const colorClasses: Record<CampaignListItem["colors"], string> = {
  lilac: "bg-campaign-lilac",
  rose: "bg-campaign-rose",
  sage: "bg-campaign-sage",
  sky: "bg-campaign-sky",
};

const avatarToneClasses = [
  "bg-violet-200 text-violet-950 dark:bg-violet-800 dark:text-violet-50",
  "bg-rose-200 text-rose-950 dark:bg-rose-800 dark:text-rose-50",
  "bg-emerald-200 text-emerald-950 dark:bg-emerald-800 dark:text-emerald-50",
  "bg-sky-200 text-sky-950 dark:bg-sky-800 dark:text-sky-50",
] as const;

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function formatNextSession(
  nextSession: CampaignListItem["nextSession"],
) {
  if (!nextSession) {
    return "Next session not scheduled";
  }

  const date = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: nextSession.timeZone,
  }).format(nextSession.startsAt);
  const timeFormatter = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: nextSession.timeZone,
  });
  const startTime = timeFormatter.format(nextSession.startsAt);
  const endTime = timeFormatter.format(nextSession.endsAt);

  return `${date} · ${startTime}–${endTime}`;
}

export function CampaignCard({ campaign }: { campaign: CampaignListItem }) {
  const visibleMembers = campaign.members.slice(0, 4);
  const remainingMembers = Math.max(
    campaign.memberCount - visibleMembers.length,
    0,
  );

  return (
    <Link
      href={`/campaigns/${campaign.slug}`}
      aria-label={`Open ${campaign.name}`}
      className="group block h-full rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <Card
        className={`h-full min-h-44 gap-0 py-0 transition-[transform,box-shadow,ring-color] duration-200 group-hover:-translate-y-0.5 group-hover:shadow-lg group-hover:ring-foreground/20 motion-reduce:transform-none motion-reduce:transition-none ${colorClasses[campaign.colors]}`}
      >
        <CardContent className="flex h-full min-h-44 flex-col p-5">
          <div className="flex items-start justify-between gap-3">
            <h3 className="min-w-0 break-words font-semibold text-base tracking-[-0.02em]">
              {campaign.name}
            </h3>
            <span className="shrink-0 rounded-full bg-background/55 px-2 py-1 font-medium text-[9px] text-foreground/65 uppercase tracking-[0.12em]">
              {campaign.role === "dm" ? "DM" : "Player"}
            </span>
          </div>

          <p className="mt-2 flex items-center gap-1.5 text-foreground/60 text-xs">
            <IconClock className="size-3.5" />
            <span>{formatNextSession(campaign.nextSession)}</span>
          </p>

          {campaign.description ? (
            <p className="mt-3 line-clamp-2 text-foreground/70 text-sm leading-snug">
              {campaign.description}
            </p>
          ) : null}

          <div className="mt-auto flex items-end justify-between pt-7">
            <AvatarGroup
              aria-label={`${campaign.memberCount} campaign members`}
            >
              {visibleMembers.map((member, index) => (
                <Avatar
                  key={member.id}
                  size="sm"
                  title={member.name}
                  aria-label={member.name}
                >
                  {member.imageUrl ? (
                    <AvatarImage src={member.imageUrl} alt="" />
                  ) : null}
                  <AvatarFallback className={avatarToneClasses[index % 4]}>
                    {getInitials(member.name)}
                  </AvatarFallback>
                </Avatar>
              ))}
              {remainingMembers > 0 ? (
                <AvatarGroupCount className="bg-background/70 text-foreground">
                  +{remainingMembers}
                </AvatarGroupCount>
              ) : null}
            </AvatarGroup>

            <span
              aria-hidden="true"
              className="flex size-8 items-center justify-center rounded-full bg-background/70 text-foreground shadow-sm transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 motion-reduce:transform-none motion-reduce:transition-none"
            >
              <IconArrowUpRight className="size-4" />
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
