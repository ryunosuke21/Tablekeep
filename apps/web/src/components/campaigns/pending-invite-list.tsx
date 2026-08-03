"use client";

import { useMemo, useState } from "react";
import { IconLink, IconMail } from "@tabler/icons-react";
import { useRouter } from "next/navigation";

import { Badge } from "@tablekeep/ui/components/badge";
import { Button } from "@tablekeep/ui/components/button";
import {
  createFilter,
  type Filter,
  type FilterFieldConfig,
  Filters,
} from "@tablekeep/ui/components/filters";
import { LoadingSwap } from "@tablekeep/ui/components/loading-swap";
import { toast } from "@tablekeep/ui/components/sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@tablekeep/ui/components/table";

import {
  CAMPAIGN_ROLE_LABELS,
  formatDate,
  formatInviteCodeDisplay,
} from "@/lib/campaign-format";
import type { RouterOutputs } from "@/trpc/react";
import { api } from "@/trpc/react";

import { ConfirmActionDialog } from "./confirm-action-dialog";

type Invites = RouterOutputs["campaign"]["invites"]["list"];
type InviteRow =
  | {
      id: string;
      type: "email";
      target: string;
      role: "dm" | "player";
      createdAt: Date;
      expiresAt: Date;
    }
  | {
      id: string;
      type: "link";
      target: string;
      role: "dm" | "player";
      createdAt: Date;
      expiresAt: Date;
    };

const fields: FilterFieldConfig<string>[] = [
  {
    key: "status",
    label: "Status",
    type: "select",
    options: [{ value: "pending", label: "Pending" }],
  },
  {
    key: "type",
    label: "Type",
    type: "multiselect",
    options: [
      { value: "email", label: "Email" },
      { value: "link", label: "Link" },
    ],
  },
  {
    key: "role",
    label: "Role",
    type: "multiselect",
    options: [
      { value: "player", label: "Player" },
      { value: "dm", label: "DM" },
    ],
  },
  {
    key: "recipient",
    label: "Recipient",
    type: "text",
    placeholder: "Search email…",
  },
];

function matches(row: InviteRow, filter: Filter<string>) {
  if (filter.field === "status")
    return filter.values.length === 0 || filter.values.includes("pending");
  if (filter.field === "type")
    return filter.values.length === 0 || filter.values.includes(row.type);
  if (filter.field === "role")
    return filter.values.length === 0 || filter.values.includes(row.role);
  if (filter.field === "recipient") {
    const query = filter.values[0]?.toLowerCase() ?? "";
    return !query || row.target.toLowerCase().includes(query);
  }
  return true;
}

function InviteActions({
  campaignId,
  row,
}: {
  campaignId: string;
  row: InviteRow;
}) {
  const router = useRouter();
  const resend = api.campaign.invites.resend.useMutation({
    onSuccess: () => {
      toast.success(`Invitation resent to ${row.target}`);
      router.refresh();
    },
    onError: (error) =>
      toast.error("The invitation was not resent", {
        description: error.message,
      }),
  });
  const revoke = api.campaign.invites.revoke.useMutation({
    onSuccess: () => {
      toast.success("Invitation revoked");
      router.refresh();
    },
    onError: (error) =>
      toast.error("The invitation was not revoked", {
        description: error.message,
      }),
  });
  const isPending = resend.isPending || revoke.isPending;

  return (
    <div className="flex items-center justify-end gap-2">
      {row.type === "email" ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isPending}
          onClick={() => resend.mutate({ campaignId, invitationId: row.id })}
        >
          <LoadingSwap isLoading={resend.isPending}>Resend</LoadingSwap>
        </Button>
      ) : null}
      <ConfirmActionDialog
        trigger={
          <Button type="button" variant="ghost" size="sm" disabled={isPending}>
            Revoke
          </Button>
        }
        title="Revoke this invitation?"
        consequence="This invitation stops working immediately. Existing members keep their access."
        confirmLabel="Revoke invitation"
        cancelLabel="Keep it"
        isPending={revoke.isPending}
        onConfirm={() =>
          revoke.mutate(
            row.type === "email"
              ? { campaignId, kind: "email", invitationId: row.id }
              : { campaignId, kind: "link", role: row.role },
          )
        }
      />
    </div>
  );
}

export function PendingInviteList({
  campaignId,
  invites,
}: {
  campaignId: string;
  invites: Invites;
}) {
  const [filters, setFilters] = useState<Filter<string>[]>([
    createFilter("status", "is", ["pending"]),
  ]);
  const rows = useMemo<InviteRow[]>(
    () =>
      [
        ...invites.emailInvitations.map((invite) => ({
          id: invite.id,
          type: "email" as const,
          target: invite.email,
          role: invite.role,
          createdAt: invite.createdAt,
          expiresAt: invite.expiresAt,
        })),
        ...invites.linkCodes.map((invite) => ({
          id: invite.code,
          type: "link" as const,
          target: formatInviteCodeDisplay(invite.code),
          role: invite.role,
          createdAt: invite.createdAt,
          expiresAt: invite.expiresAt,
        })),
      ].filter((row) => filters.every((filter) => matches(row, filter))),
    [filters, invites],
  );

  return (
    <div className="space-y-5">
      <Filters
        filters={filters}
        fields={fields}
        onChange={setFilters}
        size="sm"
      />
      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed px-6 py-12 text-center">
          <p className="font-medium text-sm">
            No pending invites match these filters
          </p>
          <p className="mt-1 text-muted-foreground text-sm">
            Clear a filter or invite someone new.
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:hidden">
            {rows.map((row) => (
              <article
                key={`${row.type}-${row.id}`}
                className="rounded-2xl border bg-background p-5 shadow-xs"
              >
                <div className="flex items-start gap-3">
                  <div className="grid size-10 shrink-0 place-items-center rounded-full bg-muted">
                    {row.type === "email" ? (
                      <IconMail className="size-4" />
                    ) : (
                      <IconLink className="size-4" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-sm">{row.target}</p>
                    <p
                      className="mt-1 text-muted-foreground text-xs"
                      suppressHydrationWarning
                    >
                      Expires {formatDate(row.expiresAt)}
                    </p>
                  </div>
                  <Badge variant="outline">
                    {CAMPAIGN_ROLE_LABELS[row.role]}
                  </Badge>
                </div>
                <div className="mt-5 border-t pt-4">
                  <InviteActions campaignId={campaignId} row={row} />
                </div>
              </article>
            ))}
          </div>
          <div className="hidden overflow-hidden rounded-2xl border md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invitation</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={`${row.type}-${row.id}`}>
                    <TableCell className="font-medium">{row.target}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-2 text-sm">
                        {row.type === "email" ? (
                          <IconMail className="size-4" />
                        ) : (
                          <IconLink className="size-4" />
                        )}
                        {row.type === "email" ? "Email" : "Link"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {CAMPAIGN_ROLE_LABELS[row.role]}
                      </Badge>
                    </TableCell>
                    <TableCell
                      className="text-muted-foreground text-sm"
                      suppressHydrationWarning
                    >
                      {formatDate(row.expiresAt)}
                    </TableCell>
                    <TableCell>
                      <InviteActions campaignId={campaignId} row={row} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}
