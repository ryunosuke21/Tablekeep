import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";

import { Badge } from "@tablekeep/ui/components/badge";

import { CampaignNav } from "@/components/campaigns/campaign-nav";
import { roleLabel } from "@/lib/campaign-format";

import { getCampaign } from "./_lib/get-campaign";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { campaign } = await getCampaign(slug);

  return {
    title: `${campaign.name} | Tablekeep`,
    description: campaign.description ?? "A campaign in Tablekeep.",
  };
}

export default async function CampaignLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { campaign, role, members } = await getCampaign(slug);

  return (
    <main className="relative mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-8 sm:px-6 sm:py-10">
      <nav aria-label="Breadcrumb" className="text-muted-foreground text-sm">
        <Link href="/campaigns" className="hover:text-foreground">
          Campaigns
        </Link>
        <span aria-hidden="true"> / </span>
        <span className="text-foreground">{campaign.name}</span>
      </nav>

      <header className="mt-4 flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="min-w-0 break-words font-semibold text-3xl tracking-[-0.04em]">
            {campaign.name}
          </h1>
          <Badge variant={role === "dm" ? "default" : "outline"}>
            {roleLabel(role)}
          </Badge>
          {campaign.status === "archived" ? (
            <Badge variant="destructive">Archived</Badge>
          ) : null}
        </div>
        <p className="text-muted-foreground text-sm">
          {members.length} {members.length === 1 ? "member" : "members"}
          {campaign.status === "archived"
            ? " · read-only while archived"
            : null}
        </p>
      </header>

      <div className="mt-6 border-b">
        <CampaignNav slug={slug} isDm={role === "dm"} />
      </div>

      <div className="pt-6 pb-12">{children}</div>
    </main>
  );
}
