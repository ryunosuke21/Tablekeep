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

export function MemberTable({
  campaignId,
  campaignName,
  members,
  viewerUserId,
  viewerRole,
  canManage,
}: {
  campaignId: string;
  campaignName: string;
  members: CampaignMember[];
  viewerUserId: string;
  viewerRole: "dm" | "player";
  canManage: boolean;
}) {
  const dmCount = members.filter((member) => member.role === "dm").length;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Member</TableHead>
          <TableHead>Role</TableHead>
          <TableHead className="hidden sm:table-cell">Joined</TableHead>
          <TableHead className="text-right">
            <span className="sr-only">Actions</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {members.map((member) => {
          const isViewer = member.userId === viewerUserId;

          return (
            <TableRow key={member.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar size="sm">
                    {member.image ? (
                      <AvatarImage src={member.image} alt="" />
                    ) : null}
                    <AvatarFallback>{initials(member.name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-sm">
                      {member.name}
                      {isViewer ? (
                        <span className="ml-2 text-muted-foreground text-xs">
                          You
                        </span>
                      ) : null}
                    </p>
                    {/* Dates render in the reader's zone, which the server
                        cannot know: keep the client value. */}
                    <p
                      className="text-muted-foreground text-xs sm:hidden"
                      suppressHydrationWarning
                    >
                      Joined {formatDate(member.joinedAt)}
                    </p>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                {canManage && !isViewer ? (
                  <MemberRoleSelect
                    campaignId={campaignId}
                    memberId={member.id}
                    memberName={member.name}
                    role={member.role}
                  />
                ) : (
                  <Badge variant={member.role === "dm" ? "default" : "outline"}>
                    {CAMPAIGN_ROLE_LABELS[member.role]}
                  </Badge>
                )}
              </TableCell>
              <TableCell
                className="hidden text-muted-foreground text-sm tabular-nums sm:table-cell"
                suppressHydrationWarning
              >
                {formatDate(member.joinedAt)}
              </TableCell>
              <TableCell className="text-right">
                {isViewer && viewerRole === "dm" && dmCount === 1 ? (
                  // Leaving is blocked server-side for the only DM. The
                  // Settings page explains the two ways out.
                  <span className="text-muted-foreground text-xs">Only DM</span>
                ) : isViewer ? (
                  <LeaveCampaignDialog
                    campaignId={campaignId}
                    campaignName={campaignName}
                    isOnlyDm={false}
                    variant="ghost"
                  />
                ) : canManage ? (
                  <RemoveMemberDialog
                    campaignId={campaignId}
                    memberId={member.id}
                    memberName={member.name}
                    campaignName={campaignName}
                  />
                ) : null}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
