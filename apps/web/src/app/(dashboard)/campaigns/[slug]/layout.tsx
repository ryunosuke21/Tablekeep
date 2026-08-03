import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";

import { CampaignNav } from "@/components/campaigns/campaign-nav";
import { CampaignProfileHeader } from "@/components/campaigns/campaign-profile-header";

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
    <main className="relative flex w-full flex-1 flex-col px-3 py-5 sm:px-6 sm:py-7 lg:px-8">
      <nav aria-label="Breadcrumb" className="text-muted-foreground text-sm">
        <Link href="/campaigns" className="hover:text-foreground">
          Campaigns
        </Link>
        <span aria-hidden="true"> / </span>
        <span className="text-foreground">{campaign.name}</span>
      </nav>

      <div className="mt-4">
        <CampaignProfileHeader
          campaign={campaign}
          role={role}
          memberCount={members.length}
        />
      </div>

      <div className="mt-5 border-b px-1 sm:px-7">
        <CampaignNav slug={slug} isDm={role === "dm"} />
      </div>

      <div className="px-1 pt-7 pb-12 sm:px-7">{children}</div>
    </main>
  );
}
