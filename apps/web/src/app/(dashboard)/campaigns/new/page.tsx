import type { Metadata } from "next";
import Link from "next/link";

import { CampaignForm } from "@/components/campaigns/campaign-form";
import { MAX_ACTIVE_CAMPAIGNS_PER_USER } from "@/lib/constants";

export const metadata: Metadata = {
  title: "New campaign | Tablekeep",
  description: "Create a campaign you will run.",
};

export default function NewCampaignPage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-8 sm:px-6 sm:py-10">
      <nav aria-label="Breadcrumb" className="text-muted-foreground text-sm">
        <Link href="/campaigns" className="hover:text-foreground">
          Campaigns
        </Link>
        <span aria-hidden="true"> / </span>
        <span className="text-foreground">New</span>
      </nav>

      <header className="mt-5">
        <h1 className="font-semibold text-3xl tracking-[-0.04em]">
          New campaign
        </h1>
        <p className="mt-2 text-muted-foreground">
          You become its DM. Invite players and set a session cadence once it
          exists.
        </p>
      </header>

      <div className="mt-8">
        <CampaignForm mode="create" />
      </div>

      <p className="mt-8 text-muted-foreground text-xs">
        During the beta you can keep up to {MAX_ACTIVE_CAMPAIGNS_PER_USER}{" "}
        active campaigns.
      </p>
    </main>
  );
}
