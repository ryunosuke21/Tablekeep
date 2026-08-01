import { redirect } from "next/navigation";

import { DashboardOverview } from "@/components/dashboard/dashboard-overview";
import { getSession } from "@/server/better-auth/server";
import { api } from "@/trpc/server";

export default async function DashboardPage() {
  const session = await getSession();

  if (!session) {
    redirect("/sign-in");
  }

  const [campaigns, characters] = await Promise.all([
    api.campaign.list(),
    api.character.list(),
  ]);

  return (
    <DashboardOverview
      campaigns={[...campaigns.items]}
      characters={[...characters.items]}
    />
  );
}
