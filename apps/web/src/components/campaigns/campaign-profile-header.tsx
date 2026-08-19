"use client";

import { IconPlayerPlayFilled } from "@tabler/icons-react";
import Image from "next/image";
import Link from "next/link";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@tablekeep/ui/components/avatar";
import { Badge } from "@tablekeep/ui/components/badge";
import { Button } from "@tablekeep/ui/components/button";
import { cn } from "@tablekeep/ui/lib/utils";

import { roleLabel } from "@/lib/campaign-format";

const bannerColors = {
  lilac: "from-[#302454] via-[#684d8f] to-[#a783b6]",
  rose: "from-[#4b202a] via-[#8b4756] to-[#c48a91]",
  sage: "from-[#183d35] via-[#3d6d5d] to-[#86a287]",
  sky: "from-[#17364d] via-[#356b88] to-[#86aebe]",
} as const;

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function CampaignProfileHeader({
  campaign,
  role,
  memberCount,
}: {
  campaign: {
    id: string;
    name: string;
    description: string | null;
    logo: string | null;
    bannerImage: string | null;
    colors: keyof typeof bannerColors;
    status: "active" | "archived";
  };
  role: "dm" | "player";
  memberCount: number;
}) {
  return (
    <header>
      <div
        className={cn(
          "relative h-40 overflow-hidden rounded-2xl bg-gradient-to-br sm:h-56 lg:h-64",
          bannerColors[campaign.colors],
        )}
      >
        {campaign.bannerImage ? (
          <Image
            src={campaign.bannerImage}
            alt=""
            fill
            unoptimized
            priority
            className="object-cover"
            sizes="(max-width: 768px) 100vw, calc(100vw - 19rem)"
          />
        ) : (
          <div className="absolute inset-0 opacity-60 [background-image:radial-gradient(circle_at_78%_22%,rgba(255,255,255,.22),transparent_22%),linear-gradient(115deg,transparent_35%,rgba(255,255,255,.08)_35%,rgba(255,255,255,.08)_36%,transparent_36%)]" />
        )}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/35 to-transparent" />
      </div>

      <div className="relative flex flex-col gap-4 px-3 pb-1 sm:px-7 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex min-w-0 items-end gap-4 sm:gap-5">
          <Avatar className="-mt-12 size-24 shrink-0 border-4 border-background bg-background shadow-lg sm:-mt-16 sm:size-32">
            {campaign.logo ? <AvatarImage src={campaign.logo} alt="" /> : null}
            <AvatarFallback className="bg-foreground font-semibold text-2xl text-background sm:text-3xl">
              {initials(campaign.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 pb-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="break-words font-semibold text-2xl tracking-[-0.04em] sm:text-3xl lg:text-4xl">
                {campaign.name}
              </h1>
              <Badge variant={role === "dm" ? "default" : "outline"}>
                {roleLabel(role)}
              </Badge>
              {campaign.status === "archived" ? (
                <Badge variant="destructive">Archived</Badge>
              ) : null}
            </div>
            <p className="mt-1 text-muted-foreground text-sm">
              {memberCount} {memberCount === 1 ? "member" : "members"}
            </p>
          </div>
        </div>

        <Button asChild className="w-full shadow-sm sm:w-auto">
          <Link href={`/play/${campaign.id}`}>
            <IconPlayerPlayFilled />
            Launch
          </Link>
        </Button>
      </div>
    </header>
  );
}
