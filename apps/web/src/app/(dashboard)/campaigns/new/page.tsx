import type { Metadata } from "next";
import Link from "next/link";

import { NewCampaignForm } from "@/components/campaigns/new-campaign-form";
import { MAX_ACTIVE_CAMPAIGNS_PER_USER } from "@/lib/constants";

export const metadata: Metadata = {
  title: "New campaign | Tablekeep",
  description: "Create a campaign you will run.",
};

export default function NewCampaignPage() {
  return (
    <main className="flex w-full flex-1 flex-col px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <nav aria-label="Breadcrumb" className="text-muted-foreground text-sm">
        <Link href="/campaigns" className="hover:text-foreground">
          Campaigns
        </Link>
        <span aria-hidden="true"> / </span>
        <span className="text-foreground">New</span>
      </nav>

      <div className="mt-6">
        <NewCampaignForm />
      </div>

      <p className="mt-8 pb-8 text-muted-foreground text-xs">
        During the beta you can keep up to {MAX_ACTIVE_CAMPAIGNS_PER_USER}{" "}
        active campaigns.
      </p>
    </main>
  );
}
