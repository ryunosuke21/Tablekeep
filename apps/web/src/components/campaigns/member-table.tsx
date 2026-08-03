"use client";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@tablekeep/ui/components/avatar";
import { Badge } from "@tablekeep/ui/components/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@tablekeep/ui/components/table";

import { CAMPAIGN_ROLE_LABELS, formatDate } from "@/lib/campaign-format";
import type { RouterOutputs } from "@/trpc/react";

import { LeaveCampaignDialog } from "./leave-campaign-dialog";
import { MemberRoleSelect } from "./member-role-select";
import { RemoveMemberDialog } from "./remove-member-dialog";

export type CampaignMember =
  RouterOutputs["campaign"]["members"]["list"]["members"][number];

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

type SharedProps = {
  campaignId: string;
  campaignName: string;
  viewerUserId: string;
  viewerRole: "dm" | "player";
  canManage: boolean;
  dmCount: number;
};

function MemberActions({
  member,
  ...props
}: SharedProps & { member: CampaignMember }) {
  const isViewer = member.userId === props.viewerUserId;
  if (isViewer && props.viewerRole === "dm" && props.dmCount === 1) {
    return <span className="text-muted-foreground text-xs">Only DM</span>;
  }
  if (isViewer) {
    return (
      <LeaveCampaignDialog
        campaignId={props.campaignId}
        campaignName={props.campaignName}
        isOnlyDm={false}
        variant="ghost"
      />
    );
  }
  if (props.canManage) {
    return (
      <RemoveMemberDialog
        campaignId={props.campaignId}
        memberId={member.id}
        memberName={member.name}
        campaignName={props.campaignName}
      />
    );
  }
  return null;
}

function RoleControl({
  member,
  ...props
}: SharedProps & { member: CampaignMember }) {
  const isViewer = member.userId === props.viewerUserId;
  return props.canManage && !isViewer ? (
    <MemberRoleSelect
      campaignId={props.campaignId}
      memberId={member.id}
      memberName={member.name}
      role={member.role}
    />
  ) : (
    <Badge variant={member.role === "dm" ? "default" : "outline"}>
      {CAMPAIGN_ROLE_LABELS[member.role]}
    </Badge>
  );
}

export function MemberTable(
  props: Omit<SharedProps, "dmCount"> & { members: CampaignMember[] },
) {
  const shared = {
    ...props,
    dmCount: props.members.filter((member) => member.role === "dm").length,
  };

  return (
    <>
      <div className="grid gap-4 md:hidden">
        {props.members.map((member) => (
          <article
            key={member.id}
            className="rounded-2xl border bg-background p-5 shadow-xs"
          >
            <div className="flex items-start gap-4">
              <Avatar className="size-12">
                {member.image ? (
                  <AvatarImage src={member.image} alt="" />
                ) : null}
                <AvatarFallback>{initials(member.name)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">
                  {member.name}
                  {member.userId === props.viewerUserId ? (
                    <span className="ml-2 text-muted-foreground text-xs">
                      You
                    </span>
                  ) : null}
                </p>
                <p
                  className="mt-1 text-muted-foreground text-xs"
                  suppressHydrationWarning
                >
                  Joined {formatDate(member.joinedAt)}
                </p>
              </div>
            </div>
            <div className="mt-5 flex items-center justify-between gap-3 border-t pt-4">
              <RoleControl member={member} {...shared} />
              <MemberActions member={member} {...shared} />
            </div>
          </article>
        ))}
      </div>

      <div className="hidden overflow-hidden rounded-2xl border md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Member</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {props.members.map((member) => (
              <TableRow key={member.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar size="sm">
                      {member.image ? (
                        <AvatarImage src={member.image} alt="" />
                      ) : null}
                      <AvatarFallback>{initials(member.name)}</AvatarFallback>
                    </Avatar>
                    <p className="truncate font-medium text-sm">
                      {member.name}
                      {member.userId === props.viewerUserId ? (
                        <span className="ml-2 text-muted-foreground text-xs">
                          You
                        </span>
                      ) : null}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <RoleControl member={member} {...shared} />
                </TableCell>
                <TableCell
                  className="text-muted-foreground text-sm tabular-nums"
                  suppressHydrationWarning
                >
                  {formatDate(member.joinedAt)}
                </TableCell>
                <TableCell className="text-right">
                  <MemberActions member={member} {...shared} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
